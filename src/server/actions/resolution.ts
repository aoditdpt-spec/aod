"use server";

import { after } from "next/server";
import { resolution, type CaseRole } from "@/content/resolution";
import { backendEnabled } from "@/lib/backend";
import { sectionUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CaseStatus } from "@/lib/admin-store";
import { insertWithNextId } from "@/server/ids";
import { notifyEnabled, runOrQueue, spamNote, spamSubject, teamEmails, type Job } from "@/server/notify";

// The Dispute Desk's forms (/resolve; "resolution" in the code). Like the other public forms, these use the secret key
// and check every field first, and the page only says "received" once the case is saved. People
// track a case with its number plus the email they raised it with; they never see internal notes
// or who on the team handled it.

export type CaseResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

// What the person who raised a case sees when they track it.
export type TrackedCase = {
  id: string;
  createdAt: string;
  role: CaseRole;
  issue: string;
  bookingRef: string; // empty for a booking made outside AOD
  otherParty?: string;
  incidentDate: string;
  outcome: string;
  status: CaseStatus;
  resolution?: string;
  steps: { status: CaseStatus; at: string }[];
};

const notSetUp = { ok: false as const, error: "The Dispute Desk isn't connected yet." };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const phoneOk = (p: string) => {
  const d = p.replace(/\D/g, "");
  return /^(?:91|0)?[6-9]\d{9}$/.test(d) || (d.length >= 8 && d.length <= 15);
};
const linkOk = (l: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(l);
const todayIst = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
const caseId = (v: unknown) => text(v, 20).toUpperCase().replace(/\s+/g, "");

// ---- Raise a case ----

export type CaseInput = {
  role: CaseRole;
  issue: string;
  throughAod: boolean; // booked through AOD (with a booking number), or outside it (who it's with)
  bookingRef: string;
  otherParty: string;
  incidentDate: string; // yyyy-mm-dd
  description: string;
  outcome: string;
  evidence: string[];
  name: string;
  phone: string;
  email: string;
  agree: boolean;
  website?: string; // the hidden spam-trap field (see spamNote in server/notify.ts)
};

export async function createCase(input: CaseInput): Promise<CaseResult<{ id: string }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const suspect = text(input.website, 200) !== "";

  const role = resolution.roles.some((r) => r.id === input.role) ? input.role : null;
  const issue = text(input.issue, 80);
  const throughAod = input.throughAod !== false;
  const bookingRef = throughAod ? text(input.bookingRef, 60) : "";
  const otherParty = throughAod ? "" : text(input.otherParty, 200);
  const incidentDate = text(input.incidentDate, 10);
  const description = text(input.description, 4000);
  const outcome = text(input.outcome, 80);
  const evidence = (Array.isArray(input.evidence) ? input.evidence : []).map((l) => text(l, 400)).filter(Boolean).slice(0, 5);
  const name = text(input.name, 80);
  const phone = text(input.phone, 20);
  const email = text(input.email, 120).toLowerCase();

  if (!role) return { ok: false, error: "Choose which side you're on." };
  if (!resolution.issues[role].includes(issue)) return { ok: false, error: "Choose what the dispute is about." };
  if (throughAod && bookingRef.length < 3) return { ok: false, error: "Add the booking or request number." };
  if (!throughAod && otherParty.length < 3) return { ok: false, error: "Say who the dispute is with and how to reach them." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate) || incidentDate > todayIst()) return { ok: false, error: "Add the date it happened (today or earlier)." };
  if (description.length < 20) return { ok: false, error: "Describe what happened in a little more detail." };
  if (!resolution.outcomes[role].includes(outcome)) return { ok: false, error: "Choose what would settle it for you." };
  if (evidence.some((l) => !linkOk(l))) return { ok: false, error: "Evidence links must be full web addresses (https://…)." };
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!phoneOk(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (!emailOk(email)) return { ok: false, error: "Enter a valid email address." };
  if (!input.agree) return { ok: false, error: "Please confirm the details are true." };

  try {
    const db = createAdminClient();
    const now = new Date().toISOString();
    // `withOtherParty` false: the database hasn't had the other_party column added yet (the eleventh
    // migration), so who the dispute is with goes into booking_ref instead and the case still saves.
    const save = (withOtherParty: boolean) =>
      insertWithNextId(db, "cases", "RC", 1001, (n) => [
      {
        id: `RC-${n}`,
        created_at: now,
        role,
        name,
        email,
        phone,
        booking_ref: withOtherParty || throughAod ? bookingRef : `${resolution.throughAod.outsideLabel}: ${otherParty}`,
        ...(withOtherParty ? { other_party: otherParty } : {}),
        issue,
        incident_date: incidentDate,
        description,
        outcome,
        evidence,
        status: "received",
        history: [{ at: now, by: "Website", status: "received" }],
        notes: suspect ? [spamNote(now)] : [],
      },
    ]);
    let row: Record<string, unknown>;
    try {
      [row] = await save(true);
    } catch (e) {
      if (!/other_party/i.test(e instanceof Error ? e.message : "")) throw e;
      console.error("[resolution case] the cases table has no other_party column yet: run the eleventh migration");
      [row] = await save(false);
    }
    const id = String(row.id);
    const about = throughAod ? `Booking: ${bookingRef}` : `${resolution.throughAod.outsideLabel}. With: ${otherParty}`;
    const roleLabel = resolution.roles.find((r) => r.id === role)!.label;

    after(async () => {
      const summary = [
        `Case: ${id}`,
        `From: ${name} (${roleLabel})`,
        about,
        `Dispute: ${issue}`,
        `When: ${incidentDate}`,
        `Would settle it: ${outcome}`,
        "",
        description,
        ...(evidence.length ? ["", "Evidence:", ...evidence] : []),
      ].join("\n");
      const jobs: Job[] = [];
      if (await notifyEnabled("New resolution case"))
        jobs.push({
          kind: "email",
          to: await teamEmails(),
          subject: spamSubject(suspect, `New dispute ${id}: ${issue} (${throughAod ? bookingRef : resolution.throughAod.outsideLabel.toLowerCase()})`),
          text: `${summary}\n\nPhone: ${phone}\nEmail: ${email}\n\nReply within 48 hours. Open it: ${sectionUrl("admin", `/resolution?open=${id}`)}`,
          replyTo: email,
        });
      if (!suspect)
        jobs.push({
          kind: "email",
          to: [email],
          subject: `The AOD Dispute Desk has your case ${id}`,
          text: `Hi ${name},\n\nThe AOD Dispute Desk has your case. Someone will reply within 48 hours, and AOD will hear from the other side too.\n\n${summary}\n\nFollow it any time: ${sectionUrl("resolve", `/track?id=${id}`)} (with this email address).\nTo add photos or chats, reply to this email or send them on WhatsApp quoting ${id}.\n\n– AOD Dispute Desk`,
        });
      await runOrQueue(jobs);
    });
    return { ok: true, id };
  } catch (e) {
    console.error("[resolution case]", e);
    return { ok: false, error: "Couldn't save your case just now. Please send it to AOD on WhatsApp instead." };
  }
}

