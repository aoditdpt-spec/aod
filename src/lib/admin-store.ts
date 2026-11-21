"use client";

import type { WorkDetails } from "./artist-store";
import type { BookingItem } from "./booking-needs";
import { nextOrderNumber, orderId } from "./order-id";
import type { Brief } from "@/content/artist-brief";
import { useSyncExternalStore } from "react";
import type { Role } from "@/content/admin";
import { backendEnabled } from "@/lib/backend";
import { listenLive, type LiveStatus } from "@/lib/live";
import { adminSession, loadAdminDb, saveAdminChanges, type AdminChanges, type Collection } from "@/server/actions/admin";
import { signOutAction } from "@/server/actions/auth";
import { showNotice } from "@/lib/notice";

// The admin panel's live data (only used with the Supabase keys set; the preview's admin runs on
// src/lib/mock-db.ts): one `Db` object loaded from the database for the signed-in staff member,
// changed with `update()`, which also writes the activity log and saves just the records it changed
// (server actions in src/server/actions/admin.ts, checked against the person's role). If a save is
// refused, the data is reloaded and the reason shown. While signed in it listens on the "staff" live
// channel (src/lib/live.ts) and reloads whenever anyone (another staff member, a website form, an
// artist in the portal) changes something. src/lib/app-db.tsx maps it for the screens.

export type Note = { at: string; by: string; text: string };

export type ApplicationStatus = "submitted" | "review" | "meeting" | "trial" | "approved" | "rejected";
export type Application = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  category: string; // main category slug
  otherCategories: string[]; // other categories they also work in (src/lib/booking-needs.ts)
  services: string[];
  experience: string;
  languages: string[];
  bio: string;
  links: string[];
  submittedAt: string;
  status: ApplicationStatus;
  meeting?: { at: string; place: string };
  kyc: "not_started" | "verified";
  notes: Note[];
  artistId?: string; // set when approved
  portfolio?: PortfolioFile[]; // uploaded from the artist portal while applying (live mode)
  photo?: string; // "<Drive file id>~<version>": their profile photo on AOD's Google Drive (src/server/artist-photos.ts)
  details?: WorkDetails; // "Your work details" answers, by question id
};

// A photo or video in the `portfolio` storage bucket (live mode).
export type PortfolioFile = { path: string; name: string; type: string; size: number; at: string };

export type Artist = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  category: string; // main category slug
  otherCategories: string[]; // other categories they also work in; matching offers them for any
  services: string[];
  experience: string;
  languages: string[];
  joinedAt: string;
  status: "active" | "paused";
  kyc: "verified" | "pending";
  payoutUpi: string;
  blockedDates: string[];
  notes: Note[];
  // Kept up to date by the artist in the portal (live mode).
  bio?: string;
  links?: string[];
  portfolio?: PortfolioFile[];
  photo?: string; // "<Drive file id>~<version>", from the application, the portal or the admin
  details?: WorkDetails; // date of birth ("dob"), area ("locality") and "Your work details" answers, from the application
};

// An artist's answer to a booking request in their categories: "accepted" means they're available
// that day ("quoted" is the older answer, a quote); sent from the artist portal.
export type ArtistReply = { artistId: string; status: "accepted" | "quoted" | "declined"; quote?: number; note: string; at: string };

export type BookingStatus =
  | "new"
  | "matched"
  | "advance" // the advance is paid (new design, 2026-11-21: Matched → Advance Paid → Confirmed)
  | "quoted"
  | "payment_pending"
  | "confirmed"
  | "completed"
  | "delivered"
  | "reviewed"
  | "cancelled"
  | "rescheduled";
