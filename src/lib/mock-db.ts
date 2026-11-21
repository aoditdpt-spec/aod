"use client";

import { useSyncExternalStore } from "react";
import { categories } from "@/data/site";
import { orderId } from "@/lib/order-id";

// The PREVIEW data (no Supabase keys): the screens read it through src/lib/app-db.tsx, which
// swaps in the live data from the backend when it's set up. Originally aod-redesign's test store.
// The admin's and the artist portal's "database" in test mode (the backend is off, see
// src/lib/backend.ts): sample records made fresh around today's date, plus every change made on
// either page, kept in this browser (localStorage `aod-mock-db`) until "Reset Sample Data". The
// booking page's test requests (`aod-mock-orders`, BookForm.tsx) show up as new orders. One store
// for both, so an artist accepting a request shows in the admin, and a team message reaches the
// portal. Sample people's phones start with 55 and their emails use example.com.

export type Stage = "new" | "matched" | "advance" | "confirmed" | "completed" | "cancelled";
export const stages: { id: Stage; label: string }[] = [
  { id: "new", label: "Request Received" },
  { id: "matched", label: "Matched" },
  { id: "advance", label: "Advance Paid" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];
export const stageLabel = (s: Stage) => stages.find((x) => x.id === s)!.label;
export const openStage = (s: Stage) => s !== "completed" && s !== "cancelled";

export type Booking = {
  id: string;
  customer: string;
  phone: string;
  email: string;
  cats: string[];
  needs: string;
  date: string; // yyyy-mm-dd
  start: string; // HH:MM
  end: string;
  city: string;
  venue?: string; // the exact venue, on orders from the booking page
  stage: Stage;
  quote: number | null;
  source: "Website" | "WhatsApp" | "Business" | "Test Booking" | "Admin";
  notes: string;
  assigned: string[]; // artist ids
  createdAt: string; // ISO
  occasion?: string;
  brief?: string; // what the artists see
  budget?: string;
  lines: Line[]; // one per kind of artist, with how many are needed
  shortlist: string[]; // artist ids shortlisted for the customer
  delivery?: string; // the delivered files' link
  history: Event[];
  review?: Review;
  customerCancelled?: string; // ISO, when the customer cancelled it themselves
  business?: boolean;
};
export type Line = { category: string; name: string; count: number };
export type Event = { at: string; text: string; by: string };
export type Review = { stars: number; text: string; at: string };

export type AppStage = "review" | "meeting" | "trial" | "approved" | "rejected";
export const appStages: { id: AppStage; label: string }[] = [
  { id: "review", label: "Portfolio Review" },
  { id: "meeting", label: "Meeting" },
  { id: "trial", label: "Trial Booking" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Not Taken" },
];
export const appStageLabel = (s: AppStage) => appStages.find((x) => x.id === s)!.label;

export type Application = { id: string; name: string; craft: string; cat: string; city: string; photo: string; applied: string; stage: AppStage; meetingAt?: string; email: string; phone: string; submittedAt?: string; experience?: string; instagram?: string; link?: string; details?: AppDetails };
export type Artist = { id: string; name: string; craft: string; cats: string[]; city: string; photo: string; email: string; phone: string; since: string; active: boolean };
export type Payment = { id: string; booking: string; customer: string; amount: number; kind: "Advance" | "Balance"; utr: string; at: string; verified: boolean };
export type Payout = { id: string; booking: string; artist: string; amount: number; at: string; sent: boolean };
export type CaseStatus = "new" | "replied" | "escalated" | "resolved";
export const caseStatuses: { id: CaseStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "replied", label: "Replied" },
  { id: "escalated", label: "Escalated" },
  { id: "resolved", label: "Resolved" },
];
export type Case = {
  id: string;
  role: "Customer" | "Artist" | "Business";
  name: string;
  about: string;
  booking: string;
  outside: boolean;
  raisedAt: string;
  status: CaseStatus;
  email?: string;
  details?: string;
  outcome?: string;
  otherParty?: string;
  notes: Event[]; // the team's internal notes
  decision?: string; // what the person sees
};
export type PostStatus = "Published" | "Draft" | "Scheduled";
export type Post = { id: string; title: string; status: PostStatus; date: string; author: string; slug: string; summary: string; body: string; tags: string; cover?: string };
export type Subscriber = { email: string; status: "Confirmed" | "Pending"; since: string };
export type Issue = { id: string; subject: string; body: string; sentAt?: string; count?: number };
export type Staff = { id: string; name: string; email: string; role: "Admin" | "Developer" };
export type Msg = { id: string; artist: string; from: "team" | "artist"; by?: string; text: string; at: string };
export type Activity = { at: string; text: string; by: string };
export type Reply = "accepted" | "declined";
export type Profile = { name: string; craft: string; phone: string; email: string; city: string; area: string; experience: string; languages: string; about: string; instagram: string; website: string };

// What changed since the sample: the only part kept in the browser.
type Patch = {
  stage?: Record<string, Stage>;
  assigned?: Record<string, string[]>;
  quote?: Record<string, number | null>;
  replies?: Record<string, Record<string, Reply>>; // booking → artist → reply
  appStage?: Record<string, AppStage>;
  paused?: Record<string, boolean>;
  verified?: string[];
  payoutsSent?: string[];
  caseStatus?: Record<string, CaseStatus>;
  postStatus?: Record<string, PostStatus>;
  posts?: Post[];
  messages?: Msg[];
  teamRead?: Record<string, string>;
  artistRead?: string;
  staff?: Staff[];
  settings?: Record<string, boolean>;
  activity?: Activity[];
  profile?: Partial<Profile>;
  daysOff?: string[];
  bookings?: Booking[];
  sentAt?: string;
  shortlist?: Record<string, string[]>;
  lines?: Record<string, Line[]>;
  delivery?: Record<string, string>;
  moved?: Record<string, { date: string; start: string; end: string }>;
  deleted?: string[];
  history?: Record<string, Event[]>;
  reviews?: Record<string, Review>;
  customerCancelled?: Record<string, string>;
  payments?: Payment[];
  payouts?: Payout[];
  cases?: Case[];
  caseNotes?: Record<string, Event[]>;
  caseDecision?: Record<string, string>;
  artists?: Artist[];
  artistEdits?: Record<string, Partial<Artist>>;
  meetingAt?: Record<string, string>;
  postEdits?: Record<string, Partial<Post>>;
  unsubscribed?: string[];
  issues?: Issue[];
  submitted?: Record<string, string>; // application id → when the applicant sent it for review
  appDetails?: Record<string, AppDetails>;
};

export const ME = "ART-201"; // the artist the portal shows
export const STAFF_NAME = "Aditi Shah"; // the team member the admin is signed in as

const KEY = "aod-mock-db";
const ORDERS = "aod-mock-orders";
// Artist applications sent from /artists/apply (ApplyForm.tsx), kept in this browser.
export const APPS = "aod-mock-applications";
export type SentApplication = { id: string; name: string; email: string; phone: string; city: string; cat: string; craft: string; photo?: string; experience?: string; instagram?: string; link?: string; at: string };
// What an applicant adds in the portal's Complete Your Details (after the 2-step sign-up).
// Complete Your Details (CompleteProfile.tsx): `kind` is what they mainly do and `other` the other
// kinds they also do (work-questions.ts), `services` the services they offer, `work` each kind's
// answers by "<kind>.<question id>".
export type AppDetails = { photo?: string; dob?: string; area?: string; languages?: string[]; kind?: string; other?: string[]; services?: string[]; about?: string; agree?: boolean; work?: Record<string, string | string[]> };
const DAY = 864e5;

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (k: string) => new Date(`${k}T00:00:00`);

export const slugOf = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

// "Photographers × 2, Live Band" as lines, each matched to its category.
export function linesFromNeeds(needs: string, cats: string[]): Line[] {
  return needs
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = /^(.*?)\s*×\s*(\d+)$/.exec(part);
      const name = (m ? m[1] : part).trim();
      const count = m ? Number(m[2]) : 1;
      const category = cats.find((c) => categories.find((x) => x.slug === c)?.types.includes(name) || catName(c) === name) ?? cats[0] ?? "photo-video";
      return { category, name, count };
    });
}
export const needsOf = (lines: Line[]) => lines.map((l) => (l.count > 1 ? `${l.name} × ${l.count}` : l.name)).join(", ");
export const COMMISSION = 0.2; // AOD's share when suggesting artist payouts

