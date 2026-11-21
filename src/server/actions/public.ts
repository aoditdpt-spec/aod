"use server";

import { after } from "next/server";
import { categories, categoryName, cities, type Audience } from "@/content/site";
import { experienceLevels, kindOf } from "@/data/work-questions";
import { backendEnabled } from "@/lib/backend";
import { MAX_ARTISTS, totalNeeded, withCount, type BookingItem } from "@/lib/booking-needs";
import { eventMinutes, timeRange } from "@/lib/event-time";
import { lineId } from "@/lib/order-id";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { sectionUrl, siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { insertOrder, insertWithNextId } from "@/server/ids";
import { ALL_ORDERS_TAB, istNow, notifyEnabled, runJob, runOrQueue, spamNote, spamSubject, teamEmails, type Job } from "@/server/notify";

// The public website's forms, saved on the server: the booking request (src/components/book/
// BookForm.tsx) and the artist sign-up (src/components/artists/ApplyForm.tsx). Every field is
// checked here again; the page only says "received" once the save has succeeded (CLAUDE.md rule).
// Sheet rows and emails run after the reply, through `after()`.

// `verify`: the email hasn't been confirmed with the emailed code (the person is asked again).
export type SaveResult<T = object> = ({ ok: true } & T) | { ok: false; error: string; verify?: boolean };

const notSetUp = { ok: false as const, error: "Saving isn't set up yet." };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
// Indian mobile numbers, with or without +91 / 0 in front; other countries need at least 8 digits.
const phoneOk = (p: string) => {
  const d = p.replace(/\D/g, "");
  return /^(?:91|0)?[6-9]\d{9}$/.test(d) || (d.length >= 8 && d.length <= 15);
};
// A real yyyy-mm-dd date, from tomorrow (India time) onwards.
const dateOk = (d: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d))) return false;
  return d > new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
};

// The signed-in email (confirmed with an emailed code), or null.
async function confirmedEmail() {
  const { data } = await (await createClient()).auth.getUser();
  return data.user?.email?.toLowerCase() ?? null;
}

// ---- Booking request ----

export type BookingInput = {
  audience?: Audience; // "business" from the business portal's Book Artists tab
  categories: string[]; // slugs, as picked
  kinds?: string[]; // the kinds of artist picked (Photographers, DJs…)
  lines?: { category: string; name: string; count: number }[]; // how many of each kind
  occasion?: string;
  brief?: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM
  endTime: string; // HH:MM (earlier than the start = ends after midnight)
  venue: string; // the exact venue (Google Maps suggestion, or typed)
  city: string; // the venue's city, when Google Maps gave one
  details: string; // the brief for an artist (optional)
  name: string;
  phone: string;
  email: string;
  website?: string; // the hidden spam-trap field (see spamNote in server/notify.ts)
};

