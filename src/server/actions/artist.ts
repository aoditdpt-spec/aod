"use server";

import { after } from "next/server";
import { experienceLevels, languages as languageList, onboardingStages, type BookingStatus as PortalStatus } from "@/content/artist-portal";
import { categories, cities } from "@/content/site";
import type { ArtistProfile } from "@/lib/artist-store";
import type { ApplicationStatus, PortfolioFile } from "@/lib/admin-store";
import { backendEnabled } from "@/lib/backend";
import { timeRange } from "@/lib/event-time";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { applicantTopic, artistTopic } from "@/server/live";
import { notifyEnabled, runOrQueue, teamEmails } from "@/server/notify";
import { fromRow } from "@/server/rows";

// The artist portal on the real database (artists.aod.co.in). Artists sign in with an emailed
// code; everything here first finds the artist (or applicant) by that email, and only ever reads
// or changes their own records. Artists can't read the tables directly: these actions use the
// secret key after that check, and return only what an artist should see (no customer contact
// details, nothing about other artists).

export type Result = { ok: true } | { ok: false; error: string };

// One booking request or booking, as the portal's cards show it.
export type PortalBooking = {
  id: string;
  event: string;
  service: string;
  date: string; // display text: "Sat, 21 Nov 2026 · 8:00 PM – 1:00 AM (5 hours, ends next day)"
  city: string;
  budget: string;
  note?: string;
  status: PortalStatus;
  quote?: string;
};

export type PortalFile = PortfolioFile & { url: string };

export type ArtistPortal = {
  email: string;
  kind: "artist" | "applicant";
  id: string; // ART-… or APP-…
  applicationStatus?: ApplicationStatus;
  meeting?: { at: string; place: string };
  stage: number; // index into onboardingStages
  kycVerified: boolean;
  profile: ArtistProfile;
  bookings: PortalBooking[];
  blockedDates: string[];
  portfolio: PortalFile[];
  topics: string[]; // live-update channels to listen on
};

export type PortalLoad = { state: "signed-out" } | { state: "no-account"; email: string } | { state: "ready"; data: ArtistPortal };

const BUCKET = "portfolio";
const site = () => process.env.NEXT_PUBLIC_SITE_URL || "https://www.aod.co.in";

// ---- Who is signed in ----

type Account =
  | { kind: "artist"; email: string; id: string; row: Record<string, unknown> }
  | { kind: "applicant"; email: string; id: string; row: Record<string, unknown> };

async function signedInEmail() {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email?.toLowerCase() ?? null;
}

// The artist record for this email, or else their latest application.
async function findAccount(email: string): Promise<Account | null> {
  const db = createAdminClient();
  const { data: artist } = await db.from("artists").select("*").eq("email", email).limit(1).maybeSingle();
  if (artist) return { kind: "artist", email, id: String(artist.id), row: artist };
  const { data: app } = await db.from("applications").select("*").eq("email", email).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
  if (app) return { kind: "applicant", email, id: String(app.id), row: app };
  return null;
}

async function currentAccount() {
  const email = await signedInEmail();
  return email ? findAccount(email) : null;
}

const notSignedIn = { ok: false as const, error: "You're signed out. Please sign in again." };

// ---- Loading the portal ----

const stageOf = (status: ApplicationStatus) => (status === "trial" ? 2 : status === "approved" ? 3 : status === "submitted" ? 0 : 1);

const showDate = (date: string, start: string, end?: string) => {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "Date to be fixed";
  return start ? `${day} · ${timeRange(start, end)}` : day;
};