export const settingList = [
  { id: "booking", label: "New Booking Request", text: "Email the team when a request comes in." },
  { id: "application", label: "New Artist Application", text: "Email the team when an artist applies." },
  { id: "cancelled", label: "Customer Cancelled A Booking", text: "Email the team when a customer cancels." },
  { id: "business", label: "New Business Account", text: "Email the team when a company signs up." },
  { id: "artistMessage", label: "New Artist Message", text: "Email the team when an artist writes." },
];

export const templates = [
  { id: "payment", title: "Payment Details", text: "Hi {name}, thanks for booking with AOD. To confirm {ref}, please pay the advance of {advance} by UPI or bank transfer and share the UTR here." },
  { id: "assigned", title: "Artist Assigned", text: "Hi {name}, your artist for {ref} on {date} in {city} is confirmed. We'll share their profile in My Bookings." },
  { id: "reminder", title: "Event Reminder", text: "Hi {name}, a reminder that your event ({ref}) is on {date}. Your artist will reach 30 minutes early." },
  { id: "review", title: "Ask For A Review", text: "Hi {name}, we hope {ref} went well. Could you rate your artist in My Bookings? It takes a minute." },
];

// ---------------------------------------------------------------- the sample, around today

function seed(today: Date, now: number) {
  const day = (n: number) => dayKey(new Date(today.getTime() + n * DAY));
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  let n = 40;
  const id = (cats: string[], business = false) => orderId(cats, n++, today, business);

  const b = (x: Omit<Booking, "id" | "phone" | "email" | "notes" | "createdAt" | "lines" | "shortlist" | "history"> & { notes?: string; made?: number; shortlist?: string[] }): Booking => ({
    id: id(x.cats, x.business),
    phone: `55${String(10000000 + n * 7919).slice(0, 8)}`,
    email: `${x.customer.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@example.com`,
    notes: x.notes ?? "",
    createdAt: ago(x.made ?? 60 * 24 * 3),
    customer: x.customer,
    cats: x.cats,
    needs: x.needs,
    date: x.date,
    start: x.start,
    end: x.end,
    city: x.city,
    stage: x.stage,
    quote: x.quote,
    source: x.source,
    assigned: x.assigned,
    lines: linesFromNeeds(x.needs, x.cats),
    shortlist: x.shortlist ?? x.assigned,
    history: [{ at: ago(x.made ?? 60 * 24 * 3), text: "Request received", by: x.source }],
    business: x.business,
    occasion: x.occasion,
    brief: x.brief,
  });

  const bookings: Booking[] = [
    b({ customer: "Patel Family", cats: ["photo-video", "musicians-djs"], needs: "Photographers × 2, Live Band", date: day(2), start: "18:00", end: "23:00", city: "Ahmedabad", stage: "new", quote: null, source: "Website", assigned: [], made: 40, notes: "Sangeet night. Candids of the family dances and a few posed portraits of the couple.", occasion: "Haldi, Mehendi Or Sangeet", brief: "Lots of candids of the dances; a few posed portraits of the couple.", shortlist: ["ART-201", "ART-205"] }),
    b({ customer: "Shreeji Realty", cats: ["photo-video"], needs: "Drone Operators", date: day(5), start: "07:00", end: "10:00", city: "Surat", stage: "new", quote: null, source: "Business", business: true, assigned: [], made: 180, notes: "Aerial shots of the new tower for the brochure." }),
    b({ customer: "Galco", cats: ["photo-video"], needs: "Photographers, Cinematographers", date: day(9), start: "09:30", end: "17:30", city: "Gandhinagar", stage: "new", quote: null, source: "Business", business: true, assigned: [], made: 300, notes: "Conference coverage, keynote and stalls." }),
    b({ customer: "Trivedi Birthday", cats: ["comedians"], needs: "Stand-Up Comedians", date: day(7), start: "20:00", end: "21:00", city: "Rajkot", stage: "new", quote: null, source: "WhatsApp", assigned: [], made: 600 }),
    b({ customer: "Rao Pre-Wedding", cats: ["photo-video"], needs: "Photographers", date: day(15), start: "07:00", end: "11:00", city: "Vadodara", stage: "new", quote: null, source: "Website", assigned: [], made: 900, occasion: "Pre-Wedding Shoot", shortlist: ["ART-201"] }),
    b({ customer: "Townhall, Zydex", cats: ["anchors-hosts"], needs: "Anchors", date: day(4), start: "10:00", end: "13:00", city: "Ahmedabad", stage: "matched", quote: 15000, source: "Business", business: true, assigned: ["ART-202"] }),
    b({ customer: "Shah Wedding", cats: ["makeup-styling"], needs: "Makeup Artists × 2", date: day(11), start: "06:00", end: "10:00", city: "Ahmedabad", stage: "advance", quote: 22500, source: "Website", assigned: ["ART-204"] }),
    b({ customer: "Mandalam", cats: ["photo-video", "musicians-djs"], needs: "Musicians, Drone Operators, Photographers × 3", date: day(13), start: "19:00", end: "01:00", city: "Ahmedabad", stage: "confirmed", quote: 96000, source: "WhatsApp", assigned: ["ART-201", "ART-203", "ART-207"] }),
    b({ customer: "Joshi Reception", cats: ["photo-video"], needs: "Photographers, Cinematographers", date: day(20), start: "19:30", end: "23:30", city: "Ahmedabad", stage: "matched", quote: 54000, source: "Website", assigned: ["ART-201", "ART-205"], occasion: "Reception" }),
    b({ customer: "HoneyVeda", cats: ["models-creators"], needs: "Reel Creators", date: day(-9), start: "11:00", end: "14:00", city: "Ahmedabad", stage: "completed", quote: 9990, source: "Business", business: true, assigned: ["ART-206"] }),
    b({ customer: "Mehta Engagement", cats: ["photo-video"], needs: "Photographers", date: day(-16), start: "18:00", end: "22:00", city: "Vadodara", stage: "completed", quote: 18000, source: "Website", assigned: ["ART-201"] }),
    b({ customer: "Desai Sangeet", cats: ["musicians-djs"], needs: "Singers, Live Band", date: day(-3), start: "19:00", end: "23:00", city: "Surat", stage: "cancelled", quote: 30000, source: "Website", assigned: [] }),
    b({ customer: "Patel Anniversary", cats: ["photo-video"], needs: "Photographers", date: day(-6), start: "19:00", end: "22:00", city: "Ahmedabad", stage: "completed", quote: 12000, source: "Website", assigned: ["ART-201"] }),
  ];
  const ref = (customer: string) => bookings.find((x) => x.customer === customer)!.id;

  const artists: Artist[] = [
    ["ART-201", "Aman Shah", "Photographer", ["photo-video"], "Ahmedabad", "photographers.jpg", -400],
    ["ART-202", "Meera Joshi", "Anchor", ["anchors-hosts"], "Ahmedabad", "anchors-hosts.jpg", -380],
    ["ART-203", "Kabir Desai", "Musician", ["musicians-djs"], "Ahmedabad", "musicians-djs.jpg", -300],
    ["ART-204", "Sana Qureshi", "Makeup Artist", ["makeup-styling"], "Ahmedabad", "makeup-artists.jpg", -260],
    ["ART-205", "Vivek Rana", "Cinematographer", ["photo-video"], "Gandhinagar", "cinematographers.jpg", -220],
    ["ART-206", "Tara Mehta", "Reel Creator", ["models-creators"], "Ahmedabad", "content-creators.webp", -200],
    ["ART-207", "Ishaan Dave", "Drone Operator", ["photo-video"], "Surat", "drone-pilots.jpg", -150],
    ["ART-208", "Neel Shah", "Stand-Up Comedian", ["comedians"], "Rajkot", "comedians.jpg", -120],
    ["ART-209", "Ria Kapoor", "Model", ["models-creators"], "Vadodara", "models.jpg", -90],
    ["ART-210", "Anaya Singh", "Singer", ["musicians-djs"], "Surat", "singers.jpg", -60],
  ].map(([id, name, craft, cats, city, , since], i) => ({
    id: id as string,
    name: name as string,
    craft: craft as string,
    cats: cats as string[],
    city: city as string,
    photo: "", // no sample photos (on request, 2026-11-20): initials show instead
    email: `${(name as string).toLowerCase().replace(" ", ".")}@example.com`,
    phone: `55${String(20000000 + i * 104729).slice(0, 8)}`,
    since: day(since as number),
    active: true,
  }));

  const applications: Application[] = [
    ["APP-238", "Riya Mehta", "Singer", "musicians-djs", "Ahmedabad", "singers.jpg", -7, "meeting", 0, 16],
    ["APP-237", "Karan Joshi", "Drone Operator", "photo-video", "Vadodara", "drone-pilots.jpg", -8, "review"],
    ["APP-236", "Dev Trivedi", "Stand-Up Comedian", "comedians", "Surat", "comedians.jpg", -10, "trial"],
    ["APP-235", "Nisha Rao", "Host", "anchors-hosts", "Ahmedabad", "anchors-hosts.jpg", -11, "review"],
    ["APP-234", "Pooja Desai", "Makeup Artist", "makeup-styling", "Rajkot", "makeup-artists.jpg", -12, "meeting", 2, 11],
    ["APP-233", "Arjun Patel", "Reel Creator", "models-creators", "Ahmedabad", "content-creators.webp", -13, "review"],
    ["APP-232", "Rohan Iyer", "Live Band", "musicians-djs", "Gandhinagar", "musicians-djs.jpg", -20, "approved"],
    ["APP-231", "Kavya Shah", "Model", "models-creators", "Surat", "models.jpg", -22, "rejected"],
  ].map(([id, name, craft, cat, city, , applied, stage, meetDay, meetHour], i) => ({
    id: id as string,
    name: name as string,
    craft: craft as string,
    cat: cat as string,
    city: city as string,
    photo: "", // no sample photos (on request, 2026-11-20): initials show instead
    applied: day(applied as number),
    stage: stage as AppStage,
    meetingAt: meetDay === undefined ? undefined : new Date(today.getTime() + (meetDay as number) * DAY + (meetHour as number) * 3600_000).toISOString(),
    email: `${(name as string).toLowerCase().replace(" ", ".")}@example.com`,
    phone: `55${String(30000000 + i * 15485863).slice(0, 8)}`,
  }));

  const payments: Payment[] = [
    { id: "PAY-3101", booking: ref("HoneyVeda"), customer: "HoneyVeda", amount: 9990, kind: "Balance", utr: "UTR 4410 2231 0098", at: ago(60 * 24 * 9), verified: true },
    { id: "PAY-3102", booking: ref("Mehta Engagement"), customer: "Mehta Engagement", amount: 18000, kind: "Balance", utr: "UTR 4410 2231 0154", at: ago(60 * 24 * 15), verified: true },
    { id: "PAY-3103", booking: ref("Patel Anniversary"), customer: "Patel Anniversary", amount: 12000, kind: "Balance", utr: "UTR 4410 2231 0211", at: ago(60 * 24 * 5), verified: true },
    { id: "PAY-3104", booking: ref("Shah Wedding"), customer: "Shah Wedding", amount: 11250, kind: "Advance", utr: "UTR 4410 2231 0307", at: ago(60 * 24 * 4), verified: true },
    { id: "PAY-3105", booking: ref("Mandalam"), customer: "Mandalam", amount: 48000, kind: "Advance", utr: "UTR 4410 2231 0362", at: ago(60 * 24 * 3), verified: true },
    { id: "PAY-3106", booking: ref("Joshi Reception"), customer: "Joshi Reception", amount: 27000, kind: "Advance", utr: "UTR 4410 2231 0419", at: ago(200), verified: false },
    { id: "PAY-3107", booking: ref("Townhall, Zydex"), customer: "Townhall, Zydex", amount: 7500, kind: "Advance", utr: "UTR 4410 2231 0471", at: ago(95), verified: false },
    { id: "PAY-3108", booking: ref("Mandalam"), customer: "Mandalam", amount: 6500, kind: "Balance", utr: "UTR 4410 2231 0533", at: ago(18), verified: false },
  ];
  // Payments from last month too, so "this month against last month" has something to compare.
  const lastMonth = [21, 26, 33, 38, 44, 50].map((d, i) => ({
    id: `PAY-30${90 + i}`,
    booking: "Earlier order",
    customer: ["Kothari Wedding", "Adani Shantigram", "Vora Birthday", "Bhatt Engagement", "GCCI", "Parikh Reception"][i],
    amount: [42000, 18500, 9000, 26000, 64000, 31000][i],
    kind: "Balance" as const,
    utr: `UTR 4410 1190 0${300 + i * 7}`,
    at: ago(60 * 24 * d),
    verified: true,
  }));

  const payouts: Payout[] = [
    { id: "PO-501", booking: ref("Mehta Engagement"), artist: "ART-201", amount: 14400, at: ago(60 * 24 * 14), sent: true },
    { id: "PO-502", booking: ref("Patel Anniversary"), artist: "ART-201", amount: 9600, at: ago(60 * 24 * 4), sent: true },
    { id: "PO-503", booking: ref("HoneyVeda"), artist: "ART-206", amount: 8000, at: ago(60 * 24 * 8), sent: false },
  ];

  const cases: Case[] = [
    { id: "DC-1005", role: "Artist", name: "Kabir Desai", about: "Last-Minute Cancellation", booking: ref("Desai Sangeet"), outside: false, raisedAt: ago(60 * 50), status: "escalated", notes: [{ at: ago(60 * 30), text: "Customer says the date changed; checking the chat.", by: "Aditi Shah" }] },
    { id: "DC-1004", role: "Customer", name: "Desai Sangeet", about: "Artist Was Late", booking: ref("Desai Sangeet"), outside: false, raisedAt: ago(60 * 39), status: "new", notes: [] },
    { id: "DC-1003", role: "Artist", name: "Anaya Singh", about: "Unpaid Or Delayed Payment", booking: "Booked outside AOD", outside: true, raisedAt: ago(60 * 24 * 4), status: "replied", notes: [], otherParty: "Vora Events, 55 2000 4411" },
    { id: "DC-1002", role: "Customer", name: "Mehta Engagement", about: "Files Not Delivered", booking: ref("Mehta Engagement"), outside: false, raisedAt: ago(60 * 24 * 12), status: "resolved", notes: [], decision: "The photographer delivered all edited photos within 3 days. Case closed." },
  ];

  const post = (id: string, title: string, status: PostStatus, date: string, author: string, summary: string, body: string, tags: string, cover?: string): Post => ({
    id,
    title,
    status,
    date,
    author,
    slug: slugOf(title),
    summary,
    body,
    tags,
    cover,
  });
  // No cover photos on the sample posts (on request, 2026-11-21: the old photos were deleted).
  const posts: Post[] = [
    post("P-4", "How To Plan Photography For A Two-Day Wedding", "Published", day(-5), "Aditi Shah", "Two days, five events, one photographer or two? A simple plan that misses nothing.", "## Start with the list of moments\n\nWrite down every event: haldi, mehendi, sangeet, the wedding and the reception. Next to each, write the moments you can't miss.\n\n## One photographer or two?\n\nFor more than 200 guests, book **two photographers** and a cinematographer. One follows the couple, one follows the family.\n\n- Share the timeline a week before\n- Name one family member as the point of contact\n- Plan 20 minutes for portraits at golden hour", "Weddings, Photography"),
    post("P-3", "What A Good Anchor Brings To A Corporate Event", "Published", day(-19), "Aditi Shah", "The anchor sets the pace of the whole day. Here's what to look for.", "## Pace\n\nA good anchor keeps sessions on time without rushing speakers.\n\n## Preparation\n\nAsk for a call two days before: names, titles and the run of show.", "Corporate, Anchors"),
    post("P-2", "Sangeet Playlists That Fill The Dance Floor", "Scheduled", day(6), "Dev Patel", "From the family's favourite songs to the last dance.", "Start slow with the classics, then build up.", "Music, Weddings"),
    post("P-1", "Drone Shots: What Is Allowed In Gujarat", "Draft", day(0), "Dev Patel", "Permissions, no-fly zones and what to ask your drone operator.", "Draft.", "Drones"),
  ];

  const subscribers: Subscriber[] = ["riya.mehta@example.com", "karan.joshi@example.com", "pooja.desai@example.com", "vora.events@example.com", "hello@example.com", "new.reader@example.com"].map(
    (email, i) => ({ email, status: i === 5 ? "Pending" : "Confirmed", since: day(-60 + i * 9) }),
  );
  const issues: Issue[] = [{ id: "N-1", subject: "AOD This Month", body: "New artists, two new cities and a look at the wedding season.", sentAt: ago(60 * 24 * 20), count: 5 }];

  const staff: Staff[] = [
    { id: "U-1", name: "Aditi Shah", email: "aditi@example.com", role: "Admin" },
    { id: "U-2", name: "Dev Patel", email: "dev@example.com", role: "Developer" },
  ];

  const messages: Msg[] = [
    { id: "M-1", artist: "ART-201", from: "team", by: "Dev Patel", text: `Your payout for ${ref("Patel Anniversary")} has been sent.`, at: ago(60 * 26) },
    { id: "M-2", artist: "ART-201", from: "artist", text: "Got it, thank you!", at: ago(60 * 25) },
    { id: "M-3", artist: "ART-201", from: "team", by: "Aditi Shah", text: "The Patel family liked your portfolio. Can you confirm their sangeet by tonight?", at: ago(2) },
    { id: "M-4", artist: "ART-205", from: "artist", text: "Can I bring a second camera operator for the Joshi reception?", at: ago(30) },
    { id: "M-5", artist: "ART-207", from: "artist", text: "Accepted the Surat shoot. Is the venue the new tower site?", at: ago(65) },
    { id: "M-6", artist: "ART-202", from: "team", by: "Aditi Shah", text: "The brief for the townhall is in your portal.", at: ago(60 * 48) },
    { id: "M-7", artist: "ART-202", from: "artist", text: "Thanks, I've read it.", at: ago(60 * 47) },
  ];

  const activity: Activity[] = [
    { at: ago(2), text: "Messaged Aman Shah", by: "Aditi Shah" },
    { at: ago(18), text: "Payment PAY-3108 recorded, ₹6,500", by: "Dev Patel" },
    { at: ago(40), text: `New request ${ref("Patel Family")} from the website`, by: "Website" },
    { at: ago(65), text: `Ishaan Dave accepted ${ref("Shreeji Realty")}`, by: "Ishaan Dave" },
    { at: ago(60 * 5), text: "Moved Dev Trivedi to Trial Booking", by: "Aditi Shah" },
  ];

  return {
    bookings,
    artists,
    applications,
    payments: [...payments, ...lastMonth],
    payouts,
    cases,
    posts,
    staff,
    messages,
    activity,
    subscribers,
    issues,
    replies: {
      [ref("Patel Family")]: { "ART-205": "accepted", "ART-207": "accepted" },
      [ref("Shreeji Realty")]: { "ART-207": "accepted" },
      [ref("Galco")]: { "ART-205": "accepted" },
    } as Record<string, Record<string, Reply>>,
    teamRead: { "ART-201": ago(20), "ART-202": ago(60 * 46) } as Record<string, string>,
    artistRead: ago(60),
    profile: {
      name: "Aman Shah",
      craft: "Photographer",
      phone: "5520000000",
      email: "aman.shah@example.com",
      city: "Ahmedabad",
      area: "Navrangpura",
      experience: "3 to 5 Years",
      languages: "Gujarati, Hindi, English",
      about: "Candid wedding and event photographer. I like quiet moments more than posed ones.",
      instagram: "amanshah.shoots",
      website: "",
    } as Profile,
    daysOff: [day(3), day(4), day(18)],
    approval: [
      { label: "Application Sent", date: day(-48) },
      { label: "Portfolio And Background", date: day(-45) },
      { label: "Meeting", date: day(-42) },
      { label: "Trial Booking", date: day(-38) },
      { label: "Approved", date: day(-35) },
    ],
    documents: [
      { title: "Artist Agreement", status: "Signed", date: day(-35) },
      { title: "Identity Check", status: "Verified By AOD", date: day(-36) },
      { title: "Payout Details", status: "Added", date: day(-35) },
    ],
  };
}

