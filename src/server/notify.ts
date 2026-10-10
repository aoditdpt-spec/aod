import { createSign } from "node:crypto";
import { brand } from "@/content/site";
import { createAdminClient } from "@/lib/supabase/admin";

// Work that happens after a form is saved: a row in the team's Google Sheet and emails.
// Each job runs straight away (inside `after()`, so the visitor doesn't wait). If it fails, or
// its service isn't set up yet, it waits in the `outbox` table and /api/jobs/retry tries again,
// so nothing is lost while keys are missing.

export type SheetJob = { kind: "sheet"; tab: string; rows: string[][] };
export type EmailJob = { kind: "email"; to: string[]; subject: string; text: string; replyTo?: string };
export type Job = SheetJob | EmailJob;

// Column headings for the orders sheet: "All orders" and one tab per category use the same columns.
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
];
export const ALL_ORDERS_TAB = "All orders";

export const istNow = () => new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

// The team's inbox for notifications (comma-separated in TEAM_EMAIL), defaulting to the site's email.
export const teamEmails = () =>
  (process.env.TEAM_EMAIL || brand.email)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// ---- Running jobs ----

export async function runJob(job: Job) {
  if (job.kind === "sheet") return appendToSheet(job.tab, job.rows);
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
    body: JSON.stringify({ from, to, subject: job.subject, text: job.text, ...(job.replyTo ? { reply_to: job.replyTo } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// ---- Google Sheets (service account) ----

const b64url = (s: string) => Buffer.from(s).toString("base64url");

let cachedToken: { token: string; expires: number } | null = null;

async function googleToken() {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("The orders sheet isn't set up yet (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY).");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
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
  cachedToken = { token: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return cachedToken.token;
}

// Add rows at the bottom of a tab; writes the heading row first if the tab is empty.
async function appendToSheet(tab: string, rows: string[][]) {
  const sheetId = process.env.ORDERS_SHEET_ID;
  if (!sheetId) throw new Error("The orders sheet isn't set up yet (ORDERS_SHEET_ID).");
  const token = await googleToken();
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`;
  const range = (r: string) => encodeURIComponent(`'${tab.replace(/'/g, "''")}'!${r}`);
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const first = await fetch(`${base}/${range("A1:A1")}`, { headers });
  if (!first.ok) throw new Error(`Sheet tab "${tab}" ${first.status}: ${(await first.text()).slice(0, 200)}`);
  const empty = !((await first.json()) as { values?: unknown[] }).values;

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
