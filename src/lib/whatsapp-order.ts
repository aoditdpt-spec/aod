// No imports (npm run check:orders tests it): the categories come in as an argument.
type Cat = { slug: string; name: string; types: string[] };

// "Paste A WhatsApp Message" in the admin's New Booking, as on aod.co.in: reads an order written
// on WhatsApp (the booking form's message, or one typed by hand) into the form's fields. It reads
// "Name: …", "Phone: …", "Date: …", "Time: 6 PM – 11 PM", "City: …", "Venue: …", "Occasion: …",
// "Budget: …", and who they need from "Photographers × 2", "3 x Live Band" or "Anchors (2)"; anything
// it doesn't recognise goes into the notes.

export type ParsedOrder = {
  customer: string;
  phone: string;
  email: string;
  date: string;
  start: string;
  end: string;
  city: string;
  venue: string;
  occasion: string;
  budget: string;
  notes: string;
  lines: { category: string; name: string; count: number }[];
};

const pad = (n: number) => String(n).padStart(2, "0");

function toTime(t: string): string {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(t.trim());
  if (!m) return "";
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h < 24 && min < 60 ? `${pad(h)}:${pad(min)}` : "";
}

function toDate(t: string): string {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return iso[0];
  const dmy = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(t);
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  }
  const d = new Date(t.replace(/(\d+)(st|nd|rd|th)/, "$1"));
  return Number.isNaN(d.getTime()) ? "" : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Names a kind had before, still read from older messages: "DJs" became "Live Band" (2026-11-21).
const renamed: Record<string, string[]> = { "Live Band": ["DJs"], "Musicians & Live Band": ["Musicians & DJs"] };

// Every kind of artist (and category name) to look for, longest first; `as` is the name it's saved as.
const namesOf = (categories: Cat[]) =>
  categories
    .flatMap((c) => [...c.types, c.name].flatMap((t) => [{ name: t, as: t, category: c.slug }, ...(renamed[t] ?? []).map((old) => ({ name: old, as: t, category: c.slug }))]))
    .sort((a, b) => b.name.length - a.name.length);

function linesFrom(text: string, names: { name: string; as: string; category: string }[]) {
  const out: ParsedOrder["lines"] = [];
  let rest = text;
  for (const n of names) {
    const singular = n.name.replace(/s$/, "");
    const re = new RegExp(`(?:(\\d+)\\s*[x×]\\s*)?(${n.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${singular.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})s?(?:\\s*[x×]\\s*(\\d+)|\\s*\\((\\d+)\\))?`, "i");
    const m = re.exec(rest);
    if (!m) continue;
    out.push({ category: n.category, name: n.as, count: Number(m[1] ?? m[3] ?? m[4] ?? 1) || 1 });
    rest = rest.replace(m[0], " ");
  }
  return out;
}

export function parseWhatsappOrder(message: string, categories: Cat[]): ParsedOrder {
  const names = namesOf(categories);
  const o: ParsedOrder = { customer: "", phone: "", email: "", date: "", start: "", end: "", city: "", venue: "", occasion: "", budget: "", notes: "", lines: [] };
  const notes: string[] = [];
  for (const raw of message.split(/\r?\n/)) {
    const line = raw.replace(/^[*•\-\s]+/, "").replace(/\*/g, "").trim();
    if (!line) continue;
    const m = /^([A-Za-z ]{2,24}):\s*(.+)$/.exec(line);
    const key = m?.[1].trim().toLowerCase() ?? "";
    const value = m?.[2].trim() ?? "";
    if (/^(name|customer|your name)$/.test(key)) o.customer = value;
    else if (/^(phone|mobile|number|phone number)$/.test(key)) o.phone = value;
    else if (/^email$/.test(key)) o.email = value;
    else if (/^(date|event date)$/.test(key)) o.date = toDate(value);
    else if (/^(time|timing)$/.test(key)) {
      const [a, b] = value.split(/\s*(?:–|-|to)\s*/i);
      o.start = toTime(a ?? "");
      o.end = toTime((b ?? "").replace(/\(.*$/, ""));
    } else if (/^city$/.test(key)) o.city = value;
    else if (/^(venue|where|location)$/.test(key)) o.venue = value;
    else if (/^(occasion|event)$/.test(key)) o.occasion = value;
    else if (/^budget$/.test(key)) o.budget = value;
    else if (/^(who|looking for|artists|need|needs)$/.test(key)) o.lines.push(...linesFrom(value, names));
    else notes.push(line);
  }
  // No "Who:" line: look for artists anywhere in the message.
  if (!o.lines.length) o.lines = linesFrom(message, names);
  o.notes = notes.join("\n");
  return o;
}
