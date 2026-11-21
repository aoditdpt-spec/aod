"use client";

import { useSyncExternalStore } from "react";
import { backendEnabled } from "@/lib/backend";
import { listenLive } from "@/lib/live";
import {
  loadArtistPortal,
  replyToBooking,
  saveArtistProfile,
  saveAvailability,
  saveMyPhoto,
  sendToAod,
  type ArtistPortal,
  type ProfilePatch,
  type Result,
} from "@/server/actions/artist";
import { signOutAction } from "@/server/actions/auth";
import type { ArtistProfile } from "./artist-store";

// The artist portal's live data (only used with the Supabase keys set; the preview's portal runs on
// src/lib/mock-db.ts): the signed-in artist's (or applicant's) own records, loaded through
// src/server/actions/artist.ts and reloaded whenever their live channel says something changed (the
// team shortlists them, confirms a booking, approves their application…). Changes show on screen
// straight away, are saved, then reloaded from the server. src/lib/app-db.tsx maps it for the screens.

type State = {
  status: "idle" | "loading" | "ready" | "signed-out" | "no-account" | "error";
  data: ArtistPortal | null;
  email?: string;
  error?: string;
};

export type PortalData = ArtistPortal;

let state: State = { status: "idle", data: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

// The days off as last loaded (for toggling one).
export const currentBlockedDates = () => state.data?.blockedDates ?? [];

let stopLive: (() => void) | null = null;
let listeningTo = "";
let saving = 0; // while saving, live messages wait: every save ends with a reload anyway

function listen(topics: string[]) {
  const key = topics.join("|");
  if (stopLive && listeningTo === key) return;
  stopListening();
  listeningTo = key;
  stopLive = listenLive(topics, () => {
    if (!saving) void load(true);
  });
}
function stopListening() {
  stopLive?.();
  stopLive = null;
  listeningTo = "";
}

async function load(quiet = false) {
  if (!quiet) set({ status: "loading" });
  try {
    const res = await loadArtistPortal();
    if (res.state === "ready") {
      set({ status: "ready", data: res.data, email: res.data.email, error: undefined });
      listen(res.data.topics);
    } else {
      stopListening();
      set({ status: res.state, data: null, email: res.state === "no-account" ? res.email : undefined });
    }
  } catch {
    set({ status: "error", error: "Couldn't load your portal just now. Please refresh the page." });
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (backendEnabled && state.status === "idle") void load();
  return () => {
    listeners.delete(l);
  };
}
const serverState: State = { status: "idle", data: null };

export function usePortalState(): State {
  return useSyncExternalStore(subscribe, () => state, () => serverState);
}

// After signing in with the emailed code.
export const reloadPortal = () => load();
// Fetch again without the loading screen (after an upload).
export const refreshPortal = () => load(true);

export async function portalSignOut() {
  stopListening();
  set({ status: "signed-out", data: null });
  await signOutAction();
}

// Show a change at once, save it, then reload from the server. Returns an error message, or null.
async function portalAction(optimistic: (d: ArtistPortal) => ArtistPortal, run: () => Promise<Result>): Promise<string | null> {
  if (state.data) set({ data: optimistic(state.data) });
  saving++;
  try {
    const res = await run();
    return res.ok ? null : res.error;
  } catch {
    return "Couldn't save just now. Check your connection and try again.";
  } finally {
    saving--;
    if (!saving) void load(true);
  }
}

// Profile and Complete Your Details: only the fields an artist may change are saved (the server checks).
export async function saveProfile(patch: Partial<ArtistProfile> & Omit<ProfilePatch, keyof ArtistProfile>): Promise<string | null> {
  const allowed = patch as ProfilePatch;
  return portalAction((d) => ({ ...d, profile: { ...d.profile, ...allowed } }), () => saveArtistProfile(allowed));
}

// A new profile photo (a "data:image/…" picture shrunk in the browser): saved to AOD's Google Drive.
export async function changePhoto(dataUrl: string): Promise<string | null> {
  return portalAction((d) => d, () => saveMyPhoto(dataUrl));
}

// Submit For Review / Send Update: sent to the AOD team, then the portal reloads (with the new sent date).
export async function sendProfileToAod(): Promise<string | null> {
  saving++;
  try {
    const res = await sendToAod();
    return res.ok ? null : res.error;
  } catch {
    return "Couldn't send it just now. Check your connection and try again.";
  } finally {
    saving--;
    if (!saving) void load(true);
  }
}

export async function setBlockedDates(dates: string[]): Promise<string | null> {
  return portalAction((d) => ({ ...d, blockedDates: [...dates].sort() }), () => saveAvailability(dates));
}

// Accept (I'm available that day) or decline a booking request.
export async function answerRequest(id: string, status: "accepted" | "declined"): Promise<string | null> {
  return portalAction(
    (d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }),
    () => replyToBooking(id, status),
  );
}
