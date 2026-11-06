import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Push notifications (the phone's or laptop's own "new message" banner). Needs three settings:
// NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY (a pair made with `npx web-push generate-vapid-keys`)
// and VAPID_SUBJECT (a mailto: address). Without them nothing is sent and nothing breaks.
// Subscriptions live in `push_subscriptions` (…_push.sql); a device that has gone (404 or 410) is removed.

export const pushConfigured = () => !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

export type PushMessage = { title: string; body: string; url: string; tag?: string };

type Target = { kind: "staff" } | { kind: "artist"; artistId: string };

let ready = false;
function setup() {
  if (ready) return true;
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:communication.aod@gmail.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  ready = true;
  return true;
}

// Sends to every device of the team, or of one artist. Never throws: a push must not break a message.
export async function sendPush(target: Target, message: PushMessage) {
  try {
    if (!setup() || !process.env.SUPABASE_SECRET_KEY) return;
    const db = createAdminClient();
    let q = db.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("kind", target.kind);
    if (target.kind === "artist") q = q.eq("artist_id", target.artistId);
    const { data } = await q;
    const payload = JSON.stringify(message);
    await Promise.all(
      (data ?? []).map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: String(s.endpoint), keys: { p256dh: String(s.p256dh), auth: String(s.auth) } }, payload, { TTL: 60 * 60 * 24 });
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
        }
      }),
    );
  } catch (e) {
    console.error("[push]", e);
  }
}

// A test push to one person's own devices (the "Send a test notification" button), reporting what
// happened so a problem can be told apart: no key, no saved device, or the push service refusing.
export async function sendTestPush(match: { kind: "staff"; email: string } | { kind: "artist"; artistId: string }, message: PushMessage): Promise<{ ok: true; sent: number } | { ok: false; error: string }> {
  if (!setup()) return { ok: false, error: "The push keys aren't set on the server (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)." };
  const db = createAdminClient();
  const q = db.from("push_subscriptions").select("id, endpoint, p256dh, auth");
  const { data, error } = await (match.kind === "staff" ? q.eq("kind", "staff").eq("staff_email", match.email) : q.eq("kind", "artist").eq("artist_id", match.artistId));
  if (error) return { ok: false, error: "Couldn't read the saved devices. Has the push migration been run?" };
  if (!data?.length) return { ok: false, error: "This device isn't saved yet. Turn notifications off and on again." };
  let sent = 0;
  let lastError = "";
  for (const s of data) {
    try {
      await webpush.sendNotification({ endpoint: String(s.endpoint), keys: { p256dh: String(s.p256dh), auth: String(s.auth) } }, JSON.stringify(message), { TTL: 60 });
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
      lastError = code ? `The push service refused it (${code}${code === 404 || code === 410 ? ", that device was removed: turn notifications on again" : ""}).` : "Couldn't reach the push service.";
    }
  }
  return sent ? { ok: true, sent } : { ok: false, error: lastError || "Nothing was sent." };
}
