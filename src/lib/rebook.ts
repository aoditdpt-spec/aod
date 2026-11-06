// "Book again" from My bookings: the order's answers are handed to the booking questions on
// /book/personal or /book/business, which fill themselves in once and then forget them. Kept in
// sessionStorage (this tab only), so an old order never pre-fills a booking days later.

export type RebookDraft = {
  audience: "personal" | "business";
  occasion: string;
  needs: { slug: string; count: number }[];
  city?: string;
  time?: string; // HH:MM
  endTime?: string;
  details?: string;
};

const KEY = "aod-rebook";

export function startRebook(draft: RebookDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked (private mode): the booking questions simply start empty.
  }
}

// The draft for this audience's booking questions, once; null when there isn't one.
export function takeRebook(audience: string | undefined): RebookDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as RebookDraft;
    if (draft.audience !== audience) return null;
    sessionStorage.removeItem(KEY);
    return Array.isArray(draft.needs) ? draft : null;
  } catch {
    return null;
  }
}
