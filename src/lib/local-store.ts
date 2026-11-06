"use client";

import { useSyncExternalStore } from "react";

// A small value kept in this browser (localStorage) that React components can read and that
// updates every component using it (and other open tabs) when it changes. Used by the preview
// stores (artist portal, customer bookings) until Supabase holds the real data.
export function createStore<T>(key: string, fallback: T, parse: (value: unknown) => T) {
  const listeners = new Set<() => void>();
  let memory: string | null = null; // used when localStorage is unavailable (private mode etc.)
  let cachedRaw: string | null | undefined;
  let cached = fallback;

  // Returns the same object until the stored text changes, as useSyncExternalStore requires.
  function read(): T {
    let raw = memory;
    try {
      raw = localStorage.getItem(key) ?? memory;
    } catch {}
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cached = raw === null ? fallback : parse(JSON.parse(raw));
      } catch {
        cached = fallback;
      }
    }
    return cached;
  }

  function subscribe(onChange: () => void) {
    listeners.add(onChange);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  function set(value: T) {
    memory = JSON.stringify(value);
    try {
      localStorage.setItem(key, memory);
    } catch {}
    listeners.forEach((l) => l());
  }

  function clear() {
    memory = null;
    try {
      localStorage.removeItem(key);
    } catch {}
    listeners.forEach((l) => l());
  }

  // The fallback during server rendering and hydration, the stored value afterwards.
  function use(): T {
    return useSyncExternalStore(subscribe, read, () => fallback);
  }

  return { use, set, clear, get: read };
}
