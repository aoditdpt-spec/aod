import { assignedArtists, itemFor, totalNeeded, worksIn, type BookingItem } from "./booking-needs";

// Which orders an artist sees, and the status they see each one with. One rule for the artist
// portal (src/server/actions/artist.ts) and the admin's artist drawer, so the team always sees
// exactly what the artist sees.
//   assigned to their line:    "selected" (chosen, waiting for the advance), "confirmed" (paid;
//                              a rescheduled booking only once paid again), "completed", "cancelled"
//   shortlisted by AOD, line still open: "shortlisted"
//   a new order with a line in one of their categories, that line still open, on a day they
//   haven't marked as a day off: "new" (no answer yet), "accepted" (they said they're available) or
//   "declined"; AOD then shortlists from the artists who accepted
//   anything else (went to other artists, cancelled before they were picked): not shown.
export type ArtistOrderStatus = "new" | "accepted" | "shortlisted" | "quoted" | "declined" | "selected" | "confirmed" | "completed" | "cancelled";
export type ArtistAnswer = "accepted" | "quoted" | "declined";

export const artistOrderLabels: Record<ArtistOrderStatus, string> = {
  new: "New request",
  accepted: "Accepted · waiting for AOD",
  shortlisted: "You're shortlisted",
  quoted: "Quote sent · waiting for customer", // answers sent before Accept replaced quoting
  selected: "You're chosen · waiting for the advance",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

type Categorised = { id: string; category: string; otherCategories?: string[]; blockedDates?: string[]; status?: string };

// Whether a shortlisted artist's part of an order still needs someone: their line isn't full (or,
// with no line in their categories, the order as a whole isn't).
export const stillOpen = (items: BookingItem[], item?: BookingItem) =>
  item ? item.artistIds.length < item.count : assignedArtists(items).length < totalNeeded(items);

const finished = ["completed", "delivered", "reviewed", "cancelled"];

// The artist's part of the order (the line they're on, or else one in their categories) and the
// status they see, or null when the order isn't shown to them. `reply` is their portal answer;
// `paid` whether a payment on the order has been verified.
export function artistOrder(
  b: { status: string; date?: string; items: BookingItem[]; shortlist: string[] },
  artist: Categorised,
  reply: ArtistAnswer | undefined,
  paid: boolean,
): { status: ArtistOrderStatus; item?: BookingItem } | null {
  const item = itemFor(b.items, artist.id, artist);
  if (item?.artistIds.includes(artist.id)) {
    if (b.status === "confirmed" || (b.status === "rescheduled" && paid)) return { status: "confirmed", item };
    if (["completed", "delivered", "reviewed"].includes(b.status)) return { status: "completed", item };
    if (b.status === "cancelled") return { status: "cancelled", item };
    return { status: "selected", item };
  }
  if (finished.includes(b.status) || !stillOpen(b.items, item)) return null;
  if (b.shortlist.includes(artist.id)) return { status: "shortlisted", item };
  // Open to every active artist with a line in their categories, unless the day is marked off.
  if (!item || !b.items.some((i) => worksIn(artist, i.category)) || artist.status === "paused") return null;
  if (!reply && b.date && artist.blockedDates?.includes(b.date)) return null;
  return { status: reply ?? "new", item };
}
