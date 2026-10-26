"use server";

import { after } from "next/server";
import { briefCommonRows, briefRows } from "@/content/artist-brief";
import { experienceLevels, languages as languageList, onboardingStages, type BookingStatus as PortalStatus } from "@/content/artist-portal";
import { categories, cities } from "@/content/site";
import type { ArtistProfile } from "@/lib/artist-store";
import type { ApplicationStatus, PortfolioFile } from "@/lib/admin-store";
import { backendEnabled } from "@/lib/backend";
import { allCategories, assignedArtists, itemFor } from "@/lib/booking-needs";
import { artistOrder, stillOpen } from "@/lib/artist-orders";
import { lineId } from "@/lib/order-id";
import { sectionUrl } from "@/lib/site-url";
import { timeRange } from "@/lib/event-time";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { applicantTopic, artistTopic } from "@/server/live";
import { notifyEnabled, runOrQueue, teamEmails } from "@/server/notify";
import { readDataUrl, savePhoto } from "@/server/artist-photos";
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
  ref?: string; // the ID the artist sees: their line's (AOD-DR-102602 of order AOD-MIX-102602), when it differs from `id`
  event: string;
  service: string;
  date: string; // display text: "Sat, 21 Nov 2026 · 8:00 PM – 1:00 AM (5 hours, ends next day)"
  city: string;
  budget: string;
  note?: string;
  brief?: { label: string; value: string }[]; // the customer's brief: this artist's category, then the shared answers
  status: PortalStatus;
  quote?: string;
  team?: number; // how many artists of this category the booking needs, when more than one
};

export type PortalFile = PortfolioFile & { url: string };

export type ArtistPortal = {
  email: string;
  kind: "artist" | "applicant";
  id: string; // ART-… or APP-…
  applicationStatus?: ApplicationStatus;
  meeting?: { at: string; place: string };
  stage: number; // index into onboardingStages
  identityVerified: boolean; // marked by the AOD team in the admin (no online check)
  appliedAt?: string; // when the application was sent
  approvedAt?: string; // when they went live (the artist record's joining date)
  sentToAodAt?: string; // when they last pressed Submit for review / Send update (sendToAod)
  profile: ArtistProfile;
  bookings: PortalBooking[];
  blockedDates: string[];
  portfolio: PortalFile[];
  topics: string[]; // live-update channels to listen on
};

export type PortalLoad = { state: "signed-out" } | { state: "no-account"; email: string } | { state: "ready"; data: ArtistPortal };

