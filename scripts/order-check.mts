// Checks that a WhatsApp message from the website's booking form reads back into its fields
// (src/lib/whatsapp-order.ts), as the admin's "Paste a WhatsApp message" box does.
// Run with: npm run check:orders
import { parseOrderMessage, pickService, type ParsedOrder } from "../src/lib/whatsapp-order.ts";

const cases: { name: string; text: string; expect: Partial<ParsedOrder> }[] = [
  {
    name: "the order lost on 16 October (Ref AOD-0)",
    text: [
      "Hi Artists on Demand! I'd like curated matches.",
      "Booking for: Business",
      "Occasion: Brand / product shoot",
      "Looking for: Photographers",
      "Date: 2026-10-17",
      "Time: 11:00 AM – 2:00 PM (3 hours)",
      "City: Ahmedabad",
      "Details: Need Photographer for product and team shoot. ",
      "Name: Khushboo",
      "Email: marketing@tafco.in",
      "Ref: AOD-0",
    ].join("\n"),
    expect: {
      audience: "Business",
      occasion: "Brand / product shoot",
      needs: ["Photographers"],
      date: "2026-10-17",
      startTime: "11:00",
      endTime: "14:00",
      city: "Ahmedabad",
      details: "Need Photographer for product and team shoot.",
      name: "Khushboo",
      email: "marketing@tafco.in",
      ref: "AOD-0",
    },
  },
  {
    name: "two categories, past midnight, phone, details over two lines, copied with a WhatsApp prefix",
    text: [
      "[16/10/2026, 10:23] Riya Shah: Hi Artists on Demand! I'd like curated matches.",
      "Booking for: Personal event",
      "Occasion: Wedding",
      "Looking for: Photographers, Musicians & DJs",
      "Date: 2026-12-05",
      "Time: 8:00 PM – 1:00 AM (5 hours, ends next day)",
      "City: Gandhinagar",
      "Details: Sangeet night at the farmhouse.",
      "Around 300 guests.",
      "Name: Riya Shah",
      "Phone: +91 98765 43210",
      "Email: Riya.Shah@Example.com",
      "Ref: AOD-1207",
    ].join("\n"),
    expect: {
      audience: "Personal",
      occasion: "Wedding",
      needs: ["Photographers", "Musicians & DJs"],
      date: "2026-12-05",
      startTime: "20:00",
      endTime: "01:00",
      city: "Gandhinagar",
      details: "Sangeet night at the farmhouse.\nAround 300 guests.",
      name: "Riya Shah",
      phone: "+919876543210",
      email: "riya.shah@example.com",
      ref: "AOD-1207",
    },
  },
  {
    name: "date not fixed, no city, typed by hand with 24-hour times",
    text: "Occasion: Corporate event\nLooking for: Anchors & Hosts\nDate: Not fixed yet\nTime: 18:30 - 21:00\nCity: Not selected\nName: Mehul",
    expect: { occasion: "Corporate event", needs: ["Anchors & Hosts"], startTime: "18:30", endTime: "21:00", name: "Mehul" },
  },
];

let failed = 0;
for (const c of cases) {
  const got = parseOrderMessage(c.text);
  const wrong = Object.entries(c.expect).filter(([k, v]) => JSON.stringify(got[k as keyof ParsedOrder]) !== JSON.stringify(v));
  // Nothing should be read that the case doesn't expect (apart from an empty needs list).
  const extra = Object.keys(got).filter((k) => !(k in c.expect) && !(k === "needs" && got.needs.length === 0));
  const ok = wrong.length === 0 && extra.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${c.name}`);
  for (const [k, v] of wrong) console.log(`    ${k}: got ${JSON.stringify(got[k as keyof ParsedOrder])}, expected ${JSON.stringify(v)}`);
  for (const k of extra) console.log(`    ${k}: read ${JSON.stringify(got[k as keyof ParsedOrder])}, expected nothing`);
}

const photography = ["Wedding photography", "Candid photography", "Pre-wedding shoot", "Event photography", "Product photography", "Portrait session"];
const services: [string, string][] = [
  ["Brand / product shoot Need Photographer for product and team shoot.", "Product photography"],
  ["Corporate event", "Event photography"],
  ["Birthday party", "Wedding photography"], // nothing matches: the category's first service
];
for (const [text, expected] of services) {
  const got = pickService(photography, text);
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} service for ${JSON.stringify(text)} → ${got}${ok ? "" : `   (expected ${expected})`}`);
}

console.log(failed ? `\n${failed} failed` : "\nAll passed");
process.exit(failed ? 1 : 0);