const withUrls = (files: PortfolioFile[]): PortalFile[] =>
  files.map((f) => ({ ...f, url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${f.path.split("/").map(encodeURIComponent).join("/")}` }));

export async function loadArtistPortal(): Promise<PortalLoad> {
  const email = await signedInEmail();
  if (!email) return { state: "signed-out" };
  const account = await findAccount(email);
  if (!account) return { state: "no-account", email };

  const db = createAdminClient();
  const topics = [applicantTopic(email)];

  if (account.kind === "applicant") {
    const app = fromRow.application(account.row);
    return {
      state: "ready",
      data: {
        email,
        kind: "applicant",
        id: app.id,
        applicationStatus: app.status,
        meeting: app.meeting,
        stage: stageOf(app.status),
        kycVerified: app.kyc === "verified",
        profile: { fullName: app.name, phone: app.phone, email: app.email, city: app.city, category: app.category, services: app.services, experience: app.experience, languages: app.languages, bio: app.bio, links: app.links, agreeTerms: true },
        bookings: [],
        blockedDates: [],
        portfolio: withUrls(app.portfolio ?? []),
        topics,
      },
    };
  }

  const artist = fromRow.artist(account.row);
  topics.push(artistTopic(artist.id));
  const [{ data: rows }, { data: replyRows }] = await Promise.all([
    db.from("bookings").select("*").or(`artist_id.eq.${artist.id},shortlist.cs.{${artist.id}}`).order("event_date", { ascending: true }),
    db.from("artist_replies").select("*").eq("artist_id", artist.id),
  ]);
  const replies = new Map((replyRows ?? []).map(fromRow.reply).map((r) => [r.bookingId, r]));

  const bookings: PortalBooking[] = [];
  for (const b of (rows ?? []).map(fromRow.booking)) {
    let status: PortalStatus | null = null;
    const reply = replies.get(b.id);
    if (b.artistId === artist.id) {
      if (["confirmed", "rescheduled"].includes(b.status)) status = "confirmed";
      else if (["completed", "delivered", "reviewed"].includes(b.status)) status = "completed";
      else if (b.status === "cancelled") status = "cancelled";
      else status = "selected";
    } else if (!b.artistId && b.status !== "cancelled") {
      // Shortlisted, and the customer hasn't picked anyone yet.
      status = reply ? reply.status : "new";
    }
    if (!status) continue; // went to another artist, or cancelled before they were picked
    bookings.push({
      id: b.id,
      event: b.event || "Event",
      service: b.service,
      date: showDate(b.date, b.time, b.endTime),
      city: b.city,
      budget: b.budget || "Not given yet",
      note: b.notes || undefined,
      status,
      quote: reply?.status === "quoted" && reply.quote ? String(reply.quote) : undefined,
    });
  }

  return {
    state: "ready",
    data: {
      email,
      kind: "artist",
      id: artist.id,
      stage: onboardingStages.length - 1,
      kycVerified: artist.kyc === "verified",
      profile: {
        fullName: artist.name,
        phone: artist.phone,
        email: artist.email,
        city: artist.city,
        category: artist.category,
        services: artist.services,
        experience: artist.experience,
        languages: artist.languages,
        bio: artist.bio ?? "",
        links: artist.links ?? [],
        agreeTerms: true,
      },
      bookings,
      blockedDates: [...artist.blockedDates].sort(),
      portfolio: withUrls(artist.portfolio ?? []),
      topics,
    },
  };
}

// ---- Profile ----

export type ProfilePatch = Partial<Pick<ArtistProfile, "phone" | "city" | "services" | "experience" | "languages" | "bio" | "links">>;

const phoneOk = (p: string) => {
  const d = p.replace(/\D/g, "");
  return /^(?:91|0)?[6-9]\d{9}$/.test(d) || (d.length >= 8 && d.length <= 15);
};

// Name and category stay as AOD approved them; everything else the artist keeps up to date.
export async function saveArtistProfile(patch: ProfilePatch): Promise<Result> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  const row: Record<string, unknown> = {};
  const category = categories.find((c) => c.slug === String(account.row.category));

  if (patch.phone !== undefined) {
    const phone = String(patch.phone).trim().slice(0, 20);
    if (!phoneOk(phone)) return { ok: false, error: "Enter a valid phone number." };
    row.phone = phone;
  }
  if (patch.city !== undefined) {
    const city = String(patch.city);
    if (![...cities, "Other city in Gujarat"].includes(city)) return { ok: false, error: "Choose your city." };
    row.city = city;
  }
  if (patch.services !== undefined) {
    const allowed = new Set(category?.services.map((s) => s.name) ?? []);
    const services = [...new Set((Array.isArray(patch.services) ? patch.services : []).map(String))].filter((s) => allowed.has(s));
    if (!services.length) return { ok: false, error: "Pick at least one service." };
    row.services = services;
  }
  if (patch.experience !== undefined) {
    if (!experienceLevels.includes(String(patch.experience))) return { ok: false, error: "Choose your experience." };
    row.experience = String(patch.experience);
  }
  if (patch.languages !== undefined) {
    row.languages = [...new Set((Array.isArray(patch.languages) ? patch.languages : []).map(String))].filter((l) => languageList.includes(l));
  }
  if (patch.bio !== undefined) row.bio = String(patch.bio).trim().slice(0, 600);
  if (patch.links !== undefined) {
    const links: string[] = [];
    for (const raw of (Array.isArray(patch.links) ? patch.links : []).slice(0, 10)) {
      const check = checkPortfolioLink(String(raw));
      if (!check.ok) return { ok: false, error: `${String(raw).slice(0, 60)}: ${check.message}` };
      if (!links.includes(check.url)) links.push(check.url);
    }
    row.links = links;
  }
  if (!Object.keys(row).length) return { ok: true };

  const table = account.kind === "artist" ? "artists" : "applications";
  const { error } = await createAdminClient().from(table).update(row).eq("id", account.id);
  if (error) return { ok: false, error: "Couldn't save your profile just now. Please try again." };
  return { ok: true };
}

// ---- Availability ----

export async function saveAvailability(dates: string[]): Promise<Result> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  if (account.kind !== "artist") return { ok: false, error: "Availability opens once you're live on AOD." };
  const clean = [...new Set((Array.isArray(dates) ? dates : []).map(String))]
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)))
    .sort()
    .slice(0, 400);
  const { error } = await createAdminClient().from("artists").update({ blocked_dates: clean }).eq("id", account.id);
  if (error) return { ok: false, error: "Couldn't save your days off just now. Please try again." };
  return { ok: true };
}

// ---- Replying to a booking request ----

export async function replyToBooking(bookingId: string, status: "quoted" | "declined", quote?: number, note?: string): Promise<Result> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  if (account.kind !== "artist") return { ok: false, error: "Booking requests open once you're live on AOD." };
  if (status !== "quoted" && status !== "declined") return { ok: false, error: "Choose to quote or decline." };
  const amount = status === "quoted" ? Math.round(Number(quote)) : null;
  if (status === "quoted" && !(amount! >= 500 && amount! <= 10_000_000)) return { ok: false, error: "Enter your quote in rupees (at least ₹500)." };

  const db = createAdminClient();
  const { data } = await db.from("bookings").select("*").eq("id", String(bookingId)).maybeSingle();
  if (!data) return { ok: false, error: "This request no longer exists." };
  const b = fromRow.booking(data);
  if (!b.shortlist.includes(account.id)) return { ok: false, error: "This request isn't one of yours." };
  if (b.artistId || b.status === "cancelled") return { ok: false, error: "This request has already been settled." };

  const text = String(note ?? "").trim().slice(0, 300);
  const { error } = await db
    .from("artist_replies")
    .upsert({ booking_id: b.id, artist_id: account.id, status, quote: amount, note: text, at: new Date().toISOString() }, { onConflict: "booking_id,artist_id" });
  if (error) return { ok: false, error: "Couldn't send your reply just now. Please try again." };

  const name = String(account.row.name);
  after(async () => {
    if (!(await notifyEnabled("Artist replied to a request"))) return;
    await runOrQueue([
      {
        kind: "email",
        to: teamEmails(),
        subject: status === "quoted" ? `${name} quoted ₹${amount!.toLocaleString("en-IN")} for ${b.id}` : `${name} declined ${b.id}`,
        text: `${name} ${status === "quoted" ? `quoted ₹${amount!.toLocaleString("en-IN")}` : "declined"} for ${b.id} (${b.service}, ${b.event}, ${b.date}, ${b.city}).${text ? `\n\nNote: ${text}` : ""}\n\nOpen the booking: ${site()}/admin/bookings?open=${b.id}`,
      },
    ]);
  });
  return { ok: true };
}

// ---- Portfolio photos and videos (Supabase Storage) ----

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime"];
const MAX_FILES = 30;
const MB = 1024 * 1024;

const ownFiles = (account: Account) => (Array.isArray(account.row.portfolio) ? (account.row.portfolio as PortfolioFile[]) : []);
const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60) || "file";

// Step 1: a one-time upload link for one file, in the artist's own folder.
export async function startPortfolioUpload(name: string, type: string, size: number): Promise<({ ok: true } & { path: string; token: string }) | { ok: false; error: string }> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  const isImage = IMAGE_TYPES.includes(type);
  if (!isImage && !VIDEO_TYPES.includes(type)) return { ok: false, error: "Upload JPG, PNG, WebP or HEIC photos, or MP4 or MOV videos." };
  if (!(size > 0) || size > (isImage ? 15 : 50) * MB) return { ok: false, error: isImage ? "Photos can be up to 15 MB." : "Videos can be up to 50 MB. For longer films, add a YouTube or Vimeo link instead." };
  if (ownFiles(account).length >= MAX_FILES) return { ok: false, error: `You can keep up to ${MAX_FILES} files. Remove one to add another.` };

  const path = `${account.id}/${Date.now()}-${safeName(String(name))}`;
  const { data, error } = await createAdminClient().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Uploads aren't available just now. Please try again in a minute." };
  return { ok: true, path: data.path, token: data.token };
}

// Step 2, after the browser has uploaded: check the file is there and add it to the profile.
export async function finishPortfolioUpload(path: string, name: string, type: string, size: number): Promise<Result> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  const [folder, file] = String(path).split("/");
  if (folder !== account.id || !file) return { ok: false, error: "That upload isn't yours." };
  const db = createAdminClient();
  const { data } = await db.storage.from(BUCKET).list(folder, { search: file, limit: 1 });
  if (!data?.some((f) => f.name === file)) return { ok: false, error: "The upload didn't finish. Please try again." };

  const files = ownFiles(account).filter((f) => f.path !== path);
  files.push({ path, name: String(name).slice(0, 120), type: String(type), size: Number(size) || 0, at: new Date().toISOString() });
  const table = account.kind === "artist" ? "artists" : "applications";
  const { error } = await db.from(table).update({ portfolio: files }).eq("id", account.id);
  if (error) return { ok: false, error: "Couldn't add the file to your portfolio. Please try again." };
  return { ok: true };
}

export async function removePortfolioFile(path: string): Promise<Result> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  if (!String(path).startsWith(`${account.id}/`)) return { ok: false, error: "That file isn't yours." };
  const db = createAdminClient();
  await db.storage.from(BUCKET).remove([String(path)]);
  const table = account.kind === "artist" ? "artists" : "applications";
  const { error } = await db.from(table).update({ portfolio: ownFiles(account).filter((f) => f.path !== path) }).eq("id", account.id);
  if (error) return { ok: false, error: "Couldn't remove the file just now. Please try again." };
  return { ok: true };
}
