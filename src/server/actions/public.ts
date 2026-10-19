"use server";

import { after } from "next/server";
import { categories, cities, type Audience } from "@/content/site";
import { bothLinksCategories, workQuestionShown, workQuestionsForAll } from "@/content/artist-portal";
import { backendEnabled } from "@/lib/backend";
import type { WorkDetails } from "@/lib/artist-store";
import { MAX_ARTISTS, needsText, totalNeeded, withCount, type BookingItem } from "@/lib/booking-needs";
import { sectionUrl, siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { eventMinutes, timeRange } from "@/lib/event-time";
import { insertWithNextId } from "@/server/ids";
import { ALL_ORDERS_TAB, istNow, notifyEnabled, runJob, runOrQueue, spamNote, spamSubject, teamEmails, type Job } from "@/server/notify";

// The public website's forms, saved on the server. Visitors aren't signed in, so these use the
// secret key; every field is checked here first. The website only says "received" after a save
// has succeeded (CLAUDE.md rule). Sheet rows and emails run after the reply, through `after()`.

// `verify`: the booking's email hasn't been confirmed with an emailed code (see createBookingRequest).
export type SaveResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; verify?: boolean };

const notSetUp = { ok: false as const, error: "Saving isn't set up yet." };

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
  needs: { category: string; count: number }[]; // category slugs as picked in the quiz, and how many artists of each (1–20)
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM (earlier than the start = ends after midnight)
  city: string;
  details: string;
  name: string;
  phone: string;
  email: string;
  website?: string; // the hidden spam-trap field (see spamNote in server/notify.ts)
};

