import { createSign } from "node:crypto";
import { brand } from "@/content/site";
import { createAdminClient } from "@/lib/supabase/admin";

// Work that happens after a form is saved: a row in the team's Google Sheet and emails.
// Each job runs straight away (inside `after()`, so the visitor doesn't wait). If it fails, or
// its service isn't set up yet, it waits in the `outbox` table and /api/jobs/retry tries again,
// so nothing is lost while keys are missing.

export type SheetJob = { kind: "sheet"; tab: string; rows: string[][] };
// `html` is optional (plain text is always sent too); `headers` carries List-Unsubscribe for the newsletter.
export type EmailJob = { kind: "email"; to: string[]; subject: string; text: string; html?: string; replyTo?: string; headers?: Record<string, string> };
// An artist's profile photo for AOD's Google Drive (src/server/artist-photos.ts): the shrunk image
// as base64, and the application or artist it belongs to.
export type PhotoJob = { kind: "photo"; table: "applications" | "artists"; id: string; type: string; data: string };
export type Job = SheetJob | EmailJob | PhotoJob;

// Column headings for the orders sheet: "All orders" and one tab per category use the same columns.
// New columns go at the end, so rows already in the sheet still line up; a tab whose heading row
// is missing the new ones gets them added (see appendToSheet).
export const sheetHeader = [
  "Ref",
  "Booking ID",
  "Received (IST)",
  "Type",
  "Occasion",
  "Category",
  "Customer",
  "Phone",
  "Email",
  "Event date",
  "Time",
  "City",
  "Details",
  "Status",
  "Source",
  "Artists needed",
  "Brief", // the "Brief for the artists" answers (src/content/artist-brief.ts)
];
export const ALL_ORDERS_TAB = "All orders";

export const istNow = () => new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

// Who gets the team's emails (new bookings, applications, cases, replies, cancellations): the
// inboxes in TEAM_EMAIL (comma-separated; the site's email when it's empty) and every active
// Admin in the admin's Team & roles, so a new admin gets them without touching the settings.
// Developers don't. Each address once, in lower case.
export async function teamEmails() {
  const inboxes = (process.env.TEAM_EMAIL || brand.email).split(",");
  let admins: string[] = [];
  try {
    const { data } = await createAdminClient().from("staff").select("email").eq("role", "owner").eq("active", true);
    admins = (data ?? []).map((r) => String(r.email ?? ""));
  } catch {
    // No database (or no key): the inboxes alone.
  }
  return [...new Set([...inboxes, ...admins].map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

// ---- The forms' spam trap ----

// The forms carry a hidden spam-trap field (`website`) that people never see. A filled one used
// to mean "bot: pretend it worked and save nothing", but a browser's autofill can fill it too
// (it lost a real order on 2026-10-16), so now the record is saved anyway with an internal note
// for the team, the team email is marked, and no confirmation goes to the address typed in.
export const spamNote = (at: string) => ({
  at,
  by: "Website",
  text: "Check this one: the hidden spam-trap field was filled. That's usually a bot, but a browser's autofill can do it too, so it was saved anyway and no confirmation email was sent.",
});
export const spamSubject = (suspect: boolean, subject: string) => (suspect ? `[Check: possible spam] ${subject}` : subject);

// ---- Running jobs ----

export async function runJob(job: Job) {
  if (job.kind === "sheet") return appendToSheet(job.tab, job.rows);
  if (job.kind === "photo") return (await import("./artist-photos")).savePhoto(job);
  return sendEmail(job);
}

// Run jobs now; queue the ones that fail. Never throws: a failed email must not undo a booking.
export async function runOrQueue(jobs: Job[]) {
  for (const job of jobs) {
    try {
      await runJob(job);
    } catch (e) {
      try {
        await createAdminClient()
          .from("outbox")
          .insert({ kind: job.kind, payload: job, status: "pending", attempts: 1, last_error: errorText(e) });
      } catch (queueError) {
        console.error("[notify] couldn't queue a failed job", errorText(queueError), job);
      }
    }
  }
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 500);

// ---- Email (Resend) ----

async function sendEmail(job: EmailJob) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error("Email isn't set up yet (RESEND_API_KEY, EMAIL_FROM).");
  const to = job.to.filter((t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t));
  if (!to.length) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: job.subject,
      text: job.text,
      ...(job.html ? { html: job.html } : {}),
      ...(job.replyTo ? { reply_to: job.replyTo } : {}),
      ...(job.headers ? { headers: job.headers } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// ---- Google (service account): the orders Sheet, and artists' photos on Drive ----

const b64url = (s: string) => Buffer.from(s).toString("base64url");

export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const cachedTokens = new Map<string, { token: string; expires: number }>();

export async function googleToken(scope = SHEETS_SCOPE) {
  const cachedToken = cachedTokens.get(scope);
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Google isn't set up yet (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY).");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({
      iss: email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  )}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
  });
  if (!res.ok) throw new Error(`Google sign-in ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedTokens.set(scope, { token: body.access_token, expires: Date.now() + body.expires_in * 1000 });
  return body.access_token;
}

// Add rows at the bottom of a tab; writes the heading row first if the tab is empty, and adds any
// headings added since (such as "Artists needed") to a tab that has the older ones.
async function appendToSheet(tab: string, rows: string[][]) {
  // The sheet's ID, or its whole address pasted in (…/spreadsheets/d/<id>/edit…): either works.
  const raw = process.env.ORDERS_SHEET_ID?.trim() ?? "";
  const sheetId = raw.match(/\/d\/([\w-]+)/)?.[1] ?? raw.replace(/^[A-Z_]+=/, "");
  if (!sheetId) throw new Error("The orders sheet isn't set up yet (ORDERS_SHEET_ID).");
  if (!/^[\w-]{20,}$/.test(sheetId)) throw new Error("ORDERS_SHEET_ID doesn't look like a Google Sheet ID: use the part of the sheet's address between /d/ and /edit.");
  const token = await googleToken();
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`;
  const range = (r: string) => encodeURIComponent(`'${tab.replace(/'/g, "''")}'!${r}`);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const first = await fetch(`${base}/${range("1:1")}`, { headers });
  if (!first.ok) throw new Error(`Sheet tab "${tab}" ${first.status}: ${(await first.text()).slice(0, 200)}`);
  const heading = ((await first.json()) as { values?: string[][] }).values?.[0] ?? [];
  const empty = heading.length === 0;
  const older = !empty && heading.length < sheetHeader.length && heading.every((h, i) => h === sheetHeader[i]);
  if (older) {
    const fix = await fetch(`${base}/${range("A1")}?valueInputOption=RAW`, { method: "PUT", headers, body: JSON.stringify({ values: [sheetHeader] }) });
    if (!fix.ok) console.error(`[sheet] couldn't add the new headings to "${tab}"`, fix.status);
  }

  const res = await fetch(`${base}/${range("A1")}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    headers,
    body: JSON.stringify({ values: empty ? [sheetHeader, ...rows] : rows }),
  });
  if (!res.ok) throw new Error(`Sheet append to "${tab}" ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// Whether a team notification is switched on in admin Settings (on by default).
export async function notifyEnabled(name: string) {
  try {
    const { data } = await createAdminClient().from("settings").select("data").eq("id", 1).maybeSingle();
    const notify = (data?.data as { notify?: Record<string, boolean> } | undefined)?.notify;
    return notify?.[name] !== false;
  } catch {
    return true;
  }
}
