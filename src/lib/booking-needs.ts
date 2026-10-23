// How many artists of each category a booking needs, and which categories an artist works in.
// No imports, so the server, the browser and scripts/order-check.mts can all use it.
//
// A request is one order (one booking, AOD-MIX-102602: src/lib/order-id.ts) however many kinds of
// artist it needs: one line (`BookingItem`) per category, each saying how many artists
// ("Photographers × 3") and holding the artists the team assigns to it. An artist has a main category and may also work in others.

// The most artists of one category a customer can ask for in one request.
export const MAX_ARTISTS = 20;

// The quick choices in the "How many?" picker; "More" opens a box for 5 up to MAX_ARTISTS.
export const quickCounts = [1, 2, 3, 4];

// A whole number from 1 to MAX_ARTISTS (anything else becomes 1, or MAX_ARTISTS if too big).
export function clampCount(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(v, MAX_ARTISTS);
}

// "Photographers × 3"; a single artist shows the label alone.
export const withCount = (label: string, n = 1) => (n > 1 ? `${label} × ${n}` : label);

// "Photographers × 3, Musicians & DJs × 1": how the booking form's WhatsApp message, the emails and
// the sheet write a request (always with the number, so "× 1" says the customer asked for one).
export const needsText = (needs: { name: string; count: number }[]) => needs.map((n) => `${n.name} × ${n.count}`).join(", ");

// One line of an order: a category, its service, how many artists of it, and the artists assigned
// so far. A request for photographers, a model and an anchor is one order with three lines.
export type BookingItem = { category: string; service: string; count: number; artistIds: string[] };

// Every artist assigned to an order, across its lines.
export const assignedArtists = (items: BookingItem[]) => [...new Set(items.flatMap((i) => i.artistIds))];

// How many artists the order needs in all.
export const totalNeeded = (items: BookingItem[]) => items.reduce((n, i) => n + i.count, 0);

// "Wedding photography × 2, Corporate emcee": what an order is for.
export const itemsLabel = (items: { service: string; count: number }[]) => items.map((i) => withCount(i.service, i.count)).join(", ");

type Categorised = { category: string; otherCategories?: string[] };

// The line of an order an artist is assigned to, or else the first one they could take.
export const itemFor = (items: BookingItem[], artistId: string, artist?: Categorised) =>
  items.find((i) => i.artistIds.includes(artistId)) ?? (artist ? items.find((i) => worksIn(artist, i.category)) : undefined);

// Main category first, then the others it also works in.
export const allCategories = (a: Categorised) => [a.category, ...(a.otherCategories ?? []).filter((c) => c && c !== a.category)].filter(Boolean);

export const worksIn = (a: Categorised, slug: string) => a.category === slug || (a.otherCategories ?? []).includes(slug);
