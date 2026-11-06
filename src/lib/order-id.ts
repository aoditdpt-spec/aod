// Order IDs: AOD-<category code>-<YYMM><number>, for example AOD-PH-261001 (photographers, ordered
// in October 2026, the year's first order). The number counts every order of the year whatever
// its category (01 to 99, then 100, 101 …) and starts again at 01 on 1 January; the year and
// month are the day the order is made, in India time. An order for more than one category is
// AOD-MIX-…, and an order from a business account (the /business portal) is AOD-B2B-…; each of
// its lines has the same number with its own category's code, so a customer booking
// photographers, drone pilots and makeup is AOD-MIX-261002, with lines AOD-PH-261002,
// AOD-DR-261002 and AOD-MU-261002. Orders made before this keep their IDs: the first format put
// the month before the year (AOD-PH-102601, October 2026), and the first of all was B-1215 (with
// the customer's reference AOD-1215); both still read correctly here. No imports, so
// `npm run check:orders` tests it.

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
export const B2B = "B2B";

const ORDER_ID = /^AOD-([A-Z][A-Z0-9]{1,2})-(\d{2})(\d{2})(\d{2,})$/;

export function codeFor(category: string) {
  return categoryCodes[category] ?? category.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase().padEnd(2, "X");
}

// The parts of a new-style order or line ID; null for anything else (B-1215, AOD-1215 …). The
// current format is YYMM (261001), the earlier one MMYY (102601); a month is 01 to 12 and a year is
// 13 or more, so the two can't be mistaken for each other.
export function parseOrderId(id: string) {
  const m = ORDER_ID.exec(id.trim().toUpperCase());
  if (!m) return null;
  const legacy = Number(m[2]) >= 1 && Number(m[2]) <= 12;
  const [year, month] = legacy ? [m[3], m[2]] : [m[2], m[3]];
  return { code: m[1], month, year, number: Number(m[4]), stamp: `${m[2]}${m[3]}${m[4]}` };
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

// The ID for an order of these categories (slugs) with number `n`. A business account's order is
// AOD-B2B-… whatever it holds.
export function orderId(categories: string[], n: number, now = new Date(), business = false) {
  const kinds = [...new Set(categories)];
  const { month, year } = monthYear(now);
  const code = business ? B2B : kinds.length === 1 ? codeFor(kinds[0]) : MIX;
  return `AOD-${code}-${year}${month}${String(n).padStart(2, "0")}`;
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
