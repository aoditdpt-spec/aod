"use server";

import { after } from "next/server";
import { categories, cities, type Audience } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { createAdminClient } from "@/lib/supabase/admin";
import { eventMinutes, timeRange } from "@/lib/event-time";
import { cleanUtr, isUtr } from "@/lib/upi";
import { insertWithNextId } from "@/server/ids";
import { ALL_ORDERS_TAB, istNow, notifyEnabled, runOrQueue, teamEmails, type Job } from "@/server/notify";

// The public website's forms, saved on the server. Visitors aren't signed in, so these use the
// secret key; every field is checked here first. The website only says "received" after a save
// has succeeded (CLAUDE.md rule). Sheet rows and emails run after the reply, through `after()`.

export type SaveResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const notSetUp = { ok: false as const, error: "Saving isn't set up yet." };
const site = () => process.env.NEXT_PUBLIC_SITE_URL || "https://www.aod.co.in";

// ---- Small checks ----

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (e: string) => e === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const digits = (s: string) => s.replace(/\D/g, "");
// Indian mobile numbers, with or without +91 / 0 in front; other countries need at least 8 digits.
const phoneOk = (p: string) => {
  const d = digits(p);
  return /^(?:91|0)?[6-9]\d{9}$/.test(d) || (d.length >= 8 && d.length <= 15);
};
// A real yyyy-mm-dd date, from tomorrow (India time) onwards.
const dateOk = (d: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d))) return false;
  const todayIst = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  return d > todayIst;
};

// ---- Booking request (the three-question quiz) ----

export type BookingRequestInput = {
  audience?: Audience;
  occasion: string;
  needs: string[]; // category names, as picked in the quiz
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM (earlier than the start = ends after midnight)
  city: string;
  details: string;
  name: string;
  phone: string;
  email: string;
  website?: string; // honeypot: a hidden field people never fill in
};

export async function createBookingRequest(input: BookingRequestInput): Promise<SaveResult<{ ref: string }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  if (text(input.website, 200)) return { ok: true, ref: "AOD-0" }; // a bot: pretend it worked

  const occasion = text(input.occasion, 80);
  const needs = categories.filter((c) => Array.isArray(input.needs) && input.needs.includes(c.name));
  const date = text(input.date, 10);
  const startTime = text(input.startTime, 5);
  const endTime = text(input.endTime, 5);
  const city = text(input.city, 40);
  const details = text(input.details, 1500);
  const name = text(input.name, 80);
  const phone = text(input.phone, 20);
  const email = text(input.email, 120).toLowerCase();

  if (!occasion) return { ok: false, error: "Pick the occasion." };
  if (!needs.length) return { ok: false, error: "Pick who you need." };
  // Every detail is required.
  if (!dateOk(date)) return { ok: false, error: "Choose the event date, from tomorrow onwards." };
  if (eventMinutes(startTime, endTime) === null) return { ok: false, error: "Add the event's start and end time." };
  if (!cities.includes(city)) return { ok: false, error: "Choose your city." };
  if (details.length < 3) return { ok: false, error: "Add a few event details." };
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!phoneOk(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (!email || !emailOk(email)) return { ok: false, error: "Enter a valid email address." };
  const when = timeRange(startTime, endTime);

  const db = createAdminClient();
  const audience = input.audience === "business" ? "Business" : "Personal";
  const now = new Date().toISOString();

  try {
    // One booking per category they need (each gets its own artist and status in the admin),
    // and one reference for the customer, taken from the first booking's number so it's unique:
    // bookings B-1215 and B-1216 are request AOD-1215.
    const rows = await insertWithNextId(db, "bookings", "B", 1201, (first) =>
      needs.map((c, i) => ({
        id: `B-${first + i}`,
        request_ref: `AOD-${first}`,
        created_at: now,
        audience,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        category: c.slug,
        service: c.name,
        event: occasion,
        event_date: date,
        event_time: startTime,
        event_end_time: endTime,
        city,
        notes: details,
        status: "new",
        history: [{ at: now, by: "Website", status: "new" }],
        source: "website",
      })),
    );
    const ref = String(rows[0].request_ref);

    after(async () => {
      const received = istNow();
      const sheetRow = (b: (typeof rows)[number]) => [
        ref,
        String(b.id),
        received,
        audience,
        occasion,
        String(b.service),
        name,
        phone,
        email,
        date,
        when,
        city,
        details,
        "New",
        "Website",
      ];
      const jobs: Job[] = [
        { kind: "sheet", tab: ALL_ORDERS_TAB, rows: rows.map(sheetRow) },
        ...rows.map((b): Job => ({ kind: "sheet", tab: String(b.service), rows: [sheetRow(b)] })),
      ];
      const summary = [
        `Ref: ${ref}`,
        `Type: ${audience}`,
        `Occasion: ${occasion}`,
        `Looking for: ${needs.map((c) => c.name).join(", ")}`,
        `Date: ${date}`,
        `Time: ${when}`,
        `City: ${city}`,
        details && `Details: ${details}`,
      ]
        .filter(Boolean)
        .join("\n");
      if (await notifyEnabled("New booking request")) {
        jobs.push({
          kind: "email",
          to: teamEmails(),
          subject: `New booking request ${ref}: ${needs.map((c) => c.name).join(", ")} in ${city}`,
          text: `${summary}\n\nCustomer: ${name}\nPhone: ${phone}\nEmail: ${email || "—"}\n\nOpen the admin: ${site()}/admin/bookings`,
          replyTo: email || undefined,
        });
      }
      if (email) {
        jobs.push({
          kind: "email",
          to: [email],
          subject: `We've received your request ${ref}`,
          text: `Hi ${name},\n\nThanks for your request. We're finding the right artists for you and will reply with curated matches.\n\n${summary}\n\nSee it any time under My bookings: ${site()}/my-bookings\n\n– Team AOD`,
        });
      }
      await runOrQueue(jobs);
    });

    return { ok: true, ref };
  } catch (e) {
    console.error("[booking request]", e);
    return { ok: false, error: "Couldn't save your request just now. Please send it on WhatsApp instead." };
  }
}

