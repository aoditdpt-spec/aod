"use client";

import { useSyncExternalStore } from "react";
import { backendEnabled } from "@/lib/backend";
import { signOutAction } from "@/server/actions/auth";
import { myCompany, registerCompany, updateMyCompany } from "@/server/actions/business";

// AOD For Business. Live (Supabase keys set): the company is the row in `companies` for the
// signed-in email (src/server/actions/business.ts), loaded once and after each change. Test mode:
// AOD For Business in test mode: the signed-in company, and every company account made in this
// browser (so signing in again finds it). Kept in localStorage until the browsing data is cleared.
// As on aod.co.in, a company signs up or signs in with its email and an emailed 6-digit code; here
// no email is sent and any code (or none) works.

export const companyTypes = ["Brand Owner", "Event Planner", "Agency", "Other"] as const;

export type Company = { name: string; type: string; typeOther: string; contactName: string; email: string; phone: string; city: string; website: string };
export const blankCompany: Company = { name: "", type: "", typeOther: "", contactName: "", email: "", phone: "", city: "", website: "" };

const SESSION = "aod-business-company";
const ACCOUNTS = "aod-business-accounts";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Company | null } = { raw: null, value: null };

function read(): Company | null {
  try {
    const raw = localStorage.getItem(SESSION);
    if (raw !== cache.raw) cache = { raw, value: raw ? { ...blankCompany, ...(JSON.parse(raw) as Partial<Company>) } : null };
    return cache.value;
  } catch {
    return null;
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => (e.key === SESSION || e.key === null) && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const notify = () => listeners.forEach((l) => l());

function accounts(): Company[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS) ?? "[]") as Company[];
  } catch {
    return [];
  }
}

function save(c: Company | null) {
  try {
    if (c) {
      localStorage.setItem(SESSION, JSON.stringify(c));
      const others = accounts().filter((a) => a.email.toLowerCase() !== c.email.toLowerCase());
      localStorage.setItem(ACCOUNTS, JSON.stringify([...others, c]));
    } else localStorage.removeItem(SESSION);
  } catch {
    // Storage blocked: nothing is kept.
  }
  notify();
}

// ---- Live ----
// The database keeps the account type in its own wording ("Brand owner"); the page shows "Brand Owner".
const toPage = (t: string) => companyTypes.find((x) => x.toLowerCase() === t.toLowerCase()) ?? "";
const toDb = (t: string) => (t ? t.charAt(0) + t.slice(1).toLowerCase() : "");
let live: Company | null | "unknown" = "unknown";
let loading = false;
async function loadLive() {
  if (loading) return;
  loading = true;
  try {
    const c = await myCompany();
    live = c ? { name: c.name, type: toPage(c.type), typeOther: c.typeOther, contactName: c.contactName, email: c.email, phone: c.phone, city: c.city, website: c.website } : null;
  } catch {
    live = null;
  } finally {
    loading = false;
    notify();
  }
}
function subscribeLive(l: () => void) {
  listeners.add(l);
  if (live === "unknown") void loadLive();
  return () => {
    listeners.delete(l);
  };
}
const readLive = () => live;

// The signed-in company; null when signed out; "unknown" on the server and while hydrating (or loading).
export function useCompany(): Company | null | "unknown" {
  return useSyncExternalStore<Company | null | "unknown">(backendEnabled ? subscribeLive : subscribe, backendEnabled ? readLive : read, () => "unknown");
}

// Live changes. Each returns an error message, or null.
export const businessLive = {
  // After the emailed code: sign up (the signed-in email must be the company's) or just reload.
  async create(c: Company): Promise<string | null> {
    const res = await registerCompany({ name: c.name, type: toDb(c.type), typeOther: c.typeOther, contactName: c.contactName, email: c.email, phone: c.phone, city: c.city, website: c.website }).catch(() => ({ ok: false as const, error: "Couldn't create the account just now. Please try again." }));
    if (!res.ok) return res.error;
    await loadLive();
    return null;
  },
  async reload() {
    await loadLive();
  },
  async update(c: Company): Promise<string | null> {
    const res = await updateMyCompany({ name: c.name, type: toDb(c.type), typeOther: c.typeOther, contactName: c.contactName, phone: c.phone, city: c.city, website: c.website }).catch(() => ({ ok: false as const, error: "Couldn't save just now. Please try again." }));
    if (!res.ok) return res.error;
    await loadLive();
    return null;
  },
  async signOut() {
    await signOutAction().catch(() => {});
    live = null;
    notify();
  },
};

export const business = {
  // Create an account (sign up) and sign in with it.
  create: (c: Company) => save(c),
  // Sign in: the account made with this email in this browser, or a new one with just the email
  // (test mode lets anyone through).
  signIn(email: string) {
    const e = email.trim().toLowerCase();
    const found = accounts().find((a) => a.email.toLowerCase() === e);
    save(found ?? { ...blankCompany, email: e });
  },
  update: (c: Company) => save(c),
  signOut: () => save(null),
};
