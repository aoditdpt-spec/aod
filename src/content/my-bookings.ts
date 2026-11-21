// My Bookings (and AOD For Business orders) as the server returns them (src/server/actions/customer.ts):
// the customer's own orders, and how long they may cancel one themselves.

import type { BookingStatus } from "@/lib/admin-store";

// Customers can cancel a booking themselves in My bookings for this long after making it (the
// server checks it again). After that they ask AOD, and the refund policy applies.
export const customerCancelHours = 2;
const notCancellable = ["cancelled", "completed", "delivered", "reviewed"];
// When the customer's own cancelling closes for an order made at `createdAt`.
export const cancelDeadline = (createdAt: string) => new Date(new Date(createdAt).getTime() + customerCancelHours * 3600_000);
export const canCancel = (o: { createdAt: string; status: string; sample?: boolean }, now = new Date()) =>
  !o.sample && !notCancellable.includes(o.status) && now < cancelDeadline(o.createdAt);

// An artist the customer may look at: assigned to the order, or on AOD's shortlist for it. Never
// contact details, links or prices.
export type ArtistProfileView = {
  id: string;
  experience: string;
  languages: string[];
  services: string[];
  bio: string;
  photo: string; // a picture address, or "" (initials are shown)
  works: { url: string; video: boolean }[]; // a few portfolio files
};
export type MatchedArtist = { name: string; craft: string; city: string; profile?: ArtistProfileView };

export type CustomerOrder = {
  id: string;
  ref?: string; // AOD-1215: the request reference the customer got when sending it
  sample: boolean;
  createdAt: string;
  status: BookingStatus | "sent";
  occasion: string;
  services: string[];
  // "Book again": who it was for and the artists it needed, to fill in a new request with.
  audience?: "personal" | "business";
  again?: { slug: string; count: number }[];
  date: string; // yyyy-mm-dd, or "" if not fixed
  time?: string; // start, HH:MM
  endTime?: string; // end, HH:MM
  city: string;
  venue?: string;
  notes?: string;
  artists: MatchedArtist[]; // the artists matched so far
  shortlisted?: MatchedArtist[]; // AOD's shortlist, before one is chosen (the customer can open their profiles)
  needed?: number; // how many artists the booking needs, when more than one
  quote?: number;
  advance?: number;
  payments: { amount: number; utr: string; at: string; status: "pending" | "verified" }[];
  balance?: { amount: number; dueBy: string };
  delivery?: { link: string; expires: string };
  review?: { rating: number; text: string };
  history: { status: BookingStatus; at: string }[];
  lines?: { category: string; name: string; count: number }[]; // what the order needs, one line per kind of artist
  cancelledByYou?: string; // when the customer cancelled it themselves
};