// ---- Track a case ----

async function findCase(id: string, email: string) {
  const { data, error } = await createAdminClient().from("cases").select("*").eq("id", id).eq("email", email).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

const notFound = { ok: false as const, error: "No case matches that number and email. Check both and try again." };

export async function trackCase(idInput: string, emailInput: string): Promise<CaseResult<{ case: TrackedCase }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const id = caseId(idInput);
  const email = text(emailInput, 120).toLowerCase();
  if (!/^RC-\d+$/.test(id) || !emailOk(email)) return notFound;
  try {
    const r = await findCase(id, email);
    if (!r) return notFound;
    const history = (Array.isArray(r.history) ? r.history : []) as { at: string; status: CaseStatus }[];
    return {
      ok: true,
      case: {
        id: String(r.id),
        createdAt: String(r.created_at),
        role: r.role as CaseRole,
        issue: String(r.issue),
        bookingRef: String(r.booking_ref ?? ""),
        otherParty: r.other_party ? String(r.other_party) : undefined,
        incidentDate: String(r.incident_date ?? ""),
        outcome: String(r.outcome ?? ""),
        status: r.status as CaseStatus,
        resolution: r.resolution ? String(r.resolution) : undefined,
        steps: history.map((h) => ({ status: h.status, at: h.at })),
      },
    };
  } catch (e) {
    console.error("[track case]", e);
    return { ok: false, error: "Couldn't look up your case just now. Please try again in a minute." };
  }
}

// ---- Escalate a case to the grievance officer ----

export async function escalateCase(idInput: string, emailInput: string, reasonInput: string): Promise<CaseResult> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const id = caseId(idInput);
  const email = text(emailInput, 120).toLowerCase();
  const reason = text(reasonInput, 2000);
  if (reason.length < 10) return { ok: false, error: "Tell AOD why you're escalating, in a sentence or two." };
  try {
    const r = await findCase(id, email);
    if (!r) return notFound;
    if (r.status === "escalated") return { ok: true };
    const now = new Date().toISOString();
    const history = [...(Array.isArray(r.history) ? r.history : []), { at: now, by: String(r.name), status: "escalated" }];
    const notes = [{ at: now, by: String(r.name), text: `Escalated: ${reason}` }, ...(Array.isArray(r.notes) ? r.notes : [])];
    const { error } = await createAdminClient().from("cases").update({ status: "escalated", history, notes }).eq("id", id);
    if (error) throw new Error(error.message);

    after(async () => {
      await runOrQueue([
        {
          kind: "email",
          to: await teamEmails(),
          subject: `Dispute escalated to the grievance officer: ${id}`,
          text: `${r.name} has escalated case ${id} (${r.issue}, ${r.other_party ? `with ${r.other_party}, not booked through AOD` : `booking ${r.booking_ref}`}).\n\nWhy: ${reason}\n\nOpen it: ${sectionUrl("admin", `/resolution?open=${id}`)}`,
          replyTo: email,
        },
        {
          kind: "email",
          to: [email],
          subject: `Your case ${id} has been escalated`,
          text: `Hi ${r.name},\n\nAOD's grievance officer will review case ${id} afresh and reply by email.\n\nYour reason: ${reason}\n\nFollow it: ${sectionUrl("resolve", `/track?id=${id}`)}\n\n– AOD Dispute Desk`,
        },
      ]);
    });
    return { ok: true };
  } catch (e) {
    console.error("[escalate case]", e);
    return { ok: false, error: "Couldn't escalate just now. Please call or email AOD's grievance officer instead." };
  }
}
