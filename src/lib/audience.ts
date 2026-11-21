import { useSyncExternalStore } from "react";

// What the visitor books for, asked once by the first-visit popup (AudiencePrompt.tsx):
// personal events or business events. It changes the booking flow. Kept in this browser's
// localStorage, so it stays until the visitor clears their browsing data; every open tab follows
// a change (the "storage" event). Frontend only for now.

// "artist": skipped the question to join as an artist (the popup's "Skip And Join As Artist").
export type Audience = "personal" | "business" | "artist";

const KEY = "aod-audience";
const listeners = new Set<() => void>();
let memory: Audience | null = null; // used when the browser blocks storage (private modes)

function read(): Audience | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "personal" || v === "business" || v === "artist" ? v : memory;
  } catch {
    return memory;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setAudience(a: Audience | null) {
  memory = a;
  // "Change" on the booking page (null) asks again, even after the popup was closed with ✕.
  if (a === null) setDismissed(false);
  try {
    if (a) localStorage.setItem(KEY, a);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: kept for this visit only.
  }
  listeners.forEach((l) => l());
}

// The choice, null until made, or "unknown" on the server and while the page hydrates (so the
// popup never flashes before the browser has been checked).
export function useAudience(): Audience | null | "unknown" {
  return useSyncExternalStore(subscribe, read, () => "unknown");
}

// The popup's ✕: closed without an answer. It stays closed for this visit (sessionStorage, so a
// new tab or a later visit asks again); the booking form then books as personal events.
const DISMISS_KEY = "aod-audience-dismissed";
let dismissedMemory = false;

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1" || dismissedMemory;
  } catch {
    return dismissedMemory;
  }
}

function setDismissed(on: boolean) {
  dismissedMemory = on;
  try {
    if (on) sessionStorage.setItem(DISMISS_KEY, "1");
    else sessionStorage.removeItem(DISMISS_KEY);
  } catch {
    // Storage blocked: kept for this page only.
  }
}

export function dismissAudiencePrompt() {
  setDismissed(true);
  listeners.forEach((l) => l());
}

export function useAudiencePromptDismissed(): boolean {
  return useSyncExternalStore(subscribe, readDismissed, () => false);
}