export async function createBookingRequest(input: BookingRequestInput): Promise<SaveResult<{ ref: string }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const suspect = text(input.website, 200) !== "";

  const occasion = text(input.occasion, 80);
  // Each category once, in the order picked, with a whole number of artists from 1 to MAX_ARTISTS.
  const picked = (Array.isArray(input.needs) ? input.needs : []).filter((n) => n && typeof n === "object");
  const needs = categories
    .map((c) => ({ ...c, count: Number(picked.find((n) => n.category === c.slug)?.count) }))
    .filter((c) => picked.some((n) => n.category === c.slug))
    .sort((a, b) => picked.findIndex((n) => n.category === a.slug) - picked.findIndex((n) => n.category === b.slug));
  const wanted = needsText(needs);
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
  if (needs.some((c) => !Number.isInteger(c.count) || c.count < 1 || c.count > MAX_ARTISTS))
    return { ok: false, error: `Choose how many of each you need, from 1 to ${MAX_ARTISTS}.` };
  // Every detail is required.
  if (!dateOk(date)) return { ok: false, error: "Choose the event date, from tomorrow onwards." };
  if (eventMinutes(startTime, endTime) === null) return { ok: false, error: "Add the event's start and end time." };
  if (!cities.includes(city)) return { ok: false, error: "Choose your city." };
  if (details.length < 3) return { ok: false, error: "Add a few event details." };
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!phoneOk(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (!email || !emailOk(email)) return { ok: false, error: "Enter a valid email address." };
  const when = timeRange(startTime, endTime);

  // Keeps bots from ordering: the email must have been confirmed with the 6-digit code emailed to
  // it (requestCode and verifyCode in actions/auth.ts, asked for by the booking form), which signs
  // the visitor in as that email. A request whose email isn't the signed-in one isn't saved.
  const { data: auth } = await (await createClient()).auth.getUser();
  if (auth.user?.email?.toLowerCase() !== email)
    return { ok: false, error: "Confirm your email with the 6-digit code we send to it.", verify: true };

  const db = createAdminClient();
  const audience = input.audience === "business" ? "Business" : "Personal";
  const now = new Date().toISOString();

  try {
    // One order for the whole request (B-1215), with a line for each category they need and how
    // many artists of it; the customer's reference has the same number (AOD-1215).
    const items: BookingItem[] = needs.map((c) => ({ category: c.slug, service: c.name, count: c.count, artistIds: [] }));
    const [row] = await insertWithNextId(db, "bookings", "B", 1201, (n) => [
      {
        id: `B-${n}`,
        request_ref: `AOD-${n}`,
        created_at: now,
        audience,
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        items,
        // The older single-category columns (src/server/rows.ts fills them the same way).
        category: items[0].category,
        service: items[0].service,
        artists_needed: totalNeeded(items),
        event: occasion,
        event_date: date,
        event_time: startTime,
        event_end_time: endTime,
        city,
        notes: details,
        status: "new",
        history: [{ at: now, by: "Website", status: "new" }],
        notes_log: suspect ? [spamNote(now)] : [],
        source: "website",
      },
    ]);
    const ref = String(row.request_ref);
    const id = String(row.id);

    after(async () => {
      const received = istNow();
      // The columns of `sheetHeader` (src/server/notify.ts); "Artists needed" is last, so rows
      // written before it existed still line up. "All orders" gets one row for the order, listing
      // everyone it needs; each category's tab gets a row with that category's part.
      const sheetRow = (category: string, count: number) => [
        ref,
        id,
        received,
        audience,
        occasion,
        category,
        name,
        phone,
        email,
        date,
        when,
        city,
        details,
        "New",
        "Website",
        String(count),
      ];
      const jobs: Job[] = [
        { kind: "sheet", tab: ALL_ORDERS_TAB, rows: [sheetRow(wanted, totalNeeded(items))] },
        ...needs.map((c): Job => ({ kind: "sheet", tab: c.name, rows: [sheetRow(c.name, c.count)] })),
      ];
      const summary = [
        `Ref: ${ref}`,
        `Type: ${audience}`,
        `Occasion: ${occasion}`,
        `Looking for: ${wanted}`,
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
          subject: spamSubject(suspect, `New booking request ${ref}: ${needs.map((c) => withCount(c.name, c.count)).join(", ")} in ${city}`),
          text: `${summary}\n\nCustomer: ${name}\nPhone: ${phone}\nEmail: ${email || "—"}\n\nOpen the admin: ${sectionUrl("admin", "/bookings")}`,
          replyTo: email || undefined,
        });
      }
      if (email && !suspect) {
        jobs.push({
          kind: "email",
          to: [email],
          subject: `We've received your request ${ref}`,
          text: `Hi ${name},\n\nThanks for your request. We're finding the right artists for you and will reply with curated matches.\n\n${summary}\n\nSee it any time under My bookings: ${siteUrl}/my-bookings\n\n– Team AOD`,
        });
      }
      await runOrQueue(jobs);
    });

    return { ok: true, ref };
  } catch (e) {
    console.error("[booking request]", e);
    // Don't let the request vanish: email the team everything straight away, without going
    // through the database (it may be what failed). The visitor's WhatsApp message also says
    // "not saved", so the team pastes it into the admin's New booking.
    after(async () => {
      try {
        await runJob({
          kind: "email",
          to: teamEmails(),
          subject: `Couldn't save a booking request: add it in the admin (${name}, ${needs.map((c) => withCount(c.name, c.count)).join(", ")})`,
          text: [
            "The website couldn't save this booking request, so it isn't in the admin. Add it there (Bookings → New booking).",
            "",
            `Type: ${audience}`,
            `Occasion: ${occasion}`,
            `Looking for: ${wanted}`,
            `Date: ${date}`,
            `Time: ${when}`,
            `City: ${city}`,
            `Details: ${details}`,
            "",
            `Customer: ${name}`,
            `Phone: ${phone}`,
            `Email: ${email}`,
            "",
            `Error: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500),
          ].join("\n"),
          replyTo: email || undefined,
        });
      } catch (mailError) {
        console.error("[booking request] couldn't email the team either", mailError);
      }
    });
    return { ok: false, error: "Couldn't save your request just now. Please send it on WhatsApp instead." };
  }
}

// ---- Artist application ----

export type ApplicationInput = {
  work?: WorkDetails; // "Your work details": answers by question id
  fullName: string;
  phone: string;
  email: string;
  city: string;
  category: string; // main category slug
  otherCategories?: string[]; // other categories they also work in
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
  const suspect = text(input.website, 200) !== "";

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
  // Known categories other than the main one, each once.
  const others = categories.filter((c) => c.slug !== category.slug && Array.isArray(input.otherCategories) && input.otherCategories.includes(c.slug));
  const slugs = [category.slug, ...others.map((c) => c.slug)];
  const kinds = [category.name, ...others.map((c) => c.name)].join(", ");

  // "Your work details": every required question for each of their categories answered (only the
  // listed choices are kept); a follow-up question counts only when its condition is met.
  // Photographers, cinematographers and the others in bothLinksCategories also give both an
  // Instagram link and a portfolio link.
  const links = strings(input.links, 10, 300);
  const questions = workQuestionsForAll(category.slug, slugs.slice(1));
  const given = input.work ?? {};
  const details: WorkDetails = {};
  for (const q of questions) {
    if (!workQuestionShown(q, details)) continue;
    const v = given[q.id];
    const answer =
      q.kind === "text"
        ? text(v, 80)
        : q.kind === "long"
          ? text(v, 600)
          : q.kind === "one"
            ? (q.options?.find((o) => o === v) ?? "")
            : strings(v, q.options?.length ?? 0, 60).filter((x) => q.options?.includes(x));
    if (!answer.length) {
      if (q.optional) continue;
      return { ok: false, error: `Answer "${q.label}" on the Your work details step.` };
    }
    details[q.id] = answer;
  }
  if (slugs.some((s) => bothLinksCategories.includes(s))) {
    const insta = (l: string) => /(^|\.)instagram\.com\//i.test(l.replace(/^https?:\/\//, ""));
    if (!links.some(insta) || !links.some((l) => !insta(l)))
      return { ok: false, error: "Add both your Instagram link and a portfolio or showreel link." };
  }

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
        other_categories: slugs.slice(1),
        services: strings(input.services, 40, 80),
        experience: text(input.experience, 40),
        languages: strings(input.languages, 10, 30),
        bio: text(input.bio, 2000),
        links,
        details,
        status: "submitted",
        notes: suspect ? [spamNote(new Date().toISOString())] : [],
      },
    ]);
    after(async () => {
      const jobs: Job[] = [];
      if (await notifyEnabled("New artist application"))
        jobs.push({
          kind: "email",
          to: teamEmails(),
          subject: spamSubject(suspect, `New artist application ${app.id}: ${name} (${kinds})`),
          text: `${name}, ${kinds}, ${text(input.city, 40)}\nPhone: ${phone}\nEmail: ${email}${
            "\n\n" + questions.filter((q) => q.id in details).map((q) => `${q.short}: ${[details[q.id]].flat().join(", ")}`).join("\n")
          }\n\nReview it: ${sectionUrl("admin", `/applications?open=${app.id}`)}`,
          replyTo: email,
        });
      if (!suspect)
        jobs.push({
          kind: "email",
          to: [email],
          subject: `We've received your AOD application (${app.id})`,
          text: `Hi ${name},\n\nThanks for applying to Artists on Demand as ${category.singular.toLowerCase()}. Our team will review your application.\n\nYour reference: ${app.id}\n\n– Team AOD`,
        });
      await runOrQueue(jobs);
    });
    return { ok: true, id: String(app.id) };
  } catch (e) {
    console.error("[application]", e);
    return { ok: false, error: "Couldn't save your application just now. Please try again, or send it on WhatsApp." };
  }
}
