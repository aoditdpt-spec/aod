"use client";

import { createStore } from "./local-store";

// Artist portal data for the preview, kept only in this browser (localStorage), the same way
// src/lib/city.ts keeps the visitor's city. Nothing here reaches AOD. When Supabase is added,
// these stores are replaced by the artist's real profile, bookings and availability.

// "Your work details" in the application: answers by question id (`workQuestions` in
// src/content/artist-portal.ts), a string for one choice or typed text, a list for several choices.
export type WorkDetails = Record<string, string | string[]>;

export type ArtistProfile = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  category: string; // main category slug from site.ts
  otherCategories: string[]; // other categories they also work in (optional)
  services: string[]; // from any of their categories
  experience: string;
  languages: string[];
  bio: string;
  links: string[];
  photo: string; // their profile photo: "<Drive file id>~<version>" (live), or a "data:image/…" picture still in the browser; "" for none
  work?: WorkDetails; // the application only; absent elsewhere
  agreeTerms: boolean;
};

export const emptyProfile: ArtistProfile = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  category: "",
  otherCategories: [],
  services: [],
  experience: "",
  languages: [],
  bio: "",
  links: [],
  photo: "",
  work: {},
  agreeTerms: false,
};

const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

// The artist's profile: filled in by the application form, edited on the Profile page.
// null until something is saved, so pages can show the sample profile instead.
export const profileStore = createStore<ArtistProfile | null>("aod-artist-profile", null, (v) =>
  v && typeof v === "object"
    ? {
        ...emptyProfile,
        ...(v as Partial<ArtistProfile>),
        otherCategories: strings((v as Partial<ArtistProfile>).otherCategories),
        work: { ...((v as Partial<ArtistProfile>).work ?? {}) },
      }
    : null,
);

// Which side of the preview to show: a new applicant going through onboarding, or a live artist.
export type PreviewMode = "live" | "applicant";
export const modeStore = createStore<PreviewMode>("aod-artist-preview-mode", "live", (v) =>
  v === "applicant" ? "applicant" : "live",
);

// Dates the artist can't take bookings, as yyyy-mm-dd.
export const blockedDatesStore = createStore<string[]>("aod-artist-blocked-dates", [], strings);

// What the artist has done with each sample booking request (quote sent, declined…),
// so the change shows on every portal page.
export type BookingAction = { status: "quoted" | "declined"; quote?: string };
export const bookingActionsStore = createStore<Record<string, BookingAction>>("aod-artist-booking-actions", {}, (v) =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, BookingAction>) : {},
);
