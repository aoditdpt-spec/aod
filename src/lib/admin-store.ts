"use client";

import { useSyncExternalStore } from "react";
import type { Role } from "@/content/admin";
import { createSampleDb } from "@/content/admin-sample";
import { backendEnabled } from "@/lib/backend";
import { listenLive, type LiveStatus } from "@/lib/live";
import { adminSession, loadAdminDb, saveAdminChanges, type AdminChanges, type Collection } from "@/server/actions/admin";
import { signOutAction } from "@/server/actions/auth";

// The admin panel's data: one `Db` object the screens read with `useDb()` and change with `update()`,
// which also writes the activity log. Two modes, picked by `backendEnabled` (src/lib/backend.ts):
//   - live (Supabase keys set): the data is loaded from the database for the signed-in staff
//     member, and each `update()` saves just the records it changed (server actions in
//     src/server/actions/admin.ts, checked against the person's role). If a save is refused,
//     the data is reloaded and the reason shown. While signed in it listens on the "staff" live
//     channel (src/lib/live.ts) and reloads whenever anyone (another staff member, a website form,
//     an artist in the portal) changes something.
//   - preview (no keys): sample records (src/content/admin-sample.ts) kept in this browser.

export type Note = { at: string; by: string; text: string };

export type ApplicationStatus = "submitted" | "review" | "meeting" | "trial" | "approved" | "rejected";
export type Application = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  category: string;
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
};

// A photo or video in the `portfolio` storage bucket (live mode).
export type PortfolioFile = { path: string; name: string; type: string; size: number; at: string };

export type Artist = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  category: string;
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
};

// An artist's answer to a booking request they were shortlisted for (sent from the artist portal).
export type ArtistReply = { artistId: string; status: "quoted" | "declined"; quote?: number; note: string; at: string };

export type BookingStatus =
  | "new"
  | "matched"
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
  requestRef?: string; // AOD-1048: the website request it came from (one request can need several categories)
  createdAt: string;
  audience: "Personal" | "Business";
  customer: { name: string; phone: string; email: string };
  category: string;
  service: string;
  event: string;
  date: string; // yyyy-mm-dd
  time: string; // start, HH:MM
  endTime?: string; // end, HH:MM (earlier than the start = ends after midnight)
  city: string;
  venue: string;
  budget: string;
  notes: string;
  status: BookingStatus;
  artistId?: string;
  shortlist: string[]; // artist ids offered to the customer
  quote?: number;
  advance?: number;
  delivery?: { link: string; expires: string };
  review?: { rating: number; text: string };
  history: { at: string; by: string; status: BookingStatus }[];
  notesLog: Note[];
  replies?: ArtistReply[]; // read-only here: written by artists through the portal
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
  id: string; // RC-1001
  createdAt: string;
  role: "customer" | "business" | "artist";
  name: string;
  email: string;
  phone: string;
  bookingRef: string;
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
  team: Member[];
  activity: Activity[];
  settings: Settings;
};

export type Session = { name: string; email: string; role: Role };

// ---------------------------------------------------------------------------

const DB_KEY = "aod-admin-db-v1";
const SESSION_KEY = "aod-admin-session";

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: Listener) {
  listeners.add(l);
  if (backendEnabled && live.status === "idle") void loadLive();
  const onStorage = (e: StorageEvent) => {
    if (e.key === DB_KEY || e.key === SESSION_KEY) {
      cache.clear();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

// Keeps the parsed object stable between reads (useSyncExternalStore needs that).
const memory = new Map<string, string>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) return v;
  } catch {}
  return memory.get(key) ?? null;
}

function store(key: string, value: string | null) {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  cache.delete(key);
}

function writeRaw(key: string, value: string | null) {
  store(key, value);
  emit();
}

function readJson<T>(key: string): T | null {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T | null;
  let value: T | null = null;
  try {
    value = raw ? (JSON.parse(raw) as T) : null;
  } catch {}
  cache.set(key, { raw, value });
  return value;
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
  if (!saving && reloadAfterSave) {
    reloadAfterSave = false;
    void loadLive(true);
  }
}

const collections: Collection[] = ["applications", "artists", "bookings", "payments", "payouts", "leads", "cases", "team"];

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

// ---- Database ----

function getPreviewDb(): Db {
  const db = readJson<Db>(DB_KEY);
  if (db && db.version === 1) {
    if (Array.isArray(db.cases)) return db;
    // Saved before Resolution Centre cases existed: add the sample cases, keep everything else.
    store(DB_KEY, JSON.stringify({ ...db, cases: createSampleDb(new Date()).cases }));
    return readJson<Db>(DB_KEY)!;
  }
  // First visit (or an old format): seed sample data. Stored without notifying, because this
  // runs while React reads the snapshot.
  store(DB_KEY, JSON.stringify(createSampleDb(new Date())));
  return readJson<Db>(DB_KEY)!;
}

// The data the screens work on (live: only called once it has loaded).
function getDb(): Db {
  return backendEnabled ? live.db! : getPreviewDb();
}

const getLiveDb = () => live.db;

// null during server rendering and until the data is ready.
export function useDb(): Db | null {
  return useSyncExternalStore(subscribe, backendEnabled ? getLiveDb : getPreviewDb, () => null);
}

// Next number in a series: B-1215 after B-1214, PAY-3102 after PAY-3101.
export function newId(prefix: string): string {
  const db = getDb();
  const ids = [db.applications, db.artists, db.bookings, db.payments, db.payouts, db.leads, db.cases, db.team].flat().map((x) => x.id);
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

  if (!backendEnabled) {
    writeRaw(DB_KEY, JSON.stringify(db));
    return;
  }
  // Live: show the change straight away, save it, and reload if the save is refused.
  const changes = { ...diff(before, db), activity: [entry] };
  setLive({ db });
  saving++;
  saveAdminChanges(changes)
    .then((res) => {
      if (!res.ok) {
        window.alert(res.error);
        reloadAfterSave = true;
      }
    })
    .catch(() => {
      window.alert("Couldn't save the change. Check your connection; the page has been refreshed.");
      reloadAfterSave = true;
    })
    .finally(saveFinished);
}

// Start over with fresh sample data (preview only).
export function resetDb() {
  if (backendEnabled) return;
  writeRaw(DB_KEY, JSON.stringify(createSampleDb(new Date())));
}

// The signed-in person's name, for notes and history entries.
export const currentUser = () => getSession()?.name ?? "Someone";

// ---- Session ----

export function getSession(): Session | null {
  return backendEnabled ? live.session : readJson<Session>(SESSION_KEY);
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

// Preview only: sign in as anyone, with any role.
export function signIn(session: Session) {
  if (backendEnabled) return;
  writeRaw(SESSION_KEY, JSON.stringify(session));
}

export function signOut() {
  if (!backendEnabled) return writeRaw(SESSION_KEY, null);
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

// Live mode: the last loading error, if any (shown instead of the panel).
const liveError = () => (backendEnabled && live.status === "error" ? (live.error ?? "Couldn't load the data.") : null);
export function useAdminError() {
  return useSyncExternalStore(subscribe, liveError, () => null);
}