const BUCKET = "portfolio";

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
        sentToAodAt: lastSent(app.notes),
        meeting: app.meeting,
        stage: stageOf(app.status),
        identityVerified: app.kyc === "verified",
        appliedAt: app.submittedAt,
        profile: { fullName: app.name, phone: app.phone, email: app.email, city: app.city, category: app.category, otherCategories: app.otherCategories, services: app.services, experience: app.experience, languages: app.languages, bio: app.bio, links: app.links, photo: app.photo ?? "", agreeTerms: true },
        bookings: [],
        blockedDates: [],
        portfolio: withUrls(app.portfolio ?? []),
        topics,
      },
    };
  }

  const artist = fromRow.artist(account.row);
  topics.push(artistTopic(artist.id));
  // The application they were approved from, for the Approval page's dates.
  const { data: application } = await db.from("applications").select("submitted_at").eq("artist_id", artist.id).maybeSingle();
  const [{ data: rows }, { data: replyRows }] = await Promise.all([
    db.from("bookings").select("*").or(`artist_ids.cs.{${artist.id}},artist_id.eq.${artist.id},shortlist.cs.{${artist.id}}`).order("event_date", { ascending: true }),
    db.from("artist_replies").select("*").eq("artist_id", artist.id),
  ]);
  const replies = new Map((replyRows ?? []).map(fromRow.reply).map((r) => [r.bookingId, r]));
  // A rescheduled booking is only "confirmed" for the artist once the customer has paid.
  const rescheduled = (rows ?? []).filter((r) => r.status === "rescheduled").map((r) => String(r.id));
  const { data: paidRows } = rescheduled.length
    ? await db.from("payments").select("booking_id").in("booking_id", rescheduled).eq("status", "verified")
    : { data: [] };
  const paid = new Set((paidRows ?? []).map((r) => String(r.booking_id)));

  const bookings: PortalBooking[] = [];
  for (const b of (rows ?? []).map(fromRow.booking)) {
    const reply = replies.get(b.id);
    // Which orders they see and how (src/lib/artist-orders.ts, shared with the admin's artist drawer).
    const order = artistOrder(b, artist, reply?.status, paid.has(b.id));
    if (!order) continue; // went to other artists, or cancelled before they were picked
    const { status, item } = order;
    bookings.push({
      id: b.id,
      ref: item ? lineId(b.id, item.category) : undefined,
      event: b.event || "Event",
      service: (item ?? b.items[0])?.service ?? "",
      date: showDate(b.date, b.time, b.endTime),
      city: b.city,
      budget: b.budget || "Not given yet",
      note: b.notes || undefined,
      brief: (() => {
        const rows = [...(item ? briefRows(b.brief, item.category) : []), ...briefCommonRows(b.brief)];
        return rows.length ? rows : undefined;
      })(),
      status,
      quote: reply?.status === "quoted" && reply.quote ? String(reply.quote) : undefined,
      team: item && item.count > 1 ? item.count : undefined,
    });
  }

  return {
    state: "ready",
    data: {
      email,
      kind: "artist",
      id: artist.id,
      stage: onboardingStages.length - 1,
      identityVerified: artist.kyc === "verified",
      sentToAodAt: lastSent(artist.notes),
      appliedAt: application?.submitted_at ? String(application.submitted_at) : undefined,
      approvedAt: artist.joinedAt,
      profile: {
        fullName: artist.name,
        phone: artist.phone,
        email: artist.email,
        city: artist.city,
        category: artist.category,
        otherCategories: artist.otherCategories,
        services: artist.services,
        experience: artist.experience,
        languages: artist.languages,
        bio: artist.bio ?? "",
        links: artist.links ?? [],
        photo: artist.photo ?? "",
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

// Name and categories stay as AOD approved them; everything else the artist keeps up to date.
export async function saveArtistProfile(patch: ProfilePatch): Promise<Result> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  const row: Record<string, unknown> = {};
  const own = allCategories({ category: String(account.row.category), otherCategories: Array.isArray(account.row.other_categories) ? account.row.other_categories.map(String) : [] });
  const offered = categories.filter((c) => own.includes(c.slug)).flatMap((c) => c.services.map((s) => s.name));

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
    const allowed = new Set(offered);
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

// ---- Profile photo ----

// A new profile photo from the gallery or camera (shrunk in the browser): straight to AOD's
// Google Drive (src/server/artist-photos.ts), replacing the old one in place.
export async function saveMyPhoto(dataUrl: string): Promise<Result> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  const photo = readDataUrl(dataUrl);
  if ("error" in photo) return { ok: false, error: photo.error };
  try {
    await savePhoto({ kind: "photo", table: account.kind === "artist" ? "artists" : "applications", id: account.id, type: photo.type, data: photo.data });
    return { ok: true };
  } catch (e) {
    console.error("[profile photo]", e);
    return { ok: false, error: "Couldn't save your photo just now. Please try again in a minute." };
  }
}

// ---- Submit for review / Send update ----

// The portal's final button: an applicant sends their application (photo, portfolio, links,
// profile) to the AOD team for review, and later sends updates; an approved artist sends updates
// to their profile. It adds a dated note to their record (shown in the admin's drawer, never to
// the artist) and emails the team (admin Settings → "New artist application"). One send per
// 5 minutes; a quicker second tap just returns the last one.
const SENT_BY = "Artist portal";
const lastSent = (notes: { at: string; by: string }[] | undefined) => notes?.find((n) => n.by === SENT_BY)?.at;

export type SendResult = { ok: true; at: string } | { ok: false; error: string };

export async function sendToAod(): Promise<SendResult> {
  const account = await currentAccount();
  if (!account) return notSignedIn;
  const row = account.row;
  const notes = (Array.isArray(row.notes) ? row.notes : []) as { at: string; by: string; text: string }[];
  const last = lastSent(notes);
  if (last && Date.now() - new Date(last).getTime() < 5 * 60_000) return { ok: true, at: last };

  const first = !last && account.kind === "applicant";
  const links = Array.isArray(row.links) ? row.links.length : 0;
  const files = Array.isArray(row.portfolio) ? row.portfolio.length : 0;
  const summary = `photo ${row.photo ? "added" : "missing"}, ${files} portfolio file${files === 1 ? "" : "s"}, ${links} link${links === 1 ? "" : "s"}`;
  const at = new Date().toISOString();
  const text = first ? `Submitted for review from the artist portal (${summary}).` : `Sent an update from the artist portal (${summary}).`;
  const table = account.kind === "artist" ? "artists" : "applications";
  const { error } = await createAdminClient().from(table).update({ notes: [{ at, by: SENT_BY, text }, ...notes] }).eq("id", account.id);
  if (error) return { ok: false, error: "Couldn't send it just now. Please try again in a minute." };

  const name = String(row.name ?? "");
  after(async () => {
    if (!(await notifyEnabled("New artist application"))) return;
    await runOrQueue([
      {
        kind: "email",
        to: await teamEmails(),
        subject: `${first ? "Ready for review" : account.kind === "artist" ? "Artist profile updated" : "Application updated"}: ${name} (${account.id})`,
        text: `${name} ${first ? "has submitted their application for review" : "has sent an update"} from the artist portal: ${summary}.\n\nOpen it: ${sectionUrl("admin", `/${account.kind === "artist" ? "artists" : "applications"}?open=${account.id}`)}`,
        replyTo: account.email,
      },
    ]);
  });
  return { ok: true, at };
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
  const item = itemFor(b.items, account.id, fromRow.artist(account.row));
  if (assignedArtists(b.items).includes(account.id) || !stillOpen(b.items, item) || b.status === "cancelled")
    return { ok: false, error: "This request has already been settled." };

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
        to: await teamEmails(),
        subject: status === "quoted" ? `${name} quoted ₹${amount!.toLocaleString("en-IN")} for ${b.id}` : `${name} declined ${b.id}`,
        text: `${name} ${status === "quoted" ? `quoted ₹${amount!.toLocaleString("en-IN")}` : "declined"} for ${b.id} (${(item ?? b.items[0])?.service ?? ""}, ${b.event}, ${b.date}, ${b.city}).${text ? `\n\nNote: ${text}` : ""}\n\nOpen the booking: ${sectionUrl("admin", `/bookings?open=${b.id}`)}`,
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
  const stored = data?.find((f) => f.name === file);
  if (!stored) return { ok: false, error: "The upload didn't finish. Please try again." };

  // Check the file as stored, not what the browser said in step 1: the upload link itself
  // accepts any allowed type up to the bucket's 50 MB.
  const realType = String(stored.metadata?.mimetype ?? type);
  const realSize = Number(stored.metadata?.size ?? size) || 0;
  const isImage = IMAGE_TYPES.includes(realType);
  if ((!isImage && !VIDEO_TYPES.includes(realType)) || realSize > (isImage ? 15 : 50) * MB) {
    await db.storage.from(BUCKET).remove([path]);
    return { ok: false, error: isImage ? "Photos can be up to 15 MB." : "Upload JPG, PNG, WebP or HEIC photos up to 15 MB, or MP4 or MOV videos up to 50 MB." };
  }

  const files = ownFiles(account).filter((f) => f.path !== path);
  files.push({ path, name: String(name).slice(0, 120), type: realType, size: realSize, at: new Date().toISOString() });
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
