"use client";

import { useSyncExternalStore } from "react";
import type { Role } from "@/content/admin";
import { createSampleDb } from "@/content/admin-sample";

// The admin panel's data for the preview: one object kept in this browser (localStorage) and
// seeded with sample records (src/content/admin-sample.ts) on first use. Every change goes through `update()`, which also
// writes the activity log. When Supabase is added, these actions become database calls and the
// activity log moves to a table; the screens stay the same.

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
};

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
};

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
  createdAt: string;
  audience: "Personal" | "Business";
  customer: { name: string; phone: string; email: string };
  category: string;
  service: string;
  event: string;
  date: string; // yyyy-mm-dd
  time: string;
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

// ---- Database ----

function getDb(): Db {
  const db = readJson<Db>(DB_KEY);
  if (db && db.version === 1) return db;
  // First visit (or an old format): seed sample data. Stored without notifying, because this
  // runs while React reads the snapshot.
  store(DB_KEY, JSON.stringify(createSampleDb(new Date())));
  return readJson<Db>(DB_KEY)!;
}

// null during server rendering and until the browser data is ready.
export function useDb(): Db | null {
  return useSyncExternalStore(subscribe, getDb, () => null);
}

// Next number in a series: B-1215 after B-1214, PAY-3102 after PAY-3101.
export function newId(prefix: string): string {
  const db = getDb();
  const ids = [db.applications, db.artists, db.bookings, db.payments, db.payouts, db.leads, db.team].flat().map((x) => x.id);
  const nums = ids.filter((id) => id.startsWith(`${prefix}-`)).map((id) => Number(id.slice(prefix.length + 1))).filter(Number.isFinite);
  return `${prefix}-${(nums.length ? Math.max(...nums) : 100) + 1}`;
}

// Apply a change and log it. `fn` gets a copy of the data to change in place.
export function update(area: string, text: string, fn: (db: Db) => void, target?: string) {
  const db: Db = structuredClone(getDb());
  fn(db);
  const by = getSession()?.name ?? "Someone";
  db.activity.unshift({ id: `ACT-${Date.now()}-${db.activity.length}`, at: new Date().toISOString(), by, area, text, target });
  db.activity = db.activity.slice(0, 500);
  writeRaw(DB_KEY, JSON.stringify(db));
}

// Start over with fresh sample data.
export function resetDb() {
  writeRaw(DB_KEY, JSON.stringify(createSampleDb(new Date())));
}

// The signed-in person's name, for notes and history entries.
export const currentUser = () => getSession()?.name ?? "Someone";

// ---- Session (preview sign-in) ----

export function getSession(): Session | null {
  return readJson<Session>(SESSION_KEY);
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null);
}

export function signIn(session: Session) {
  writeRaw(SESSION_KEY, JSON.stringify(session));
}

export function signOut() {
  writeRaw(SESSION_KEY, null);
}

// Server snapshot is "not ready", so pages can wait for the browser before deciding to redirect.
const noop = () => () => {};
export function useBrowserReady() {
  return useSyncExternalStore(noop, () => true, () => false);
}
