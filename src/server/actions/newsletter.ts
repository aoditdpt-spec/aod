"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { newsletter as copy } from "@/content/blog";
import { brand } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { parse, toHtml, toText } from "@/lib/markdown";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailButton, emailLayout, emailParagraph, emailStyles } from "@/server/email-layout";
import { insertWithNextId } from "@/server/ids";
import { runOrQueue } from "@/server/notify";
import { currentStaff } from "@/server/staff";

// The newsletter. Sign-up is double opt-in: the website saves the email as "pending" and sends a
// confirmation link; only a click on it makes the person "subscribed" (so a bot, or someone typing
// another person's address, can't sign anyone up). Every issue carries a one-click unsubscribe
// link (and the List-Unsubscribe header that shows Gmail's own Unsubscribe button). The team
// writes and sends issues in the admin's Newsletter page (`sendNewsletter`).

export type NewsletterResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const notSetUp = { ok: false as const, error: copy.preview };
const badLink = { ok: false as const, error: copy.badLink };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const tokenOk = (t: string) => /^[\w-]{20,80}$/.test(t);
const newToken = () => randomBytes(24).toString("base64url");
// One confirmation email per address every 10 minutes, so the form can't be used to flood someone's inbox.
const RESEND_AFTER_MS = 10 * 60_000;

const confirmUrl = (token: string) => `${siteUrl}/newsletter/confirm?t=${encodeURIComponent(token)}`;
const unsubscribePage = (token: string) => `${siteUrl}/newsletter/unsubscribe?t=${encodeURIComponent(token)}`;
// The address mail apps call for one-click unsubscribe (RFC 8058): src/app/api/newsletter/unsubscribe.
const unsubscribeApi = (token: string) => `${siteUrl}/api/newsletter/unsubscribe?t=${encodeURIComponent(token)}`;

function confirmEmail(email: string, token: string) {
  const link = confirmUrl(token);
  return {
    kind: "email" as const,
    to: [email],
    subject: copy.confirmSubject,
    text: `${copy.confirmIntro}\n\n${link}\n\n${copy.confirmIgnore}\n\n– Team AOD`,
    html: emailLayout({
      heading: copy.confirmPageTitle,
      bodyHtml: [emailParagraph(copy.confirmIntro), emailButton(link, copy.confirmButton), emailParagraph(copy.confirmIgnore)].join("\n"),
    }),
  };
}

// ---- Sign up (the footer and blog form) ----

export async function subscribe(input: { email: string; source?: string; website?: string }): Promise<NewsletterResult> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  // The hidden spam-trap field: a bot. Say it worked and do nothing.
  if (text(input.website, 200)) return { ok: true };
  const email = text(input.email, 120).toLowerCase();
  if (!emailOk(email)) return { ok: false, error: "Enter a valid email address." };
  const source = /^\/[\w\-/]*$/.test(text(input.source, 120)) ? text(input.source, 120) : "";

  try {
    const db = createAdminClient();
    const now = new Date();
    const { data: existing, error } = await db.from("subscribers").select("id, status, token, last_sent_at").eq("email", email).maybeSingle();
    if (error) throw new Error(error.message);

    // The same answer whatever happens, so the form never tells anyone who is on the list.
    if (existing?.status === "subscribed") return { ok: true };
    if (existing) {
      const recent = existing.last_sent_at && now.getTime() - new Date(String(existing.last_sent_at)).getTime() < RESEND_AFTER_MS;
      if (recent) return { ok: true };
      // Pending: send the same link again. Unsubscribed: a fresh link, confirmed afresh.
      const token = existing.status === "pending" ? String(existing.token) : newToken();
      const { error: updateError } = await db
        .from("subscribers")
        .update({ status: "pending", token, last_sent_at: now.toISOString(), ...(source ? { source } : {}) })
        .eq("id", existing.id);
      if (updateError) throw new Error(updateError.message);
      after(() => runOrQueue([confirmEmail(email, token)]));
      return { ok: true };
    }

    const token = newToken();
    await insertWithNextId(db, "subscribers", "S", 101, (n) => [
      { id: `S-${n}`, email, status: "pending", source, token, created_at: now.toISOString(), last_sent_at: now.toISOString() },
    ]);
    after(() => runOrQueue([confirmEmail(email, token)]));
    return { ok: true };
  } catch (e) {
    console.error("[newsletter] sign-up", e);
    return { ok: false, error: "Couldn't sign you up just now. Please try again in a minute." };
  }
}

// ---- Confirm and unsubscribe (the links in the emails) ----

export async function confirmSubscription(tokenInput: string): Promise<NewsletterResult> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const token = text(tokenInput, 100);
  if (!tokenOk(token)) return badLink;
  try {
    const now = new Date().toISOString();
    const { data, error } = await createAdminClient()
      .from("subscribers")
      .update({ status: "subscribed", confirmed_at: now, unsubscribed_at: null })
      .eq("token", token)
      .select("id");
    if (error) throw new Error(error.message);
    return data?.length ? { ok: true } : badLink;
  } catch (e) {
    console.error("[newsletter] confirm", e);
    return { ok: false, error: "Couldn't confirm just now. Please try the link again in a minute." };
  }
}