export type Booking = {
  id: string;
  requestRef?: string; // the customer's reference: the same as `id` for new orders (AOD-PH-261001); AOD-1048 for older ones (booking B-1048)
  createdAt: string;
  audience: "Personal" | "Business";
  customer: { name: string; phone: string; email: string };
  // What the order needs, one line per category ("Photographers × 2", "Models × 1"), each with
  // the artists assigned to it (src/lib/booking-needs.ts).
  items: BookingItem[];
  event: string;
  date: string; // yyyy-mm-dd
  time: string; // start, HH:MM
  endTime?: string; // end, HH:MM (earlier than the start = ends after midnight)
  city: string;
  venue: string;
  budget: string;
  notes: string;
  brief?: Brief; // the customer's "Brief for the artists" from the booking form (src/content/artist-brief.ts)
  status: BookingStatus;
  shortlist: string[]; // artist ids offered to the customer, from any of the order's categories
  quote?: number;
  advance?: number;
  delivery?: { link: string; expires: string };
  review?: { rating: number; text: string };
  history: { at: string; by: string; status: BookingStatus }[];
  notesLog: Note[];
  replies?: ArtistReply[]; // read-only here: written by artists through the portal
  source?: string; // website, business, whatsapp, admin …
};

export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  utr: string;
  payer: string;
  reportedAt: string;
  status: "pending" | "verified" | "rejected";
  checkedBy?: string;
  checkedAt?: string;
  reason?: string;
};

export type Payout = {
  id: string;
  artistId: string;
  bookingId: string;
  amount: number;
  status: "due" | "paid";
  paidAt?: string;
  reference?: string;
};

export type LeadStatus = "new" | "contacted" | "converted" | "lost";
export type Lead = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  source: string;
  type: "Personal" | "Business";
  need: string;
  city: string;
  status: LeadStatus;
  notes: Note[];
  bookingId?: string;
};

// A Resolution Centre case: a problem with a booking, raised by a customer, business or artist.
export type CaseStatus = "received" | "acknowledged" | "investigating" | "resolved" | "escalated" | "closed";
export type ResolutionCase = {
  id: string; // DC-1001 (Dispute Desk case)
  createdAt: string;
  role: "customer" | "business" | "artist";
  name: string;
  email: string;
  phone: string;
  bookingRef: string; // the AOD booking or request number; empty for a booking made outside AOD
  otherParty?: string; // who the dispute is with, for a booking made outside AOD
  issue: string;
  incidentDate: string; // yyyy-mm-dd
  description: string;
  outcome: string; // what they'd like done
  evidence: string[]; // links to photos, chats or files
  status: CaseStatus;
  resolution?: string; // AOD's decision, shown to the person when they track the case
  history: { at: string; by: string; status: CaseStatus }[];
  notes: Note[]; // internal, never shown to the person
};

// A blog post (aod.co.in/blog), written in the admin's Blog page. `body` is Markdown
// (src/lib/markdown.ts). The site shows it once it's published and `publishedAt` has passed.
export type PostStatus = "draft" | "published";
export type Post = {
  id: string; // P-101
  slug: string; // its address: /blog/<slug>
  title: string;
  excerpt: string;
  body: string;
  cover: string; // photo address ("" for none)
  coverAlt: string;
  tags: string[];
  author: string;
  status: PostStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

// A newsletter sign-up. The website adds it as "pending" and it becomes "subscribed" when the
// person clicks the link in the confirmation email (src/server/actions/newsletter.ts).
export type SubscriberStatus = "pending" | "subscribed" | "unsubscribed";
export type Subscriber = {
  id: string; // S-101
  email: string;
  status: SubscriberStatus;
  source: string; // the page they signed up on
  createdAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
};

// A newsletter issue, written and sent from the admin's Newsletter page.
export type Newsletter = {
  id: string; // N-101
  subject: string;
  body: string; // Markdown
  status: "draft" | "sent";
  createdAt: string;
  sentAt?: string;
  sentBy: string;
  recipients: number;
};

export type Member = { id: string; name: string; email: string; role: Role; active: boolean; twoFactor: boolean; lastActive: string };

export type Activity = { id: string; at: string; by: string; area: string; text: string; target?: string };

export type Settings = {
  commissionPct: number;
  paymentHoldHours: number;
  deliveryLinkDays: number;
  advancePct: number;
  notify: Record<string, boolean>;
};

export type Db = {
  version: 1;
  applications: Application[];
  artists: Artist[];
  bookings: Booking[];
  payments: Payment[];
  payouts: Payout[];
  leads: Lead[];
  cases: ResolutionCase[];
  posts: Post[];
  subscribers: Subscriber[];
  newsletters: Newsletter[];
  team: Member[];
  activity: Activity[];
  settings: Settings;
};

export type Session = { name: string; email: string; role: Role };

// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: Listener) {
  listeners.add(l);
  if (backendEnabled && live.status === "idle") void loadLive();
  return () => {
    listeners.delete(l);
  };
}