// ---------------------------------------------------------------- the browser's copy

type TestOrder = { audience?: string; categories?: string[]; kinds?: string[]; needs?: string; lines?: Line[]; occasion?: string; brief?: string; date?: string; time?: string; endTime?: string; city?: string; venue?: { text?: string; city?: string } | string; details?: string; name?: string; phone?: string; email?: string; at?: string };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// The booking page's test requests, as new orders (with the reference the page showed).
function testOrders(): Booking[] {
  const list = readJson<TestOrder[]>(ORDERS, []);
  return list.map((o, i) => {
    const cats = o.categories?.length ? o.categories : ["photo-video"];
    const at = o.at ? new Date(o.at) : new Date();
    return {
      id: orderId(o.categories ?? [], i + 1, at, o.audience === "business"),
      customer: o.name || "Test Customer",
      phone: o.phone ?? "",
      email: o.email ?? "",
      cats,
      needs: o.needs || (o.kinds?.length ? o.kinds.join(", ") : (o.categories ?? []).map(catName).join(", ")) || "Not Picked",
      date: o.date || dayKey(new Date(at.getTime() + 7 * DAY)),
      start: o.time || "",
      end: o.endTime || "",
      city: (typeof o.venue === "object" ? o.venue?.city || o.venue?.text : o.venue) || o.city || "Not Picked",
      venue: typeof o.venue === "object" ? o.venue?.text : o.venue,
      stage: "new",
      quote: null,
      source: "Test Booking",
      notes: o.details ?? "",
      assigned: [],
      createdAt: at.toISOString(),
      occasion: o.occasion,
      brief: o.brief,
      lines: o.lines?.length ? o.lines : linesFromNeeds(o.needs || cats.map(catName).join(", "), cats),
      shortlist: [],
      history: [{ at: at.toISOString(), text: "Request received", by: "Website" }],
      business: o.audience === "business",
    };
  });
}

