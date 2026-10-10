"use client";

import { useSyncExternalStore } from "react";
import { sampleArtist } from "@/content/artist-portal";
import { backendEnabled } from "@/lib/backend";
import { listenLive } from "@/lib/live";
import {
  loadArtistPortal,
  replyToBooking,
  saveArtistProfile,
  saveAvailability,
  type ArtistPortal,
  type ProfilePatch,
  type Result,
} from "@/server/actions/artist";
import { signOutAction } from "@/server/actions/auth";
import { blockedDatesStore, bookingActionsStore, emptyProfile, modeStore, profileStore, type ArtistProfile, type PreviewMode } from "./artist-store";

// The artist portal's data. Two modes, like the admin (src/lib/admin-store.ts):
//   - live (Supabase keys set): the signed-in artist's (or applicant's) own records, loaded through
//     src/server/actions/artist.ts and reloaded whenever their live channel says something changed
//     (the team shortlists them, confirms a booking, approves their application…). Changes show on
//     screen straight away, are saved, then reloaded from the server.
//   - preview (no keys): the sample artist and the browser-kept stores in ./artist-store.ts.
// The hooks at the bottom give every portal page the same interface in both modes.

type State = {
  status: "idle" | "loading" | "ready" | "signed-out" | "no-account" | "error";
  data: ArtistPortal | null;
  email?: string;
  error?: string;
};

let state: State = { status: "idle", data: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

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

// ---------------------------------------------------------------------------
// One interface for the pages, live or preview.
// ---------------------------------------------------------------------------

const sampleProfile: ArtistProfile = { ...sampleArtist, agreeTerms: true };

// The artist's profile. `sample` is true while the preview shows the made-up artist.
export function useArtistProfile(): { profile: ArtistProfile; sample: boolean } {
  const live = usePortalState();
  const local = profileStore.use();
  if (backendEnabled) return { profile: live.data?.profile ?? emptyProfile, sample: false };
  return { profile: local ?? sampleProfile, sample: local === null };
}

// Live: only the fields an artist may change are saved (the server ignores the rest).
export async function saveProfile(patch: Partial<ArtistProfile>): Promise<string | null> {
  if (!backendEnabled) {
    profileStore.set({ ...(profileStore.get() ?? sampleProfile), ...patch });
    return null;
  }
  const allowed: ProfilePatch = patch;
  return portalAction((d) => ({ ...d, profile: { ...d.profile, ...allowed } }), () => saveArtistProfile(allowed));
}

// Live artist or applicant (live: from their records; preview: the "Preview as" switch).
export function usePortalMode(): PreviewMode {
  const live = usePortalState();
  const local = modeStore.use();
  if (backendEnabled) return live.data?.kind === "artist" ? "live" : "applicant";
  return local;
}

export function useBlockedDates(): string[] {
  const live = usePortalState();
  const local = blockedDatesStore.use();
  return backendEnabled ? (live.data?.blockedDates ?? []) : local;
}

export async function setBlockedDates(dates: string[]): Promise<string | null> {
  if (!backendEnabled) {
    blockedDatesStore.set(dates);
    return null;
  }
  return portalAction((d) => ({ ...d, blockedDates: [...dates].sort() }), () => saveAvailability(dates));
}

// Quote for, or decline, a booking request.
export async function answerRequest(id: string, status: "quoted" | "declined", quote?: string): Promise<string | null> {
  if (!backendEnabled) {
    bookingActionsStore.set({ ...bookingActionsStore.get(), [id]: { status, quote } });
    return null;
  }
  return portalAction(
    (d) => ({ ...d, bookings: d.bookings.map((b) => (b.id === id ? { ...b, status, quote } : b)) }),
    () => replyToBooking(id, status, quote ? Number(quote) : undefined),
  );
}
