// Order IDs: AOD-<category code>-<MMYY><number>, for example AOD-PH-102601 (photographers, ordered
// in October 2026, the year's first order). The number counts every order of the year whatever
// its category (01 to 99, then 100, 101 …) and starts again at 01 on 1 January; the month and
// year are the day the order is made, in India time. An order for more than one category is
// AOD-MIX-…, and each of its lines has the same number with its own category's code, so a
// customer booking photographers, drone pilots and makeup is AOD-MIX-102602, with lines
// AOD-PH-102602, AOD-DR-102602 and AOD-MU-102602. Orders made before this (B-1215, with the
// customer's reference AOD-1215) keep their IDs. No imports, so `npm run check:orders` tests it.

// Two letters per category slug (src/content/site.ts); a new category needs one here.
export const categoryCodes: Record<string, string> = {
  photographers: "PH",
  cinematographers: "CN",
  "drone-pilots": "DR",
  "anchors-hosts": "AH",
  editors: "ED",
  "musicians-djs": "DJ",
  comedians: "CO",
  singers: "SI",
  "makeup-artists": "MU",
  models: "MO",
  "content-creators": "CC",
};
export const MIX = "MIX";

const ORDER_ID = /^AOD-([A-Z]{2,3})-(\d{2})(\d{2})(\d{2,})$/;

export function codeFor(category: string) {
  return categoryCodes[category] ?? category.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase().padEnd(2, "X");
}

// The parts of a new-style order or line ID; null for anything else (B-1215, AOD-1215 …).
export function parseOrderId(id: string) {
  const m = ORDER_ID.exec(id.trim().toUpperCase());
  if (!m) return null;
  return { code: m[1], month: m[2], year: m[3], number: Number(m[4]), stamp: `${m[2]}${m[3]}${m[4]}` };
}

// Month and year (two digits each) of `now` in India.
export function monthYear(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", month: "2-digit", year: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { month: part("month"), year: part("year") };
}

// The next free number this year, given the IDs already taken.
export function nextOrderNumber(ids: Iterable<string>, now = new Date()) {
  const { year } = monthYear(now);
  let max = 0;
  for (const id of ids) {
    const p = parseOrderId(id);
    if (p && p.year === year && p.number > max) max = p.number;
  }
  return max + 1;
}

// The ID for an order of these categories (slugs) with number `n`.
export function orderId(categories: string[], n: number, now = new Date()) {
  const kinds = [...new Set(categories)];
  const { month, year } = monthYear(now);
  return `AOD-${kinds.length === 1 ? codeFor(kinds[0]) : MIX}-${month}${year}${String(n).padStart(2, "0")}`;
}

// One line's ID: the order's number with that line's category code. An older order (B-1215) has
// no line IDs, so its lines show the order's own ID.
export function lineId(order: string, category: string) {
  const p = parseOrderId(order);
  return p ? `AOD-${codeFor(category)}-${p.stamp}` : order;
}

// Whether `ref` (an order or line ID someone typed, say on a Dispute Desk case) belongs to `order`.
export function sameOrder(order: string, ref: string) {
  const a = parseOrderId(order);
  const b = parseOrderId(ref);
  return a && b ? a.stamp === b.stamp : order.toUpperCase() === ref.trim().toUpperCase();
}