// Applications sent from /artists/apply, newest first, waiting for the portfolio review.
function sentApplications(): Application[] {
  return readJson<SentApplication[]>(APPS, [])
    .slice()
    .reverse()
    .map((a) => ({
      id: a.id,
      name: a.name || "New Applicant",
      craft: a.craft || catName(a.cat) || "Artist",
      cat: a.cat,
      city: a.city || "Not Given",
      photo: a.photo || "",
      applied: a.at.slice(0, 10),
      stage: "review" as AppStage,
      email: a.email,
      phone: a.phone,
      experience: a.experience,
      instagram: a.instagram,
      link: a.link,
    }));
}

function build(todayKey: string, patch: Patch, orders: Booking[]) {
  const today = parseDay(todayKey);
  const s = seed(today, Date.now());
  const deleted = new Set(patch.deleted ?? []);
  const bookings = [...orders, ...(patch.bookings ?? []), ...s.bookings]
    .filter((x) => !deleted.has(x.id))
    .map((x) => {
      const lines = patch.lines?.[x.id] ?? x.lines;
      return {
        ...x,
        ...patch.moved?.[x.id],
        stage: patch.stage?.[x.id] ?? x.stage,
        assigned: patch.assigned?.[x.id] ?? x.assigned,
        shortlist: patch.shortlist?.[x.id] ?? x.shortlist,
        quote: patch.quote && x.id in patch.quote ? patch.quote[x.id] : x.quote,
        lines,
        needs: patch.lines?.[x.id] ? needsOf(lines) : x.needs,
        delivery: patch.delivery?.[x.id] ?? x.delivery,
        review: patch.reviews?.[x.id] ?? x.review,
        customerCancelled: patch.customerCancelled?.[x.id] ?? x.customerCancelled,
        history: [...x.history, ...(patch.history?.[x.id] ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
      };
    });
  const replies: Record<string, Record<string, Reply>> = { ...s.replies };
  for (const [k, v] of Object.entries(patch.replies ?? {})) replies[k] = { ...replies[k], ...v };
  return {
    me: ME as string, // the artist the portal shows (live: the signed-in artist or applicant)
    today,
    todayKey,
    bookings,
    replies,
    artists: [...s.artists, ...(patch.artists ?? [])].map((a) => ({ ...a, ...patch.artistEdits?.[a.id], active: !(patch.paused?.[a.id] ?? false) })),
    applications: [...sentApplications(), ...s.applications].map((a) => ({
      ...a,
      stage: patch.appStage?.[a.id] ?? a.stage,
      meetingAt: patch.meetingAt?.[a.id] ?? a.meetingAt,
      submittedAt: patch.submitted?.[a.id],
      details: patch.appDetails?.[a.id],
      photo: patch.appDetails?.[a.id]?.photo || a.photo,
    })),
    payments: [...(patch.payments ?? []), ...s.payments].map((p) => ({ ...p, verified: p.verified || (patch.verified ?? []).includes(p.id) })),
    payouts: [...(patch.payouts ?? []), ...s.payouts].map((p) => ({ ...p, sent: p.sent || (patch.payoutsSent ?? []).includes(p.id) })),
    cases: [...(patch.cases ?? []), ...s.cases].map((c) => ({
      ...c,
      status: patch.caseStatus?.[c.id] ?? c.status,
      notes: [...c.notes, ...(patch.caseNotes?.[c.id] ?? [])],
      decision: patch.caseDecision?.[c.id] ?? c.decision,
    })),
    posts: [...(patch.posts ?? []), ...s.posts].map((p) => ({ ...p, ...patch.postEdits?.[p.id], status: patch.postStatus?.[p.id] ?? patch.postEdits?.[p.id]?.status ?? p.status })),
    subscribers: s.subscribers.filter((x) => !(patch.unsubscribed ?? []).includes(x.email)),
    issues: [...(patch.issues ?? []), ...s.issues],
    staff: [...s.staff, ...(patch.staff ?? [])],
    messages: [...s.messages, ...(patch.messages ?? [])].sort((a, b) => a.at.localeCompare(b.at)),
    teamRead: { ...s.teamRead, ...patch.teamRead },
    artistRead: patch.artistRead ?? s.artistRead,
    settings: Object.fromEntries(settingList.map((x) => [x.id, patch.settings?.[x.id] ?? true])),
    activity: [...(patch.activity ?? []), ...s.activity].sort((a, b) => b.at.localeCompare(a.at)),
    profile: { ...s.profile, ...patch.profile },
    daysOff: patch.daysOff ?? s.daysOff,
    approval: s.approval,
    documents: s.documents,
    sentAt: patch.sentAt,
  };
}

export type Db = ReturnType<typeof build>;

let patchCache: Patch | null = null;
let snap: Db | null = null;
let snapFor = "";
let version = 0;
const listeners = new Set<() => void>();

const readPatch = () => (patchCache ??= readJson<Patch>(KEY, {}));

function getSnapshot(): Db {
  const key = `${dayKey(new Date())}|${version}`;
  if (!snap || snapFor !== key) {
    snap = build(dayKey(new Date()), readPatch(), testOrders());
    snapFor = key;
  }
  return snap;
}

function notify() {
  version++;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === ORDERS || e.key === APPS || e.key === null) {
      patchCache = null;
      notify();
    }
  };
  // The booking page saving a test request in this tab (BookForm.tsx's MOCK_ORDERS_EVENT), or an
  // artist application (APPLICATIONS_EVENT).
  const onLocal = () => {
    patchCache = null;
    notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ORDERS, onLocal);
  window.addEventListener(APPS, onLocal);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ORDERS, onLocal);
    window.removeEventListener(APPS, onLocal);
  };
}

