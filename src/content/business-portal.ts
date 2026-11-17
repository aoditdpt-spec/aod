// Copy, account types, status mapping and sample orders for the business portal (aod.co.in/business).
//
// The portal shows a company's own bookings (the ones made with its sign-in email) on a calendar
// and in a list. Two views of the same status: the calendar uses three stages (Inquired, Artist
// assigned, Done) and an order's detail shows the four-step track the company asked for (Inquiry,
// Accepted, Fulfilled, Payment received), both worked out from the booking's status, its artists
// and its verified payments, so the team keeps using the admin's one pipeline.
//
// PREVIEW (no backend): any sign-in code works, the company is kept in this browser, and the
// orders are samples (labelled) plus the requests sent from this browser.

import type { CustomerOrder } from "@/content/my-bookings";

export const companyTypes = ["Brand owner", "Event planner", "Agency", "Other"] as const;
export type CompanyType = (typeof companyTypes)[number];

export type Company = {
  id: string;
  name: string;
  type: CompanyType | "";
  typeOther: string; // what "Other" means, written by the company
  contactName: string;
  email: string;
  phone: string;
  city: string;
  website: string;
};

// The company's online presence: its website, LinkedIn page or Linktree (required).
export const companyLinkLabel = "Website, LinkedIn or Linktree";
export const companyLinkPlaceholder = "yourcompany.in or linkedin.com/company/…";
export const companyLinkError = "Add your website, LinkedIn or Linktree link.";

