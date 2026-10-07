"use client";

import { createStore } from "./local-store";

// Customer "My bookings" data for the preview, kept only in this browser. When Supabase is added,
// sign-in becomes a real emailed code and requests come from the bookings table.

export type CustomerSession = { email: string };

export const customerSessionStore = createStore<CustomerSession | null>("aod-customer-session", null, (v) =>
  v && typeof v === "object" && typeof (v as CustomerSession).email === "string" ? (v as CustomerSession) : null,
);

// Requests this browser sent from the booking form ("Send on WhatsApp").
export type SentRequest = {
  id: string;
  sentAt: string;
  audience?: string;
  occasion: string;
  needs: string[];
  date: string;
  city: string;
  details: string;
};

export const sentRequestsStore = createStore<SentRequest[]>("aod-sent-requests", [], (v) =>
  Array.isArray(v) ? (v.filter((x) => x && typeof x === "object" && typeof x.id === "string") as SentRequest[]) : [],
);

export function addSentRequest(r: SentRequest) {
  sentRequestsStore.set([r, ...sentRequestsStore.get().filter((x) => x.id !== r.id)].slice(0, 20));
}

// Short reference for a request sent from this browser, e.g. R-K3F9Q.
export const newRequestRef = () => `R-${Date.now().toString(36).slice(-5).toUpperCase()}`;