// The data, or null on the server and while the page hydrates (it lives in the browser).
export function useDb(): Db | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

function change(fn: (p: Patch) => Patch, log?: { text: string; by?: string }) {
  let next = fn({ ...readPatch() });
  if (log) next = { ...next, activity: [{ at: new Date().toISOString(), text: log.text, by: log.by ?? STAFF_NAME }, ...(next.activity ?? [])].slice(0, 200) };
  patchCache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage blocked (private window): the change lasts until the page closes.
  }
  notify();
}

// Adds an event to a booking's history inside a change.
function withHistory(p: Patch, id: string, text: string, by = STAFF_NAME): Patch {
  return { ...p, history: { ...p.history, [id]: [...(p.history?.[id] ?? []), { at: new Date().toISOString(), text, by }] } };
}

const db = () => getSnapshot();
const bookingOf = (id: string) => db().bookings.find((b) => b.id === id);
const artistOf = (id: string) => db().artists.find((a) => a.id === id);

// ---------------------------------------------------------------- changes (each one logged)

export const act = {
  setStage(id: string, stage: Stage) {
    change((p) => withHistory({ ...p, stage: { ...p.stage, [id]: stage } }, id, `Moved to ${stageLabel(stage)}`), { text: `Moved ${id} to ${stageLabel(stage)}` });
  },
  setQuote(id: string, quote: number | null) {
    change((p) => withHistory({ ...p, quote: { ...p.quote, [id]: quote } }, id, `Quote ${quote === null ? "removed" : rupees(quote)}`), { text: `Quote for ${id} set to ${quote === null ? "none" : rupees(quote)}` });
  },
  toggleAssign(id: string, artist: string) {
    const b = bookingOf(id);
    if (!b) return;
    const on = b.assigned.includes(artist);
    const assigned = on ? b.assigned.filter((a) => a !== artist) : [...b.assigned, artist];
    change(
      (p) => ({
        ...withHistory(p, id, `${on ? "Removed" : "Assigned"} ${artistOf(artist)?.name}`),
        assigned: { ...p.assigned, [id]: assigned },
        // The first artist moves a new request on to Matched; removing the last moves it back.
        stage: { ...p.stage, [id]: !on && b.stage === "new" ? "matched" : on && !assigned.length && b.stage === "matched" ? "new" : b.stage },
      }),
      { text: `${on ? "Removed" : "Assigned"} ${artistOf(artist)?.name} ${on ? "from" : "to"} ${id}` },
    );
  },
  reply(id: string, artist: string, r: Reply) {
    change((p) => ({ ...p, replies: { ...p.replies, [id]: { ...p.replies?.[id], [artist]: r } } }), { text: `${artistOf(artist)?.name} ${r} ${id}`, by: artistOf(artist)?.name });
  },
  setAppStage(id: string, stage: AppStage) {
    const a = db().applications.find((x) => x.id === id);
    change((p) => ({ ...p, appStage: { ...p.appStage, [id]: stage } }), { text: `Moved ${a?.name} to ${appStageLabel(stage)}` });
  },
  toggleArtist(id: string) {
    const a = artistOf(id);
    change((p) => ({ ...p, paused: { ...p.paused, [id]: !!a?.active } }), { text: `${a?.active ? "Paused" : "Activated"} ${a?.name}` });
  },
  verify(payId: string) {
    const pay = db().payments.find((x) => x.id === payId);
    const b = pay && bookingOf(pay.booking);
    change(
      (p) => ({
        ...p,
        verified: [...(p.verified ?? []), payId],
        // A verified advance confirms a matched order's advance.
        stage: b && pay?.kind === "Advance" && b.stage === "matched" ? { ...p.stage, [b.id]: "advance" } : p.stage,
      }),
      { text: `Verified ${payId}, ${pay ? rupees(pay.amount) : ""}` },
    );
  },
  sendPayout(id: string) {
    change((p) => ({ ...p, payoutsSent: [...(p.payoutsSent ?? []), id] }), { text: `Payout ${id} sent` });
  },
  setCase(id: string, status: CaseStatus) {
    change((p) => ({ ...p, caseStatus: { ...p.caseStatus, [id]: status } }), { text: `Dispute ${id} marked ${caseStatuses.find((c) => c.id === status)?.label}` });
  },
  setPost(id: string, status: PostStatus) {
    change((p) => ({ ...p, postStatus: { ...p.postStatus, [id]: status } }), { text: `Post ${id} set to ${status}` });
  },
  addPost(title: string) {
    const t = title || "Untitled Post";
    const post: Post = { id: `P-${Date.now().toString(36)}`, title: t, status: "Draft", date: dayKey(new Date()), author: STAFF_NAME, slug: slugOf(t), summary: "", body: "", tags: "" };
    change((p) => ({ ...p, posts: [post, ...(p.posts ?? [])] }), { text: `New draft "${post.title}"` });
  },
  send(artist: string, from: "team" | "artist", text: string) {
    const msg: Msg = { id: `M-${Date.now().toString(36)}`, artist, from, by: from === "team" ? STAFF_NAME : undefined, text: text.trim() || "(Empty message)", at: new Date().toISOString() };
    change(
      (p) => ({
        ...p,
        messages: [...(p.messages ?? []), msg],
        ...(from === "team" ? { teamRead: { ...p.teamRead, [artist]: msg.at } } : { artistRead: msg.at }),
      }),
      from === "team" ? { text: `Messaged ${artistOf(artist)?.name}` } : undefined,
    );
  },
  readByTeam(artist: string) {
    change((p) => ({ ...p, teamRead: { ...p.teamRead, [artist]: new Date().toISOString() } }));
  },
  readByArtist() {
    change((p) => ({ ...p, artistRead: new Date().toISOString() }));
  },
  addStaff(name: string, email: string, role: Staff["role"]) {
    const s: Staff = { id: `U-${Date.now().toString(36)}`, name: name || "New Member", email: email || "new@example.com", role };
    change((p) => ({ ...p, staff: [...(p.staff ?? []), s] }), { text: `Added ${s.name} as ${role}` });
  },
  setSetting(id: string, on: boolean) {
    change((p) => ({ ...p, settings: { ...p.settings, [id]: on } }), { text: `${settingList.find((s) => s.id === id)?.label} emails ${on ? "on" : "off"}` });
  },
  saveProfile(profile: Partial<Profile>) {
    change((p) => ({ ...p, profile: { ...p.profile, ...profile } }), { text: "Updated their profile", by: db().profile.name });
  },
  toggleDayOff(day: string) {
    const off = db().daysOff;
    change((p) => ({ ...p, daysOff: off.includes(day) ? off.filter((d) => d !== day) : [...off, day].sort() }));
  },
  sendUpdate() {
    change((p) => ({ ...p, sentAt: new Date().toISOString() }), { text: "Sent a profile update to AOD", by: db().profile.name });
  },
  addBooking(x: { customer: string; phone: string; email: string; cats: string[]; date: string; start: string; end: string; city: string; notes: string; venue?: string; budget?: string; occasion?: string; lines?: Line[] }) {
    const all = db().bookings;
    const n = 40 + all.length + 1;
    const cats = x.cats.length ? x.cats : ["photo-video"];
    const booking: Booking = {
      id: orderId(cats, n),
      customer: x.customer || "New Customer",
      phone: x.phone,
      email: x.email,
      cats,
      needs: x.lines?.length ? needsOf(x.lines) : cats.map(catName).join(", "),
      date: x.date || dayKey(new Date(Date.now() + 7 * DAY)),
      start: x.start,
      end: x.end,
      city: x.city || "Ahmedabad",
      stage: "new",
      quote: null,
      source: "Admin",
      notes: x.notes,
      assigned: [],
      createdAt: new Date().toISOString(),
      venue: x.venue,
      budget: x.budget,
      occasion: x.occasion,
      lines: x.lines?.length ? x.lines : cats.map((c) => ({ category: c, name: catName(c), count: 1 })),
      shortlist: [],
      history: [{ at: new Date().toISOString(), text: "Created by the team", by: STAFF_NAME }],
    };
    change((p) => ({ ...p, bookings: [booking, ...(p.bookings ?? [])] }), { text: `Created ${booking.id} for ${booking.customer}` });
    return booking.id;
  },
  // ---- bookings: lines, shortlist, delivery, reschedule, delete, payments
  setLineCount(id: string, index: number, count: number) {
    const b = bookingOf(id);
    if (!b) return;
    const lines = b.lines.map((l, i) => (i === index ? { ...l, count: Math.max(1, Math.min(20, count)) } : l));
    change((p) => withHistory({ ...p, lines: { ...p.lines, [id]: lines } }, id, `Needed changed: ${needsOf(lines)}`), { text: `${id}: ${needsOf(lines)}` });
  },
  toggleShortlist(id: string, artist: string) {
    const b = bookingOf(id);
    if (!b) return;
    const on = b.shortlist.includes(artist);
    const list = on ? b.shortlist.filter((a) => a !== artist) : [...b.shortlist, artist];
    const name = artistOf(artist)?.name;
    change((p) => withHistory({ ...p, shortlist: { ...p.shortlist, [id]: list } }, id, `${on ? "Removed" : "Shortlisted"} ${name}`), { text: `${on ? "Removed" : "Shortlisted"} ${name} ${on ? "from" : "for"} ${id}` });
  },
  setDelivery(id: string, link: string) {
    change((p) => withHistory({ ...p, delivery: { ...p.delivery, [id]: link } }, id, "Delivery link added"), { text: `Delivery link for ${id}` });
  },
  reschedule(id: string, date: string, start: string, end: string) {
    change((p) => withHistory({ ...p, moved: { ...p.moved, [id]: { date, start, end } } }, id, `Moved to ${date ? shortDate(date) : "a new date"}`), { text: `Rescheduled ${id}` });
  },
  deleteBooking(id: string) {
    change((p) => ({ ...p, deleted: [...(p.deleted ?? []), id] }), { text: `Deleted ${id}` });
  },
  recordPayment(id: string, amount: number, utr: string, kind: Payment["kind"]) {
    const b = bookingOf(id);
    const pay: Payment = { id: `PAY-${3200 + db().payments.length}`, booking: id, customer: b?.customer ?? "", amount: amount || 0, kind, utr: utr || "UTR to add", at: new Date().toISOString(), verified: false };
    change((p) => withHistory({ ...p, payments: [pay, ...(p.payments ?? [])] }, id, `${kind} ${rupees(pay.amount)} recorded`), { text: `Payment ${pay.id} recorded, ${rupees(pay.amount)}` });
  },
  addPayout(booking: string, artist: string, amount: number) {
    const po: Payout = { id: `PO-${600 + db().payouts.length}`, booking, artist, amount, at: new Date().toISOString(), sent: false };
    change((p) => ({ ...p, payouts: [po, ...(p.payouts ?? [])] }), { text: `Payout ${po.id} added for ${artistOf(artist)?.name}, ${rupees(amount)}` });
  },
  // ---- the customer (My Bookings)
  customerCancel(id: string) {
    change((p) => withHistory({ ...p, customerCancelled: { ...p.customerCancelled, [id]: new Date().toISOString() }, stage: { ...p.stage, [id]: "cancelled" } }, id, "Cancelled by the customer", "Customer"), { text: `Customer cancelled ${id}`, by: "Customer" });
  },
  review(id: string, stars: number, text: string) {
    change((p) => withHistory({ ...p, reviews: { ...p.reviews, [id]: { stars, text, at: new Date().toISOString() } } }, id, `Reviewed, ${stars} of 5`, "Customer"), { text: `Review for ${id}: ${stars} of 5`, by: "Customer" });
  },
  // ---- the Dispute Desk
  raiseCase(c: Omit<Case, "id" | "raisedAt" | "status" | "notes">) {
    const id = `DC-${1006 + (readPatch().cases ?? []).length}`;
    const full: Case = { ...c, id, raisedAt: new Date().toISOString(), status: "new", notes: [] };
    change((p) => ({ ...p, cases: [full, ...(p.cases ?? [])] }), { text: `New dispute ${id}: ${c.about}`, by: c.name || "Dispute Desk" });
    return id;
  },
  caseNote(id: string, text: string) {
    const note = { at: new Date().toISOString(), text: text || "(Empty note)", by: STAFF_NAME };
    change((p) => ({ ...p, caseNotes: { ...p.caseNotes, [id]: [...(p.caseNotes?.[id] ?? []), note] } }), { text: `Note on ${id}` });
  },
  caseDecision(id: string, text: string) {
    change((p) => ({ ...p, caseDecision: { ...p.caseDecision, [id]: text } }), { text: `Decision written for ${id}` });
  },
  escalate(id: string) {
    change((p) => ({ ...p, caseStatus: { ...p.caseStatus, [id]: "escalated" } }), { text: `Dispute ${id} escalated`, by: "Customer" });
  },
  // ---- artists and applications
  addArtist(a: Omit<Artist, "id" | "since" | "active">) {
    const id = `ART-${211 + (readPatch().artists ?? []).length}`;
    const artist: Artist = { ...a, id, since: dayKey(new Date()), active: true, photo: a.photo || "" };
    change((p) => ({ ...p, artists: [...(p.artists ?? []), artist] }), { text: `Added artist ${artist.name}` });
    return id;
  },
  editArtist(id: string, edit: Partial<Artist>) {
    change((p) => ({ ...p, artistEdits: { ...p.artistEdits, [id]: { ...p.artistEdits?.[id], ...edit } } }), { text: `Edited ${artistOf(id)?.name}'s profile` });
  },
  setMeeting(id: string, iso: string) {
    const a = db().applications.find((x) => x.id === id);
    change((p) => ({ ...p, meetingAt: { ...p.meetingAt, [id]: iso }, appStage: { ...p.appStage, [id]: "meeting" } }), { text: `Meeting with ${a?.name} set` });
  },
  // Approving makes the applicant an artist, in the same category.
  approve(id: string) {
    const a = db().applications.find((x) => x.id === id);
    if (!a) return;
    const artistId = `ART-${211 + (readPatch().artists ?? []).length}`;
    const artist: Artist = { id: artistId, name: a.name, craft: a.craft, cats: [a.cat], city: a.city, photo: a.photo, email: a.email, phone: a.phone, since: dayKey(new Date()), active: true };
    change((p) => ({ ...p, appStage: { ...p.appStage, [id]: "approved" }, artists: [...(p.artists ?? []), artist] }), { text: `Approved ${a.name}; artist ${artistId} created` });
  },
  saveAppDetails(appId: string, details: AppDetails, name: string) {
    change((p) => ({ ...p, appDetails: { ...p.appDetails, [appId]: { ...p.appDetails?.[appId], ...details } } }), { text: `${name || "An applicant"} completed their profile`, by: name || "Applicant" });
  },
  submitForReview(appId: string, name: string) {
    change((p) => ({ ...p, submitted: { ...p.submitted, [appId]: new Date().toISOString() } }), { text: `${name || "An applicant"} sent their application for review`, by: name || "Applicant" });
  },
  // ---- blog and newsletter
  savePost(id: string, edit: Partial<Post>) {
    change((p) => ({ ...p, postEdits: { ...p.postEdits, [id]: { ...p.postEdits?.[id], ...edit } } }), { text: `Saved post "${edit.title ?? id}"` });
  },
  unsubscribe(email: string) {
    change((p) => ({ ...p, unsubscribed: [...(p.unsubscribed ?? []), email] }), { text: `Unsubscribed ${email}` });
  },
  sendIssue(subject: string, body: string) {
    const count = db().subscribers.filter((x) => x.status === "Confirmed").length;
    const issue: Issue = { id: `N-${Date.now().toString(36)}`, subject: subject || "Untitled Issue", body, sentAt: new Date().toISOString(), count };
    change((p) => ({ ...p, issues: [issue, ...(p.issues ?? [])] }), { text: `Newsletter "${issue.subject}" sent to ${count}` });
  },
  reset() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    patchCache = null;
    notify();
  },
};