// What the company typed ("acme.in", "linkedin.com/company/acme", "https://linktr.ee/acme") as an
// https address; "" when empty, null when it isn't a web address. Used by the forms and the server.
export function companyLinkOf(v: unknown): string | null {
  const raw = typeof v === "string" ? v.trim().slice(0, 200) : "";
  if (!raw) return "";
  if (/\s/.test(raw)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(url.protocol) || !/\.[a-z]{2,}$/i.test(url.hostname)) return null;
    url.protocol = "https:";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const businessCopy = {
  signInTitle: "Sign in to your company account",
  signInText: "Use your company's email. We'll send a 6-digit code.",
  signUpTitle: "Create a company account",
  signUpText: "Tell us about your company. We confirm your email with a 6-digit code, and you're in.",
  welcome: "Book photographers, cinematographers and every other kind of artist for your brand, events and campaigns, and keep every order in one place.",
};

// The calendar's three stages (and cancelled, which the calendar shows quietly).
export type Stage = "inquired" | "assigned" | "done" | "cancelled";
export const stages: { id: Stage; label: string; dot: string; chip: string }[] = [
  { id: "inquired", label: "Inquired", dot: "bg-amber-500", chip: "bg-amber-50 text-amber-800" },
  { id: "assigned", label: "Artist assigned", dot: "bg-brand", chip: "bg-peach text-brand-hover" },
  { id: "done", label: "Done", dot: "bg-emerald-600", chip: "bg-emerald-50 text-emerald-700" },
  { id: "cancelled", label: "Cancelled", dot: "bg-muted", chip: "bg-wash text-muted" },
];
export const stageInfo = (s: Stage) => stages.find((x) => x.id === s)!;

type StageInput = Pick<CustomerOrder, "status" | "artists">;
export function stageOf(o: StageInput): Stage {
  if (o.status === "cancelled") return "cancelled";
  if (["completed", "delivered", "reviewed"].includes(o.status)) return "done";
  if (o.status === "confirmed" || o.artists.length > 0) return "assigned";
  return "inquired";
}

// The booking's four-step track.
export const trackSteps = [
  { id: "inquiry", label: "Inquiry", text: "AOD has your request and is finding artists." },
  { id: "accepted", label: "Accepted", text: "The quote is accepted and the date is locked in." },
  { id: "fulfilled", label: "Fulfilled", text: "The event is done." },
  { id: "paid", label: "Payment received", text: "Every payment is received and verified." },
] as const;

type TrackInput = Pick<CustomerOrder, "status" | "quote" | "payments">;
// How many steps of the track are done (1 to 4); a cancelled order has none.
export function trackDone(o: TrackInput): number {
  if (o.status === "cancelled") return 0;
  const verified = o.payments.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
  const fulfilled = ["completed", "delivered", "reviewed"].includes(o.status);
  const accepted = fulfilled || ["payment_pending", "confirmed"].includes(o.status);
  const paid = fulfilled && !!o.quote && verified >= o.quote;
  return paid ? 4 : fulfilled ? 3 : accepted ? 2 : 1;
}

// Sample orders for the preview, with dates around today.
export function sampleBusinessOrders(now: Date): CustomerOrder[] {
  const ymd = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const iso = (n: number, hour = 11) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "AOD-B2B-261101",
      sample: true,
      createdAt: iso(-1, 16),
      status: "new",
      occasion: "Product launch",
      services: ["Product Shoots × 2"],
      audience: "business",
      again: [{ slug: "photographers", count: 2 }],
      date: ymd(12),
      time: "10:00",
      endTime: "16:00",
      city: "Ahmedabad",
      venue: "Brand studio, SG Highway",
      notes: "New summer range, 40 products on white and in-use shots.",
      artists: [],
      shortlisted: [
        { name: "Sample photographer", craft: "Photographers", city: "Ahmedabad", profile: { id: "ART-SAMPLE-1", experience: "3–5 years", languages: ["Gujarati", "Hindi", "English"], services: ["Event photography", "Candid photography"], bio: "Sample profile: event and corporate photographer based in Ahmedabad.", photo: "", works: [] } },
        { name: "Sample photographer 2", craft: "Photographers", city: "Gandhinagar", profile: { id: "ART-SAMPLE-2", experience: "More than 5 years", languages: ["Gujarati", "English"], services: ["Event photography"], bio: "Sample profile.", photo: "", works: [] } },
      ],
      needed: 2,
      payments: [],
      history: [{ status: "new", at: iso(-1, 16) }],
    },
    {
      id: "AOD-B2B-261002",
      sample: true,
      createdAt: iso(-8, 10),
      status: "confirmed",
      occasion: "Corporate annual day",
      services: ["Corporate Conference & Summit Recap"],
      audience: "business",
      again: [{ slug: "cinematographers", count: 1 }],
      date: ymd(6),
      time: "17:00",
      endTime: "22:00",
      city: "Gandhinagar",
      venue: "Convention centre",
      artists: [{ name: "Kabir Mehta", craft: "Cinematographers", city: "Ahmedabad" }],
      quote: 45000,
      advance: 13500,
      payments: [{ amount: 13500, utr: "427100583349", at: iso(-5, 13), status: "verified" }],
      balance: { amount: 31500, dueBy: ymd(6) },
      history: [
        { status: "new", at: iso(-8, 10) },
        { status: "matched", at: iso(-7, 12) },
        { status: "quoted", at: iso(-7, 15) },
        { status: "confirmed", at: iso(-5, 17) },
      ],
    },
    {
      id: "AOD-B2B-261001",
      sample: true,
      createdAt: iso(-30, 9),
      status: "reviewed",
      occasion: "Hotel and café content",
      services: ["Architecture & Interior Shoot (Hotels / Cafes / Real Estate)"],
      audience: "business",
      again: [{ slug: "photographers", count: 1 }],
      date: ymd(-18),
      time: "09:00",
      endTime: "15:00",
      city: "Ahmedabad",
      artists: [{ name: "Meera Trivedi", craft: "Photographers", city: "Ahmedabad" }],
      quote: 22000,
      advance: 8000,
      payments: [
        { amount: 8000, utr: "426610938475", at: iso(-25, 10), status: "verified" },
        { amount: 14000, utr: "426702118930", at: iso(-17, 18), status: "verified" },
      ],
      history: [
        { status: "new", at: iso(-30, 9) },
        { status: "quoted", at: iso(-29, 15) },
        { status: "confirmed", at: iso(-25, 14) },
        { status: "completed", at: iso(-18, 13) },
        { status: "delivered", at: iso(-14, 11) },
        { status: "reviewed", at: iso(-10, 11) },
      ],
    },
  ];
}