export async function unsubscribe(tokenInput: string): Promise<NewsletterResult> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const token = text(tokenInput, 100);
  if (!tokenOk(token)) return badLink;
  try {
    const { data, error } = await createAdminClient()
      .from("subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("token", token)
      .select("id");
    if (error) throw new Error(error.message);
    return data?.length ? { ok: true } : badLink;
  } catch (e) {
    console.error("[newsletter] unsubscribe", e);
    return { ok: false, error: "Couldn't unsubscribe just now. Please try again in a minute, or reply to any newsletter." };
  }
}

// ---- Send an issue (the admin's Newsletter page) ----

function issueEmail(subject: string, body: string, unsubscribeHref: string) {
  const blocks = parse(body);
  const footerHtml = `<p style="margin:0">${copy.emailFooter} <a href="${unsubscribeHref}" style="color:#5c5c5c">${copy.unsubscribeLabel}</a></p>`;
  return {
    html: emailLayout({ bodyHtml: toHtml(blocks, emailStyles), footerHtml }),
    // Plain-text links to the site's own pages ("Book (/book)") get the full address.
    text: `${toText(blocks).replace(/\(\/(?!\/)/g, `(${siteUrl}/`)}\n\n—\n${copy.emailFooter}\n${copy.unsubscribeLabel}: ${unsubscribeHref}\n${brand.fullName} · ${siteUrl}`,
    subject,
  };
}

const BATCH = 100; // Resend's batch limit
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

// `test`: only to the signed-in staff member. `all`: every confirmed subscriber, once. The subject
// and text come from the editor as they are on screen (its own save may still be on its way), and
// are written to the issue's record when it's sent.
export async function sendNewsletter(id: string, subjectInput: string, bodyInput: string, mode: "test" | "all"): Promise<NewsletterResult<{ sent: number }>> {
  const me = await currentStaff();
  if (!me) return { ok: false, error: "You're signed out. Please sign in again." };
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, error: "Email isn't set up yet (RESEND_API_KEY and EMAIL_FROM in Vercel)." };

  const subject = text(subjectInput, 200);
  const body = text(bodyInput, 50_000);
  if (!subject || !body) return { ok: false, error: "Add a subject and some text first." };
  const { data: row, error } = await me.supabase.from("newsletters").select("id, status").eq("id", text(id, 20)).maybeSingle();
  if (error || !row) return { ok: false, error: "Couldn't find this newsletter. Wait a moment for it to save, then try again." };

  const send = async (emails: { to: string; html: string; text: string; subject: string; token?: string }[]) => {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(
        emails.map((e) => ({
          from,
          to: [e.to],
          subject: e.subject,
          html: e.html,
          text: e.text,
          ...(e.token
            ? { headers: { "List-Unsubscribe": `<${unsubscribeApi(e.token)}>, <mailto:${brand.email}?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }
            : {}),
        })),
      ),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  };

  if (mode === "test") {
    try {
      const mail = issueEmail(`[Test] ${subject}`, body, `${siteUrl}/newsletter/unsubscribe`);
      await send([{ to: me.staff.email, ...mail }]);
      return { ok: true, sent: 1 };
    } catch (e) {
      return { ok: false, error: `The test didn't send: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  if (row.status === "sent") return { ok: false, error: "This newsletter has already been sent. Make a copy to send it again." };
  const { data: list, error: listError } = await createAdminClient().from("subscribers").select("email, token").eq("status", "subscribed");
  if (listError) return { ok: false, error: "Couldn't load the subscribers. Please try again." };
  const people = (list ?? []).filter((p) => emailOk(String(p.email)) && tokenOk(String(p.token)));
  if (!people.length) return { ok: false, error: "There are no confirmed subscribers yet." };

  let sent = 0;
  let failure = "";
  for (let i = 0; i < people.length; i += BATCH) {
    try {
      await send(people.slice(i, i + BATCH).map((p) => ({ to: String(p.email), token: String(p.token), ...issueEmail(subject, body, unsubscribePage(String(p.token))) })));
      sent += Math.min(BATCH, people.length - i);
    } catch (e) {
      failure = e instanceof Error ? e.message : String(e);
      break;
    }
    if (i + BATCH < people.length) await pause(600); // Resend allows a couple of calls a second
  }

  if (sent > 0) {
    const now = new Date().toISOString();
    await me.supabase.from("newsletters").update({ subject, body, status: "sent", sent_at: now, sent_by: me.staff.name, recipients: sent }).eq("id", row.id);
    await me.supabase.from("activity").insert({
      id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: now,
      by: me.staff.name,
      area: "Newsletter",
      text: `Sent "${subject}" to ${sent} subscriber${sent === 1 ? "" : "s"}${failure ? ` (stopped early: ${failure.slice(0, 120)})` : ""}`,
      target: row.id,
    });
  }
  if (failure)
    return {
      ok: false,
      error: sent
        ? `Sent to ${sent} of ${people.length}, then Resend refused: ${failure}. Resend's free plan sends 100 emails a day; upgrade it to reach everyone.`
        : `Nothing was sent. Resend said: ${failure}`,
    };
  return { ok: true, sent };
}