// ---------------------------------------------------------------- reading helpers

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const shortDate = (k: string) => parseDay(k).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const longDate = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
export const dayDiff = (k: string, today: Date) => Math.round((parseDay(k).getTime() - today.getTime()) / DAY);

export function ago(iso: string) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 1) return "Just Now";
  if (m < 60) return `${m} Min Ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} Hr Ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d} Days Ago`;
}

// Hours left until `hours` after `iso` (the Dispute Desk's 48-hour reply).
export const hoursLeft = (iso: string, hours: number) => Math.round((new Date(iso).getTime() + hours * 3600_000 - Date.now()) / 3600_000);

export const sameMonth = (iso: string, ref: Date) => {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
};

// Unread counts: an artist's messages the team hasn't opened, and the team's the artist hasn't.
export const teamUnread = (d: Db, artist: string) => d.messages.filter((m) => m.artist === artist && m.from === "artist" && m.at > (d.teamRead[artist] ?? "")).length;
export const artistUnread = (d: Db) => d.messages.filter((m) => m.artist === d.me && m.from === "team" && m.at > d.artistRead).length;

// What the team needs to do, for the sidebar's counts and Needs Attention.
export function counts(d: Db) {
  return {
    newRequests: d.bookings.filter((b) => b.stage === "new").length,
    applications: d.applications.filter((a) => a.stage !== "approved" && a.stage !== "rejected").length,
    toVerify: d.payments.filter((p) => !p.verified).length,
    cases: d.cases.filter((c) => c.status === "new" || c.status === "escalated").length,
    unread: d.artists.reduce((n, a) => n + teamUnread(d, a.id), 0),
  };
}

