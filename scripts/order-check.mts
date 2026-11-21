// Checks the admin's "Paste A WhatsApp Message" reader (src/lib/whatsapp-order.ts) and the order IDs
// (src/lib/order-id.ts). Run with: npm run check:orders. Add a case when changing either.
import { categories } from "../src/data/site.ts";
import { categoryCodes, lineId, nextOrderNumber, orderId, parseOrderId, sameOrder } from "../src/lib/order-id.ts";
import { parseWhatsappOrder, type ParsedOrder } from "../src/lib/whatsapp-order.ts";

let failed = 0;
const check = (label: string, got: string, expected: string) => {
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${label} → ${got}${ok ? "" : `   (expected ${expected})`}`);
};

// ---- Reading a WhatsApp message into New Booking ----

const cases: { name: string; text: string; expect: Partial<ParsedOrder> }[] = [
  {
    name: "a full message",
    text: ["Name: Test Person", "Phone: 98765 43210", "Email: test@example.com", "Who: Photographers × 2, DJs", "Occasion: Sangeet", "Date: 2026-12-12", "Time: 6:00 PM – 11:00 PM (5 hours)", "City: Ahmedabad", "Venue: Taj Skyline", "Budget: 40000", "About 200 guests"].join("\n"),
    expect: {
      customer: "Test Person",
      phone: "98765 43210",
      email: "test@example.com",
      occasion: "Sangeet",
      date: "2026-12-12",
      start: "18:00",
      end: "23:00",
      city: "Ahmedabad",
      venue: "Taj Skyline",
      budget: "40000",
      notes: "About 200 guests",
      lines: [
        { category: "photo-video", name: "Photographers", count: 2 },
        { category: "musicians-djs", name: "Live Band", count: 1 }, // an older message's "DJs" reads as the renamed kind
      ],
    },
  },
  {
    name: "hand-typed counts: 3 x and (2)",
    text: "Need 3 x Drone Operators and Anchors (2) on 12/12/2026",
    expect: {
      date: "",
      lines: [
        { category: "photo-video", name: "Drone Operators", count: 3 },
        { category: "anchors-hosts", name: "Anchors", count: 2 },
      ],
    },
  },
  {
    name: "a kind without a number is one",
    text: "Looking for: Makeup Artists",
    expect: { lines: [{ category: "makeup-styling", name: "Makeup Artists", count: 1 }] },
  },
  {
    name: "a dd/mm/yyyy date",
    text: "Date: 05/01/2027\nWho: Singers",
    expect: { date: "2027-01-05", lines: [{ category: "musicians-djs", name: "Singers", count: 1 }] },
  },
];
for (const c of cases) {
  const got = parseWhatsappOrder(c.text, categories);
  const wrong = Object.entries(c.expect).filter(([k, v]) => JSON.stringify(got[k as keyof ParsedOrder]) !== JSON.stringify(v));
  if (wrong.length) failed++;
  console.log(`${wrong.length ? "✗" : "✓"} ${c.name}`);
  for (const [k, v] of wrong) console.log(`    ${k}: got ${JSON.stringify(got[k as keyof ParsedOrder])}, expected ${JSON.stringify(v)}`);
}

// ---- Order IDs: AOD-<category code>-<YYMM><number>, numbered through the year ----

const oct = new Date("2026-10-23T10:00:00+05:30");
check("one category", orderId(["photo-video"], 1, oct), "AOD-PH-261001");
check("several categories are MIX", orderId(["photo-video", "makeup-styling"], 2, oct), "AOD-MIX-261002");
check("a business account's order is B2B", orderId(["photo-video"], 3, oct, true), "AOD-B2B-261003");
check("two lines of one category are still that category", orderId(["photo-video", "photo-video"], 5, oct), "AOD-PH-261005");
check("past 99 the number grows", orderId(["musicians-djs"], 100, oct), "AOD-DJ-2610100");
check("the year and month are India's (31 Dec 23:00 UTC is already January)", orderId(["models-creators"], 1, new Date("2026-12-31T23:00:00Z")), "AOD-MO-270101");
check("a line of a MIX order", lineId("AOD-MIX-261002", "makeup-styling"), "AOD-MU-261002");
check("a line of a B2B order", lineId("AOD-B2B-261003", "photo-video"), "AOD-PH-261003");
check("an earlier-format order (MMYY) still reads", String(parseOrderId("AOD-PH-102601")?.year) + String(parseOrderId("AOD-PH-102601")?.month), "2610");
check("an older order's lines keep its ID", lineId("B-1215", "photo-video"), "B-1215");
check("the next number counts every category this year, both formats", String(nextOrderNumber(["AOD-PH-102601", "AOD-MIX-261007", "AOD-B2B-251205", "B-1300"], oct)), "8");
check("a new year starts at 1", String(nextOrderNumber(["AOD-PH-261299"], new Date("2027-01-02T10:00:00+05:30"))), "1");
check("a line ID names its order", String(sameOrder("AOD-MIX-261002", "aod-mu-261002")), "true");
check("…but not another order", String(sameOrder("AOD-MIX-261002", "AOD-MU-261003")), "false");
check("every category has its own code", String(new Set(Object.values(categoryCodes)).size === Object.keys(categoryCodes).length), "true");
check("every category on the site has a code (add one in categoryCodes)", categories.filter((c) => !categoryCodes[c.slug]).map((c) => c.slug).join(", "), "");

console.log(failed ? `\n${failed} failed` : "\nAll passed");
process.exit(failed ? 1 : 0);
