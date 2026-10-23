// Reads the WhatsApp message that the website's booking form sends ("Hi Artists on Demand! I'd
// like curated matches." followed by "Occasion: …", "Looking for: …" and so on) back into its
// fields, so the team can paste a message into the admin's New booking form instead of typing it.
// A message someone typed by hand in the same "Label: value" shape works too. No imports, so
// scripts/order-check.mts can test it on its own.

export type ParsedOrder = {
  audience?: "Personal" | "Business";
  occasion?: string;
  needs: { name: string; count: number }[]; // category names as written in the message, and how many of each
  date?: string; // yyyy-mm-dd
  startTime?: string; // HH:MM, 24-hour
  endTime?: string; // HH:MM, 24-hour
  city?: string;
  details?: string;
  name?: string;
  email?: string;
  phone?: string;
  ref?: string; // AOD-PH-102601 (or an older AOD-1201). Missing, or AOD-0, means the website didn't save the request.
};

// The labels the booking form writes, and a few a person might type instead.
const labels: Record<string, string> = {
  "booking for": "audience",
  occasion: "occasion",
  event: "occasion",
  "looking for": "needs",
  date: "date",
  time: "time",
  city: "city",
  details: "details",
  name: "name",
  email: "email",
  phone: "phone",
  mobile: "phone",
  ref: "ref",
};

// "2:00 PM" → "14:00"; "18:30" stays as it is.
function to24h(hour: string, minute: string, ampm?: string): string {
  const half = ampm?.replace(/\./g, "").toUpperCase();
  const h = half ? (Number(hour) % 12) + (half === "PM" ? 12 : 0) : Number(hour) % 24;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

// "Photographers × 3" (as the booking form writes it), "Photographers x3", "Photographers (3)",
// "3 x Photographers" or "3 Photographers"; no number means one. At most 20 (MAX_ARTISTS).
function readNeed(item: string): { name: string; count: number } {
  const text = item.trim();
  const after = /^(.*?)\s*(?:[×xX*]\s*(\d{1,3})|\((\d{1,3})\))$/.exec(text);
  const before = /^(\d{1,3})\s*(?:[×xX*]\s*)?([^\d].*)$/.exec(text);
  const [name, n] = after ? [after[1], after[2] ?? after[3]] : before ? [before[2], before[1]] : [text, "1"];
  return { name: name.trim(), count: Math.min(20, Math.max(1, Number(n) || 1)) };
}

export function parseOrderMessage(text: string): ParsedOrder {
  const fields: Record<string, string> = {};
  let current = "";
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    // Copying several WhatsApp messages at once puts "[16/10/2026, 10:23] Khushboo: " in front.
    const line = raw.replace(/^\[[^\]]*\]\s*[^:]{1,40}:\s*/, "").trim();
    if (!line) continue;
    const m = /^\*?([A-Za-z][A-Za-z ]{1,19})\*?\s*:\s*(.*)$/.exec(line);
    const key = m ? labels[m[1].trim().toLowerCase()] : undefined;
    if (m && key) {
      current = key;
      fields[key] = m[2].trim();
    } else if (current === "details") {
      fields.details += `\n${line}`; // the event details can run over several lines
    }
  }

  const order: ParsedOrder = { needs: [] };
  const audience = (fields.audience ?? "").toLowerCase();
  if (audience.includes("business")) order.audience = "Business";
  else if (audience.includes("personal")) order.audience = "Personal";
  if (fields.occasion) order.occasion = fields.occasion;
  if (fields.needs) order.needs = fields.needs.split(",").map(readNeed).filter((n) => n.name);
  const date = /\d{4}-\d{2}-\d{2}/.exec(fields.date ?? "");
  if (date) order.date = date[0];
  const time = /(\d{1,2})[:.](\d{2})\s*([AaPp]\.?[Mm]\.?)?\s*(?:–|—|-|to)\s*(\d{1,2})[:.](\d{2})\s*([AaPp]\.?[Mm]\.?)?/.exec(fields.time ?? "");
  if (time) {
    order.startTime = to24h(time[1], time[2], time[3]);
    order.endTime = to24h(time[4], time[5], time[6]);
  }
  if (fields.city && !/^not selected$/i.test(fields.city)) order.city = fields.city;
  if (fields.details) order.details = fields.details.trim();
  if (fields.name) order.name = fields.name;
  const email = /[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}/.exec(fields.email ?? "");
  if (email) order.email = email[0].toLowerCase();
  const phone = (fields.phone ?? "").replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length >= 10) order.phone = phone;
  const ref = /AOD-(?:[A-Z]{2,3}-)?\d+/i.exec(fields.ref ?? "");
  if (ref) order.ref = ref[0].toUpperCase();
  return order;
}

// Words that say nothing about which service is meant.
const generic = new Set(["shoot", "need", "needs", "with", "from", "that", "this", "photographer", "photography", "photos", "video", "artist", "artists", "team"]);

// The service of a category that best matches the occasion and details ("Brand / product shoot"
// → "Product photography"), or the category's first service when nothing matches.
export function pickService(services: string[], text: string): string {
  const words = (text.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !generic.has(w));
  let best = services[0] ?? "";
  let bestScore = 0;
  for (const service of services) {
    const name = service.toLowerCase();
    const score = words.filter((w) => name.includes(w)).length;
    if (score > bestScore) {
      best = service;
      bestScore = score;
    }
  }
  return best;
}