// The portal artist's view of the orders: requests in their categories, and their own bookings.
export function myOrders(d: Db) {
  const ME = d.me;
  const me = d.artists.find((a) => a.id === ME) ?? { id: ME, cats: [] as string[] };
  const mine = (b: Booking) => b.assigned.includes(ME);
  const fits = (b: Booking) => b.cats.some((c) => me.cats.includes(c));
  const requests = d.bookings
    .filter((b) => !mine(b) && fits(b) && (b.stage === "new" || b.shortlist.includes(ME)) && openStage(b.stage) && b.date >= d.todayKey && d.replies[b.id]?.[ME] !== "declined")
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = d.bookings.filter((b) => mine(b) && openStage(b.stage) && b.date >= d.todayKey).sort((a, b) => a.date.localeCompare(b.date));
  const completed = d.bookings.filter((b) => mine(b) && (b.stage === "completed" || (openStage(b.stage) && b.date < d.todayKey))).sort((a, b) => b.date.localeCompare(a.date));
  const declined = d.bookings.filter((b) => (fits(b) && d.replies[b.id]?.[ME] === "declined") || (mine(b) && b.stage === "cancelled"));
  return { me, requests, upcoming, completed, declined, toAnswer: requests.filter((b) => !d.replies[b.id]?.[ME] && !b.shortlist.includes(ME)) };
}
