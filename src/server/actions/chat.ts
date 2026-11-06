"use server";

import { after } from "next/server";
import { backendEnabled } from "@/lib/backend";
import { sectionUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { currentStaff } from "@/server/staff";
import { notifyEnabled, runOrQueue, teamEmails } from "@/server/notify";
import { sendPush } from "@/server/push";

// Chat between the AOD team and each artist (supabase/migrations/20261105040000_chat.sql). One
// conversation per artist, shared by the whole team. The team sees who wrote each message; the
// artist only ever sees "Admin". Artists can't read the table: these actions check who is signed
// in and use the secret key.

export type ChatMessage = {
  id: string;
  fromArtist: boolean;
  sender: string; // the team member's name (team side only; the artist's side always says "Admin")
  body: string;
  at: string;
  read: boolean; // the other side has opened it
};
export type ChatSummary = Record<string, { last: { body: string; at: string; fromArtist: boolean }; unread: number }>;

export type ChatResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MAX = 2000;
const KEEP = 300; // the newest messages of a conversation that are loaded

type Row = { id: number; artist_id: string; from_artist: boolean; sender: string; body: string; created_at: string; read_at: string | null };
const toMessage = (r: Row, forArtist: boolean): ChatMessage => ({
  id: String(r.id),
  fromArtist: r.from_artist,
  sender: forArtist ? (r.from_artist ? "" : "Admin") : r.sender,
  body: r.body,
  at: r.created_at,
  read: r.read_at !== null,
});

const signedOut = { ok: false as const, error: "You're signed out. Please sign in again." };
const unavailable = { ok: false as const, error: "Chat isn't available right now." };

async function thisArtist() {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return null;
  const { data } = await (await createClient()).auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  const { data: artist } = await createAdminClient().from("artists").select("id, name, status").eq("email", email).limit(1).maybeSingle();
  return artist ? { id: String(artist.id), name: String(artist.name) } : null;
}

async function thisStaff() {
  if (!process.env.SUPABASE_SECRET_KEY) return null;
  return (await currentStaff())?.staff ?? null;
}

const cleanBody = (body: unknown) => (typeof body === "string" ? body.replace(/\r\n/g, "\n").trim().slice(0, MAX) : "");

// ---- The team's side ----

// For each artist with a conversation: the last message and how many of theirs are still unread.
export async function staffChatSummary(): Promise<ChatResult<{ summary: ChatSummary; unread: number }>> {
  if (!(await thisStaff())) return signedOut;
  const db = createAdminClient();
  const [{ data: recent }, { data: unreadRows }] = await Promise.all([
    db.from("chat_messages").select("artist_id, body, created_at, from_artist").order("created_at", { ascending: false }).limit(1000),
    db.from("chat_messages").select("artist_id").eq("from_artist", true).is("read_at", null).limit(5000),
  ]);
  const summary: ChatSummary = {};
  for (const r of recent ?? []) {
    const id = String(r.artist_id);
    summary[id] ??= { last: { body: String(r.body), at: String(r.created_at), fromArtist: !!r.from_artist }, unread: 0 };
  }
  let unread = 0;
  for (const r of unreadRows ?? []) {
    const id = String(r.artist_id);
    summary[id] ??= { last: { body: "", at: "", fromArtist: true }, unread: 0 };
    summary[id].unread++;
    unread++;
  }
  return { ok: true, summary, unread };
}

// One artist's conversation, oldest first. Opening it marks the artist's messages as read.
export async function staffChatOpen(artistId: string): Promise<ChatResult<{ messages: ChatMessage[] }>> {
  if (!(await thisStaff())) return signedOut;
  const db = createAdminClient();
  const { data, error } = await db.from("chat_messages").select("*").eq("artist_id", String(artistId)).order("created_at", { ascending: false }).limit(KEEP);
  if (error) return unavailable;
  const rows = ((data ?? []) as Row[]).reverse();
  if (rows.some((r) => r.from_artist && r.read_at === null)) {
    await db.from("chat_messages").update({ read_at: new Date().toISOString() }).eq("artist_id", String(artistId)).eq("from_artist", true).is("read_at", null);
  }
  return { ok: true, messages: rows.map((r) => toMessage(r, false)) };
}

export async function staffChatSend(artistId: string, body: string): Promise<ChatResult<{ message: ChatMessage }>> {
  const staff = await thisStaff();
  if (!staff) return signedOut;
  const text = cleanBody(body);
  if (!text) return { ok: false, error: "Write a message first." };
  const db = createAdminClient();
  const { data: artist } = await db.from("artists").select("id, name, email").eq("id", String(artistId)).maybeSingle();
  if (!artist) return { ok: false, error: "That artist wasn't found." };
  // Email the artist only when this starts a new run of messages, so a long back-and-forth sends one.
  const { count } = await db.from("chat_messages").select("id", { count: "exact", head: true }).eq("artist_id", artist.id).eq("from_artist", false).is("read_at", null);
  const { data, error } = await db.from("chat_messages").insert({ artist_id: artist.id, from_artist: false, sender: staff.name, body: text }).select("*").single();
  if (error || !data) return { ok: false, error: "Couldn't send just now. Please try again." };
  after(async () => {
    if (!count && artist.email) {
      await runOrQueue([
        {
          kind: "email",
          to: [String(artist.email)],
          subject: "You have a new message from AOD",
          text: `Hi ${String(artist.name).split(" ")[0]},

The AOD team sent you a message. Read it and reply in your artist portal: ${sectionUrl("artists", "/messages")}

AOD`,
        },
      ]);
    }
    // The phone's own banner, for every message; it never carries the text.
    await sendPush({ kind: "artist", artistId: String(artist.id) }, { title: "AOD", body: "You have a new message from the AOD team", url: sectionUrl("artists", "/messages"), tag: "aod-chat" });
  });
  return { ok: true, message: toMessage(data as Row, false) };
}

// ---- The artist's side ----

// The signed-in artist's conversation with "Admin", oldest first, and how many messages are unread.
// `markRead` is true while the Messages page is open: it marks the team's messages as read.
export async function artistChatLoad(markRead: boolean): Promise<ChatResult<{ messages: ChatMessage[]; unread: number }>> {
  const me = await thisArtist();
  if (!me) return signedOut;
  const db = createAdminClient();
  const { data, error } = await db.from("chat_messages").select("*").eq("artist_id", me.id).order("created_at", { ascending: false }).limit(KEEP);
  if (error) return unavailable;
  const rows = ((data ?? []) as Row[]).reverse();
  let unread = rows.filter((r) => !r.from_artist && r.read_at === null).length;
  if (markRead && unread) {
    await db.from("chat_messages").update({ read_at: new Date().toISOString() }).eq("artist_id", me.id).eq("from_artist", false).is("read_at", null);
    unread = 0;
  }
  return { ok: true, messages: rows.map((r) => toMessage(r, true)), unread };
}

export async function artistChatSend(body: string): Promise<ChatResult<{ message: ChatMessage }>> {
  const me = await thisArtist();
  if (!me) return signedOut;
  const text = cleanBody(body);
  if (!text) return { ok: false, error: "Write a message first." };
  const db = createAdminClient();
  const { count } = await db.from("chat_messages").select("id", { count: "exact", head: true }).eq("artist_id", me.id).eq("from_artist", true).is("read_at", null);
  const { data, error } = await db.from("chat_messages").insert({ artist_id: me.id, from_artist: true, sender: "", body: text }).select("*").single();
  if (error || !data) return { ok: false, error: "Couldn't send just now. Please try again." };
  after(async () => {
    // The team is emailed when an artist starts a new unread run (Settings → "New artist message"), and pushed on every message.
    if (!count && (await notifyEnabled("New artist message"))) {
      await runOrQueue([
        {
          kind: "email",
          to: await teamEmails(),
          subject: `New message from ${me.name} (${me.id})`,
          text: `${me.name} wrote to the AOD team in the artist portal.

Read it and reply: ${sectionUrl("admin", `/chat`)}`,
        },
      ]);
    }
    await sendPush({ kind: "staff" }, { title: "AOD chat", body: `${me.name} sent a message`, url: sectionUrl("admin", "/chat"), tag: "aod-chat-team" });
  });
  return { ok: true, message: toMessage(data as Row, true) };
}
