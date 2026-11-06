"use server";

import { backendEnabled } from "@/lib/backend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sectionUrl } from "@/lib/site-url";
import { pushConfigured, sendTestPush } from "@/server/push";
import { currentStaff } from "@/server/staff";

// A device allowing (or stopping) chat notifications. The team member or artist is whoever is
// signed in; the table is only reachable from here (secret key), see …_push.sql.

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };
type Result = { ok: true } | { ok: false; error: string };

const valid = (s: PushSub) =>
  typeof s?.endpoint === "string" && s.endpoint.startsWith("https://") && s.endpoint.length < 1000 && typeof s.keys?.p256dh === "string" && typeof s.keys?.auth === "string";

export async function savePushSubscription(sub: PushSub, as: "staff" | "artist"): Promise<Result> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY || !pushConfigured()) return { ok: false, error: "Notifications aren't set up yet." };
  if (!valid(sub)) return { ok: false, error: "That device can't receive notifications." };
  const db = createAdminClient();
  let who: { kind: "staff"; staff_email: string; artist_id: string } | { kind: "artist"; staff_email: string; artist_id: string } | null = null;
  if (as === "staff") {
    const me = await currentStaff();
    if (me) who = { kind: "staff", staff_email: me.staff.email.toLowerCase(), artist_id: "" };
  } else {
    const { data } = await (await createClient()).auth.getUser();
    const email = data.user?.email?.toLowerCase();
    const { data: artist } = email ? await db.from("artists").select("id").eq("email", email).limit(1).maybeSingle() : { data: null };
    if (artist) who = { kind: "artist", staff_email: "", artist_id: String(artist.id) };
  }
  if (!who) return { ok: false, error: "You're signed out. Please sign in again." };
  // One row per device: signing in as someone else on the same device takes it over.
  const { error } = await db.from("push_subscriptions").upsert({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, ...who }, { onConflict: "endpoint" });
  return error ? { ok: false, error: "Couldn't turn notifications on just now." } : { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<Result> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return { ok: true };
  // Only a signed-in person may remove a device (the endpoint is unguessable).
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) return { ok: false, error: "You're signed out." };
  await createAdminClient().from("push_subscriptions").delete().eq("endpoint", String(endpoint));
  return { ok: true };
}

// "Send a test notification": a push to the signed-in person's own saved devices.
export async function sendTestNotification(as: "staff" | "artist"): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return { ok: false, error: "Notifications aren't set up yet." };
  if (as === "staff") {
    const me = await currentStaff();
    if (!me) return { ok: false, error: "You're signed out. Please sign in again." };
    return sendTestPush({ kind: "staff", email: me.staff.email.toLowerCase() }, { title: "AOD chat", body: "Test notification. It works!", url: sectionUrl("admin", "/chat"), tag: "aod-test" });
  }
  const { data } = await (await createClient()).auth.getUser();
  const email = data.user?.email?.toLowerCase();
  const { data: artist } = email ? await createAdminClient().from("artists").select("id").eq("email", email).limit(1).maybeSingle() : { data: null };
  if (!artist) return { ok: false, error: "You're signed out. Please sign in again." };
  return sendTestPush({ kind: "artist", artistId: String(artist.id) }, { title: "AOD", body: "Test notification. It works!", url: sectionUrl("artists", "/messages"), tag: "aod-test" });
}