// ---- Live mode (Supabase) ----

type Live = {
  status: "idle" | "loading" | "ready" | "signed-out" | "error";
  db: Db | null;
  session: Session | null;
  error?: string;
  connection: LiveStatus;
};
let live: Live = { status: "idle", db: null, session: null, connection: "off" };
const setLive = (patch: Partial<Live>) => {
  live = { ...live, ...patch };
  emit();
};

// Load (or reload) the signed-in staff member and all the data. `quiet` keeps the current data on
// screen while reloading.
async function loadLive(quiet = false) {
  if (!quiet) setLive({ status: "loading" });
  try {
    const session = await adminSession();
    if (!session) {
      stopListening();
      return setLive({ status: "signed-out", session: null, db: null });
    }
    const db = await loadAdminDb();
    if (!db) {
      stopListening();
      return setLive({ status: "signed-out", session: null, db: null });
    }
    setLive({ status: "ready", session, db, error: undefined });
    startListening();
  } catch (e) {
    setLive({ status: "error", error: e instanceof Error ? e.message : "Couldn't load the data." });
  }
}

// Called after signing in with the emailed code.
export const reloadAdmin = () => loadLive();

// Live updates: reload quietly when the database says something changed. While this browser is
// saving, wait until the save is done, so a half-saved change never replaces what's on screen.
let saving = 0;
let reloadAfterSave = false;
let stopLive: (() => void) | null = null;
function startListening() {
  if (stopLive) return;
  stopLive = listenLive(
    ["staff"],
    () => {
      if (saving) reloadAfterSave = true;
      else void loadLive(true);
    },
    { onStatus: (connection) => setLive({ connection }) },
  );
}
function stopListening() {
  stopLive?.();
  stopLive = null;
}
function saveFinished() {
  saving--;
  emit(); // the header's "Saving…" goes away
  if (!saving && reloadAfterSave) {
    reloadAfterSave = false;
    void loadLive(true);
  }
}

const collections: Collection[] = ["applications", "artists", "bookings", "payments", "payouts", "leads", "cases", "posts", "subscribers", "newsletters", "team"];

// What an action changed: records added, changed or removed in each list, and the settings.
function diff(before: Db, after: Db): AdminChanges {
  const changes: AdminChanges = { added: {}, changed: {}, removed: {}, activity: [] };
  for (const key of collections) {
    const old = new Map<string, unknown>(before[key].map((x) => [x.id, x]));
    const now = new Map<string, unknown>(after[key].map((x) => [x.id, x]));
    const added = [...now].filter(([id]) => !old.has(id)).map(([, x]) => x);
    const changed = [...now].filter(([id, x]) => old.has(id) && JSON.stringify(x) !== JSON.stringify(old.get(id))).map(([id, x]) => ({ before: old.get(id), after: x }));
    const removed = [...old.keys()].filter((id) => !now.has(id));
    if (added.length) changes.added[key] = added;
    if (changed.length) changes.changed[key] = changed;
    if (removed.length) changes.removed[key] = removed;
  }
  if (JSON.stringify(before.settings) !== JSON.stringify(after.settings)) changes.settings = after.settings;
  return changes;
}