export async function createBookingRequest(input: BookingInput): Promise<SaveResult<{ ref: string }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const suspect = text(input.website, 200) !== "";
  const audience = input.audience === "business" ? "Business" : "Personal";

  const picked = Array.isArray(input.categories) ? input.categories.map(String) : [];
  const needs = categories.filter((c) => picked.includes(c.slug)).sort((a, b) => picked.indexOf(a.slug) - picked.indexOf(b.slug));
  // One line per kind of artist, kept to the categories picked and their kinds, 1 to MAX_ARTISTS each.
  const lines = (Array.isArray(input.lines) ? input.lines : [])
    .filter((l) => l && needs.some((c) => c.slug === l.category && (c.types.includes(l.name) || c.name === l.name)))
    .map((l) => ({ category: String(l.category), name: String(l.name), count: Math.max(1, Math.min(MAX_ARTISTS, Math.floor(Number(l.count) || 1))) }));
  const items: BookingItem[] = (lines.length ? lines : needs.map((c) => ({ category: c.slug, name: c.types.length === 1 ? c.types[0] : c.name, count: 1 }))).map((l) => ({
    category: l.category,
    service: l.name,
    count: l.count,
    artistIds: [],
  }));
  const wanted = items.map((i) => withCount(i.service, i.count)).join(", ");
  const date = text(input.date, 10);
  const startTime = text(input.startTime, 5);
  const endTime = text(input.endTime, 5);
  const venue = text(input.venue, 200);
  const city = text(input.city, 60);
  const occasion = text(input.occasion, 80);
  const brief = text(input.brief, 1500);
  const details = [text(input.details, 1500), brief && `Brief for the artists:\n${brief}`].filter(Boolean).join("\n\n");
  const name = text(input.name, 80);
  const phone = text(input.phone, 20);
  const email = text(input.email, 120).toLowerCase();

  if (!needs.length || !items.length) return { ok: false, error: "Pick who you need." };
  if (!dateOk(date)) return { ok: false, error: "Choose the event date, from tomorrow onwards." };
  if (eventMinutes(startTime, endTime) === null) return { ok: false, error: "Add the start time and how many hours." };
  if (venue.length < 3) return { ok: false, error: "Add where the event is." };
  if (name.length < 2) return { ok: false, error: "Enter your name." };
  if (!phoneOk(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (!emailOk(email)) return { ok: false, error: "Enter a valid email address." };

  // Keeps bots from ordering: the email must have been confirmed with the emailed 6-digit code
  // (requestCode / verifyCode in actions/auth.ts), which signs the visitor in as that email.
  if ((await confirmedEmail()) !== email) return { ok: false, error: "Confirm your email with the 6-digit code we send to it.", verify: true };

  const when = timeRange(startTime, endTime);
  const where = city || venue;
  const now = new Date().toISOString();
  const db = createAdminClient();

  try {
    // One order for the request (AOD-PH-261001, AOD-MIX-… for several categories, AOD-B2B-… from a
    // business account; src/lib/order-id.ts); the customer's reference is the same ID.
    const row = await insertOrder(
      db,
      items.map((i) => i.category),
      (id) => ({
        id,
        request_ref: id,
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
        city: where,
        venue,
        notes: details,
        status: "new",
        history: [{ at: now, by: "Website", status: "new" }],
        notes_log: suspect ? [spamNote(now)] : [],
        source: audience === "Business" ? "business" : "website",
      }),
      audience === "Business",
    );
    const ref = String(row.request_ref ?? row.id);
    const id = String(row.id);

    after(async () => {
      const received = istNow();
      // The columns of `sheetHeader` (src/server/notify.ts). "All orders" gets one row for the order;
      // each category's tab gets that category's part, under its line ID.
      const sheetRow = (lineRef: string, what: string, count: number) => [lineRef, id, received, audience, occasion, what, name, phone, email, date, when, where, details, "New", audience === "Business" ? "Business portal" : "Website", String(count), ""];
      const byCategory = needs.map((c) => ({ c, part: items.filter((i) => i.category === c.slug) }));
      const jobs: Job[] = [
        { kind: "sheet", tab: ALL_ORDERS_TAB, rows: [sheetRow(ref, wanted, totalNeeded(items))] },
        ...byCategory.map(({ c, part }): Job => ({ kind: "sheet", tab: c.name, rows: [sheetRow(lineId(id, c.slug), part.map((i) => withCount(i.service, i.count)).join(", "), totalNeeded(part))] })),
      ];
      const summary = [`Ref: ${ref}`, `Type: ${audience}`, `Looking for: ${wanted}`, occasion && `Occasion: ${occasion}`, `Date: ${date}`, `Time: ${when}`, `Venue: ${venue}`, details && `Brief for an artist:\n${details}`]
        .filter(Boolean)
        .join("\n");
      if (await notifyEnabled("New booking request")) {
        jobs.push({
          kind: "email",
          to: await teamEmails(),
          subject: spamSubject(suspect, `New booking request ${ref}: ${wanted} in ${where}`),
          text: `${summary}\n\nCustomer: ${name}\nPhone: ${phone}\nEmail: ${email}\n\nOpen the admin: ${sectionUrl("admin", `/bookings?open=${id}`)}`,
          replyTo: email,
        });
      }
      if (!suspect) {
        jobs.push({
          kind: "email",
          to: [email],
          subject: `We've received your request ${ref}`,
          text: `Hi ${name},\n\nThanks for your request. We're finding the right artist for you and will be in touch soon.\n\n${summary}\n\nSee it any time under My Bookings: ${audience === "Business" ? `${siteUrl}/business` : `${siteUrl}/my-bookings`}\n\n– Team AOD`,
        });
      }
      await runOrQueue(jobs);
    });

    return { ok: true, ref };
  } catch (e) {
    console.error("[booking request]", e);
    // Don't let the request vanish: email the team everything straight away, without the database.
    after(async () => {
      try {
        await runJob({
          kind: "email",
          to: await teamEmails(),
          subject: `Couldn't save a booking request: add it in the admin (${name}, ${wanted})`,
          text: [
            "The website couldn't save this booking request, so it isn't in the admin. Add it there (New Booking).",
            "",
            `Type: ${audience}`,
            `Looking for: ${wanted}`,
            `Date: ${date}`,
            `Time: ${when}`,
            `Venue: ${venue}`,
            `Brief for an artist: ${details || "—"}`,
            "",
            `Customer: ${name}`,
            `Phone: ${phone}`,
            `Email: ${email}`,
            "",
            `Error: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500),
          ].join("\n"),
          replyTo: email,
        });
      } catch (mailError) {
        console.error("[booking request] couldn't email the team either", mailError);
      }
    });
    return { ok: false, error: "Couldn't save your request just now. Please try again in a minute." };
  }
}

// ---- Artist sign-up (step 1: name, phone, email + code; step 2: city, category, kind, experience, links) ----
// It makes the application (APP-…); the rest (photo, date of birth, languages, services, the work
// questions, the declaration) is asked in the artist portal's Complete Your Details, which ends
// with Submit For Review (sendToAod in actions/artist.ts).

export type ApplicationInput = {
  name: string;
  phone: string;
  email: string;
  city: string;
  category: string; // category slug
  kind: string; // the kind of artist picked (Photographers, DJs…), or "" for a category with one kind
  experience: string;
  instagram: string; // the username, without instagram.com/
  link: string; // a portfolio or showreel link
  website?: string; // the hidden spam-trap field
};

export async function createApplication(input: ApplicationInput): Promise<SaveResult<{ id: string }>> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return notSetUp;
  const suspect = text(input.website, 200) !== "";

  const name = text(input.name, 80);
  const phone = text(input.phone, 20);
  const email = text(input.email, 120).toLowerCase();
  const city = text(input.city, 40);
  const category = categories.find((c) => c.slug === input.category);
  const craft = category ? (category.types.includes(text(input.kind, 60)) ? text(input.kind, 60) : category.types.length === 1 ? category.types[0] : "") : "";
  const experience = text(input.experience, 40);
  const instagram = text(input.instagram, 60).replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "");
  const link = text(input.link, 300);

  if (name.length < 2) return { ok: false, error: "Enter your full name." };
  if (!phoneOk(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (!emailOk(email)) return { ok: false, error: "Enter a valid email address." };
  if (!cities.includes(city)) return { ok: false, error: "Choose your city." };
  if (!category) return { ok: false, error: "Pick your category." };
  if (!craft) return { ok: false, error: "Pick which kind of artist you are." };
  if (!experienceLevels.includes(experience)) return { ok: false, error: "Choose your experience." };
  // Both links are required (on request, 2026-11-21): the Instagram username and a portfolio link.
  if (!/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return { ok: false, error: "Add your Instagram username." };
  const portfolio = checkPortfolioLink(link);
  if (!link) return { ok: false, error: "Add a link to your portfolio or showreel." };
  if (!portfolio.ok) return { ok: false, error: `Portfolio link: ${portfolio.message}` };
  const links = [`https://www.instagram.com/${instagram}/`, portfolio.url].filter((l, i, all) => all.indexOf(l) === i);

  if ((await confirmedEmail()) !== email) return { ok: false, error: "Confirm your email with the 6-digit code we send to it.", verify: true };

  const db = createAdminClient();
  // One profile per email: an artist or an earlier sign-up signs in instead.
  const [{ data: artist }, { data: app }] = await Promise.all([
    db.from("artists").select("id").eq("email", email).limit(1).maybeSingle(),
    db.from("applications").select("id").eq("email", email).limit(1).maybeSingle(),
  ]);
  if (artist || app) return { ok: false, error: "There's already an AOD profile with this email. Sign in to the artist portal instead." };

  try {
    const now = new Date().toISOString();
    const [row] = await insertWithNextId(db, "applications", "APP", 201, (n) => [
      {
        id: `APP-${n}`,
        name,
        phone,
        email,
        city,
        category: category.slug,
        other_categories: [],
        services: [],
        experience,
        languages: [],
        bio: "",
        links,
        details: { kind: kindOf(craft, category.slug) },
        status: "submitted",
        notes: suspect ? [spamNote(now)] : [],
      },
    ]);
    const id = String(row.id);
    after(async () => {
      const jobs: Job[] = [];
      if (await notifyEnabled("New artist application"))
        jobs.push({
          kind: "email",
          to: await teamEmails(),
          subject: spamSubject(suspect, `New artist sign-up ${id}: ${name} (${craft}, ${categoryName(category.slug)})`),
          text: `${name}, ${craft} (${categoryName(category.slug)}), ${city}\nExperience: ${experience}\nPhone: ${phone}\nEmail: ${email}\nLinks: ${links.join(", ")}\n\nThey complete their details in the artist portal and then submit them for review.\n\nOpen it: ${sectionUrl("admin", `/applications?open=${id}`)}`,
          replyTo: email,
        });
      if (!suspect)
        jobs.push({
          kind: "email",
          to: [email],
          subject: `Your AOD artist profile is ready (${id})`,
          text: `Hi ${name},\n\nThanks for joining Artists on Demand. Next, complete your details in the artist portal (your photo, the services you offer and a few questions about your work), then submit them for review.\n\nArtist portal: ${sectionUrl("artists", "/profile")}\nYour reference: ${id}\n\n– Team AOD`,
        });
      await runOrQueue(jobs);
    });
    return { ok: true, id };
  } catch (e) {
    console.error("[application]", e);
    return { ok: false, error: "Couldn't create your profile just now. Please try again in a minute." };
  }
}
