"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { backendEnabled } from "@/lib/backend";
import { createStore } from "@/lib/local-store";
import { artistChatLoad, artistChatSend, staffChatOpen, staffChatSend, staffChatSummary, type ChatMessage, type ChatSummary } from "@/server/actions/chat";

export type { ChatMessage, ChatSummary };

// Chat between the team and each artist (src/server/actions/chat.ts). Live, both sides reload when
// the database says something changed: the admin when its data reloads (the "staff" channel), the
// artist portal when its data reloads (the "artist:<id>" channel); a conversation is also fetched
// again after every send. Preview (no keys): the messages are kept in this browser, shared by the
// admin and the artist portal of the preview, and the artist is the preview's sample artist.

export const PREVIEW_ARTIST_ID = "ART-201";

type Stored = { artistId: string; fromArtist: boolean; sender: string; body: string; at: string; read: boolean };
const previewChat = createStore<Stored[]>("aod-chat", [], (v) => (Array.isArray(v) ? (v as Stored[]).filter((m) => m && typeof m.body === "string" && typeof m.artistId === "string") : []));

const previewMessages = (artistId: string, forArtist: boolean): ChatMessage[] =>
  previewChat
    .get()
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.artistId === artistId)
    .map(({ m, i }) => ({ id: String(i), fromArtist: m.fromArtist, sender: forArtist ? (m.fromArtist ? "" : "Admin") : m.sender, body: m.body, at: m.at, read: m.read }));

const markPreviewRead = (artistId: string, fromArtist: boolean) => {
  const all = previewChat.get();
  if (all.some((m) => m.artistId === artistId && m.fromArtist === fromArtist && !m.read)) {
    previewChat.set(all.map((m) => (m.artistId === artistId && m.fromArtist === fromArtist ? { ...m, read: true } : m)));
  }
};

function previewSummary(): { summary: ChatSummary; unread: number } {
  const summary: ChatSummary = {};
  let unread = 0;
  for (const m of previewChat.get()) {
    const s = (summary[m.artistId] ??= { last: { body: m.body, at: m.at, fromArtist: m.fromArtist }, unread: 0 });
    s.last = { body: m.body, at: m.at, fromArtist: m.fromArtist };
    if (m.fromArtist && !m.read) {
      s.unread++;
      unread++;
    }
  }
  return { summary, unread };
}

// ---- The team's side ----

// Unread messages from artists, for the sidebar's badge. `refresh` changes when the admin's data reloads.
export function useStaffChatUnread(refresh: unknown): number {
  const [live, setLive] = useState(0);
  useEffect(() => {
    if (!backendEnabled) return;
    let stale = false;
    void staffChatSummary()
      .then((r) => !stale && r.ok && setLive(r.unread))
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [refresh]);
  const local = previewChat.use();
  return backendEnabled ? live : local.filter((m) => m.fromArtist && !m.read).length;
}

// The chat page: a summary per artist, the open conversation, and sending.
export function useStaffChat(artistId: string | null, refresh: unknown, staffName: string) {
  const [liveSummary, setLiveSummary] = useState<ChatSummary>({});
  const [liveMessages, setLiveMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const local = previewChat.use();

  const load = useCallback(async () => {
    if (!backendEnabled) return;
    try {
      const [s, m] = await Promise.all([staffChatSummary(), artistId ? staffChatOpen(artistId) : Promise.resolve(null)]);
      if (s.ok) setLiveSummary(s.summary);
      if (m?.ok) setLiveMessages(m.messages);
      setError(s.ok && (m === null || m.ok) ? null : "Couldn't load the chat. Try again in a moment.");
    } catch {
      setError("Couldn't load the chat. Check your connection.");
    }
  }, [artistId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the server
    void load();
  }, [load, refresh]);
  useEffect(() => {
    if (!backendEnabled && artistId) markPreviewRead(artistId, true);
  }, [artistId, local]);
  useEffect(() => {
    // Switching artist shouldn't show the last one's messages while the next loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on switch
    setLiveMessages([]);
  }, [artistId]);

  async function send(body: string): Promise<boolean> {
    if (!artistId || !body.trim()) return false;
    if (!backendEnabled) {
      previewChat.set([...previewChat.get(), { artistId, fromArtist: false, sender: staffName, body: body.trim(), at: new Date().toISOString(), read: false }]);
      return true;
    }
    setSending(true);
    setError(null);
    try {
      const res = await staffChatSend(artistId, body);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      setLiveMessages((m) => [...m, res.message]);
      void load();
      return true;
    } catch {
      setError("Couldn't send. Check your connection and try again.");
      return false;
    } finally {
      setSending(false);
    }
  }

  const summary = backendEnabled ? liveSummary : previewSummary().summary;
  const messages = backendEnabled ? liveMessages : artistId ? previewMessages(artistId, false) : [];
  return { summary, messages, send, sending, error };
}

// ---- The artist's side ----

// The artist's own conversation with "Admin". `open` is true on the Messages page (it marks the
// team's messages as read); the sidebar's badge uses it with false. `refresh` changes when the
// portal's data reloads.
export function useArtistChat(open: boolean, refresh: unknown) {
  const [live, setLive] = useState<{ messages: ChatMessage[]; unread: number }>({ messages: [], unread: 0 });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const local = previewChat.use();
  const latest = useRef(open);
  useEffect(() => {
    latest.current = open;
  });

  const load = useCallback(async () => {
    if (!backendEnabled) return;
    try {
      const r = await artistChatLoad(latest.current);
      if (r.ok) {
        setLive({ messages: r.messages, unread: r.unread });
        setError(null);
      } else setError(r.error);
    } catch {
      setError("Couldn't load your messages. Check your connection.");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load, refresh, open]);
  useEffect(() => {
    if (!backendEnabled && open) markPreviewRead(PREVIEW_ARTIST_ID, false);
  }, [open, local]);

  async function send(body: string): Promise<boolean> {
    if (!body.trim()) return false;
    if (!backendEnabled) {
      previewChat.set([...previewChat.get(), { artistId: PREVIEW_ARTIST_ID, fromArtist: true, sender: "", body: body.trim(), at: new Date().toISOString(), read: false }]);
      return true;
    }
    setSending(true);
    setError(null);
    try {
      const res = await artistChatSend(body);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      setLive((s) => ({ ...s, messages: [...s.messages, res.message] }));
      return true;
    } catch {
      setError("Couldn't send. Check your connection and try again.");
      return false;
    } finally {
      setSending(false);
    }
  }

  if (!backendEnabled) {
    const messages = previewMessages(PREVIEW_ARTIST_ID, true);
    return { messages, unread: open ? 0 : messages.filter((m) => !m.fromArtist && !m.read).length, send, sending, error };
  }
  return { messages: live.messages, unread: live.unread, send, sending, error };
}