// The data the screens work on (only called once it has loaded).
const getDb = (): Db => live.db!;
const getLiveDb = () => live.db;

// null during server rendering and until the data is ready.
export function useDb(): Db | null {
  return useSyncExternalStore(subscribe, getLiveDb, () => null);
}

// A new booking's order ID for these categories (AOD-PH-261001, AOD-MIX-… for several; src/lib/order-id.ts).
export function newOrderId(categories: string[], business = false): string {
  return orderId(categories, nextOrderNumber(getDb().bookings.map((b) => b.id)), new Date(), business);
}

// Next number in a series: PAY-3102 after PAY-3101, APP-206 after APP-205.
export function newId(prefix: string): string {
  const db = getDb();
  const ids = [db.applications, db.artists, db.bookings, db.payments, db.payouts, db.leads, db.cases, db.posts, db.subscribers, db.newsletters, db.team].flat().map((x) => x.id);
  const nums = ids.filter((id) => id.startsWith(`${prefix}-`)).map((id) => Number(id.slice(prefix.length + 1))).filter(Number.isFinite);
  return `${prefix}-${(nums.length ? Math.max(...nums) : 100) + 1}`;
}

// Apply a change and log it. `fn` gets a copy of the data to change in place.
export function update(area: string, text: string, fn: (db: Db) => void, target?: string) {
  const before = getDb();
  const db: Db = structuredClone(before);
  fn(db);
  const entry: Activity = {
    id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    by: getSession()?.name ?? "Someone",
    area,
    text,
    target,
  };
  db.activity.unshift(entry);
  db.activity = db.activity.slice(0, 500);

  if (!backendEnabled) return;
  // Show the change straight away, save it, and reload if the save is refused.
  const changes = { ...diff(before, db), activity: [entry] };
  saving++; // before setLive, so the header shows "Saving…" with the change
  setLive({ db });
  saveAdminChanges(changes)
    .then((res) => {
      if (!res.ok) {
        showNotice(res.error);
        reloadAfterSave = true;
      }
    })
    .catch(() => {
      showNotice("Couldn't save the change. Check your connection; the page has been refreshed.");
      reloadAfterSave = true;
    })
    .finally(saveFinished);
}

// The signed-in person's name, for notes and history entries.
export const currentUser = () => getSession()?.name ?? "Someone";

// ---- Session ----

export function getSession(): Session | null {
  return live.session;
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

export function signOut() {
  stopListening();
  setLive({ status: "signed-out", session: null, db: null });
  void signOutAction();
}

// Whether the admin knows yet if someone is signed in (live: after the first load; preview: once
// the browser has its data), so pages can wait before deciding to redirect.
const noop = () => () => {};
const always = () => true;
const liveReady = () => live.status !== "idle" && live.status !== "loading";
export function useBrowserReady() {
  return useSyncExternalStore(backendEnabled ? subscribe : noop, backendEnabled ? liveReady : always, () => false);
}

// Live mode: whether the live-update channel is connected (shown in the header).
const liveConnection = () => live.connection;
const offConnection = () => "off" as const;
export function useLiveConnection(): LiveStatus {
  return useSyncExternalStore(backendEnabled ? subscribe : noop, backendEnabled ? liveConnection : offConnection, offConnection);
}

// Live mode: whether a change is still being saved (the header shows "Saving…").
const isSaving = () => saving > 0;
const notSaving = () => false;
export function useAdminSaving(): boolean {
  return useSyncExternalStore(backendEnabled ? subscribe : noop, backendEnabled ? isSaving : notSaving, notSaving);
}

// Live mode: the last loading error, if any (shown instead of the panel).
const liveError = () => (backendEnabled && live.status === "error" ? (live.error ?? "Couldn't load the data.") : null);
export function useAdminError() {
  return useSyncExternalStore(subscribe, liveError, () => null);
}
