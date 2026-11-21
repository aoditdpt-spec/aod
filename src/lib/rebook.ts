// Book Again (My Bookings and the business portal, as on aod.co.in): the old order's answers are
// kept for the next page in this tab (sessionStorage), and the booking questions read them once.

export type Rebook = {
  categories: string[];
  kinds: Record<string, string[]>;
  counts: Record<string, number>;
  occasion: string;
  venue: string;
  time: string;
  hours: number;
  details: string;
  brief: string;
};

const KEY = "aod-rebook";

export function setRebook(r: Rebook) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    // Storage blocked: the questions open empty.
  }
}

export function takeRebook(): Rebook | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as Rebook) : null;
  } catch {
    return null;
  }
}

// An order's answers, as Book Again fills them in.
export function rebookFrom(b: { cats: string[]; lines: { category: string; name: string; count: number }[]; occasion?: string; venue?: string; city: string; start: string; end: string; notes: string; brief?: string }, types: Record<string, string[]>, minutes: number | null): Rebook {
  const kinds: Record<string, string[]> = {};
  const counts: Record<string, number> = {};
  for (const l of b.lines) {
    if ((types[l.category] ?? []).length > 1 && types[l.category].includes(l.name)) kinds[l.category] = [...(kinds[l.category] ?? []), l.name];
    counts[l.name] = l.count;
  }
  return {
    categories: b.cats,
    kinds,
    counts,
    occasion: b.occasion ?? "",
    venue: b.venue || b.city,
    time: b.start,
    hours: minutes ?? 0,
    details: b.notes,
    brief: b.brief ?? "",
  };
}
