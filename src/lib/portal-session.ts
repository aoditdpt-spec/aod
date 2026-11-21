"use client";

import { useSyncExternalStore } from "react";

// Who is signed in to the artist portal in test mode (localStorage `aod-portal-email`): an
// applicant's email shows their application's progress; anyone else sees the sample artist.

const KEY = "aod-portal-email";
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};

export function setPortalEmail(email: string) {
  try {
    if (email) localStorage.setItem(KEY, email.trim().toLowerCase());
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}

export function usePortalEmail() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => null,
  );
}