// ---- Artist application ----

export type ApplicationInput = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  category: string; // category slug
  services: string[];
  experience: string;
  languages: string[];
  bio: string;
  links: string[];
  agreeTerms: boolean;
  website?: string;
};

export async function createApplication(input: ApplicationInput): Promise<SaveResult<{ id: string }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  if (text(input.website, 200)) return { ok: true, id: "APP-0" };

  const name = text(input.fullName, 80);
  const phone = text(input.phone, 20);
  const email = text(input.email, 120).toLowerCase();
  const category = categories.find((c) => c.slug === input.category);
  const strings = (v: unknown, max: number, each: number) =>
    (Array.isArray(v) ? v : []).map((x) => text(x, each)).filter(Boolean).slice(0, max);

  if (name.length < 2) return { ok: false, error: "Enter your full name." };
  if (!phoneOk(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (!email || !emailOk(email)) return { ok: false, error: "Enter a valid email address." };
  if (!category) return { ok: false, error: "Pick your category." };
  if (!input.agreeTerms) return { ok: false, error: "Please accept the terms." };

  try {
    const db = createAdminClient();
    const [app] = await insertWithNextId(db, "applications", "APP", 201, (n) => [
      {
        id: `APP-${n}`,
        name,
        phone,
        email,
        city: text(input.city, 40),
        category: category.slug,
        services: strings(input.services, 20, 80),
        experience: text(input.experience, 40),
        languages: strings(input.languages, 10, 30),
        bio: text(input.bio, 2000),
        links: strings(input.links, 10, 300),
        status: "submitted",
      },
    ]);
    after(async () => {
      const jobs: Job[] = [];
      if (await notifyEnabled("New artist application"))
        jobs.push({
          kind: "email",
          to: teamEmails(),
          subject: `New artist application ${app.id}: ${name} (${category.name})`,
          text: `${name}, ${category.name}, ${text(input.city, 40)}\nPhone: ${phone}\nEmail: ${email}\n\nReview it: ${site()}/admin/applications?open=${app.id}`,
          replyTo: email,
        });
      jobs.push({
        kind: "email",
        to: [email],
        subject: `We've received your AOD application (${app.id})`,
        text: `Hi ${name},\n\nThanks for applying to Artists on Demand as ${category.singular.toLowerCase()}. Our team reviews every application and will get back to you by email.\n\nYour reference: ${app.id}\n\n– Team AOD`,
      });
      await runOrQueue(jobs);
    });
    return { ok: true, id: String(app.id) };
  } catch (e) {
    console.error("[application]", e);
    return { ok: false, error: "Couldn't save your application just now. Please try again, or send it on WhatsApp." };
  }
}

// ---- Payment reported on /pay (the customer's UPI transaction ID) ----

export type PaymentReportInput = {
  amount: number;
  utr: string;
  name: string;
  phone: string;
  bookingRef: string;
  purpose: string;
  website?: string;
};

export async function reportPayment(input: PaymentReportInput): Promise<SaveResult<{ id: string }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  if (text(input.website, 200)) return { ok: true, id: "PAY-0" };

  const amount = Math.round(Number(input.amount));
  const utr = cleanUtr(text(input.utr, 40));
  const payer = text(input.name, 80);
  const phone = text(input.phone, 20);
  const bookingRef = text(input.bookingRef, 30);
  const purpose = text(input.purpose, 60);

  if (!Number.isFinite(amount) || amount < 1 || amount > 10_000_000) return { ok: false, error: "Enter the amount you paid." };
  if (!isUtr(utr)) return { ok: false, error: "Enter the 12-digit UPI transaction ID." };
  if (payer.length < 2) return { ok: false, error: "Enter your name." };

  try {
    const db = createAdminClient();
    // The same transaction reported twice (e.g. a double tap) is saved once.
    const { data: existing } = await db.from("payments").select("id").eq("utr", utr).neq("status", "rejected").maybeSingle();
    if (existing) return { ok: true, id: String(existing.id) };

    const [payment] = await insertWithNextId(db, "payments", "PAY", 3101, (n) => [
      { id: `PAY-${n}`, booking_id: bookingRef, amount, utr, payer, payer_phone: phone, purpose, status: "pending" },
    ]);
    after(async () => {
      if (await notifyEnabled("Payment reported"))
        await runOrQueue([
          {
            kind: "email",
            to: teamEmails(),
            subject: `Payment to verify: ₹${amount.toLocaleString("en-IN")} from ${payer}`,
            text: `${payer} reports paying ₹${amount.toLocaleString("en-IN")}${bookingRef ? ` for ${bookingRef}` : ""} (${purpose || "payment"}).\nUPI transaction ID: ${utr}\nPhone: ${phone || "—"}\n\nCheck it against the bank statement, then verify it in the admin: ${site()}/admin/payments?open=${payment.id}`,
          },
        ]);
    });
    return { ok: true, id: String(payment.id) };
  } catch (e) {
    console.error("[payment report]", e);
    return { ok: false, error: "Couldn't save your payment details just now. Please send them on WhatsApp instead." };
  }
}
