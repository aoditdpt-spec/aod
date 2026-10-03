"use client";

import { useSyncExternalStore } from "react";
import { cities } from "@/content/site";

// The visitor's chosen city, shared by the navbar picker and the booking questions.
// Kept in the browser (localStorage) so it survives page changes and later visits.
// When Supabase is added, save it with the booking request as well.

const KEY = "aod-city";
const listeners = new Set<() => void>();
let memory: string | null = null; // fallback when localStorage is unavailable (private mode etc.)

function isCity(value: string | null): value is string {
  return value !== null && (cities as string[]).includes(value);
}

function read(): string | null {
  try {
    const stored = localStorage.getItem(KEY);
    if (isCity(stored)) return stored;
  } catch {}
  return memory;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep other open tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function setCity(city: string) {
  if (!isCity(city)) return;
  memory = city;
  try {
    localStorage.setItem(KEY, city);
  } catch {}
  listeners.forEach((l) => l());
}

// null until the visitor picks a city (and during server rendering).
export function useCity(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
