// Sample data for the admin panel preview. Made up: no real people, phones or accounts.
// Phone numbers start with 55 (not a valid Indian mobile prefix), emails use example.com and
// portfolio links point to example.com, so nothing here can reach a real person.
// Dates are relative to "now", so the calendar and reminders always look current.

import type { Application, Artist, Booking, BookingStatus, Db, Lead, Member, Newsletter, Payment, Payout, ResolutionCase, Subscriber } from "@/lib/admin-store";
import { samplePosts } from "./blog";
import type { BookingItem } from "@/lib/booking-needs";

export function createSampleDb(now: Date): Db {
  const day = (offset: number, hour = 11) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const iso = (offset: number, hour?: number) => day(offset, hour).toISOString();
  const date = (offset: number) => {
    const d = day(offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const phone = (n: number) => `+91 55${String(100 + n).padStart(3, "0")} ${String(10000 + n * 37).slice(0, 5)}`;
  const email = (name: string) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`;

  const artist = (
    n: number,
    name: string,
    category: string,
    services: string[],
    city: string,
    experience: string,
    languages: string[],
    joined: number,
    extra: Partial<Artist> = {},
  ): Artist => ({
    id: `ART-${200 + n}`,
    name,
    phone: phone(n),
    email: email(name),
    city,
    category,
    otherCategories: [],
    services,
    experience,
    languages,
    joinedAt: iso(joined),
    status: "active",
    kyc: "verified",
    payoutUpi: `${name.split(" ")[0].toLowerCase()}@example`,
    blockedDates: [],
    notes: [],
    ...extra,
  });

  const artists: Artist[] = [
    artist(1, "Aarav Joshi", "photographers", ["Wedding photography", "Candid photography", "Event videography"], "Ahmedabad", "More than 5 years", ["Gujarati", "Hindi", "English"], -320, { otherCategories: ["cinematographers"] }),
    artist(2, "Meera Trivedi", "photographers", ["Pre-wedding shoot", "Portrait session"], "Vadodara", "3–5 years", ["Gujarati", "English"], -210),
    artist(3, "Kabir Mehta", "cinematographers", ["Wedding film", "Corporate film"], "Ahmedabad", "More than 5 years", ["Hindi", "English"], -280),
    artist(4, "Nisha Parmar", "makeup-artists", ["Bridal makeup", "Party makeup"], "Surat", "3–5 years", ["Gujarati", "Hindi"], -150),
    artist(5, "DJ Rohan Bhatt", "musicians-djs", ["Wedding / sangeet DJ", "Corporate party DJ"], "Ahmedabad", "More than 5 years", ["Gujarati", "Hindi", "English"], -400),
    artist(6, "Ishaan Desai", "anchors-hosts", ["Wedding emcee", "Corporate emcee"], "Gandhinagar", "More than 5 years", ["Gujarati", "Hindi", "English"], -190),
    artist(7, "Tara Shah", "singers", ["Garba night vocals", "Wedding live singing"], "Rajkot", "3–5 years", ["Gujarati", "Hindi"], -120, { status: "paused" }),
    artist(8, "Vihaan Rana", "drone-pilots", ["Wedding aerial shots", "Event aerial coverage"], "Ahmedabad", "1–3 years", ["Gujarati", "English"], -90, { kyc: "pending" }),
    artist(9, "Anaya Kapadia", "editors", ["Wedding highlight edit", "Reels & social edit"], "Ahmedabad", "3–5 years", ["English", "Hindi"], -60),
    artist(10, "Dev Solanki", "photographers", ["Event photography", "Product photography"], "Surat", "1–3 years", ["Gujarati", "Hindi"], -45),
    artist(11, "Riddhi Pandya", "models", ["Brand shoot", "Ramp walk"], "Ahmedabad", "1–3 years", ["Gujarati", "English"], -30),
    artist(12, "Yash Chauhan", "comedians", ["Corporate stand-up", "Private party set"], "Vadodara", "3–5 years", ["Gujarati", "Hindi"], -75),
  ];
  artists[0].blockedDates = [date(9), date(10)];
  artists[4].blockedDates = [date(5)];

  const application = (n: number, a: Omit<Application, "id" | "phone" | "email" | "notes" | "kyc" | "otherCategories"> & Partial<Application>): Application => ({
    id: `APP-${1040 + n}`,
    phone: phone(40 + n),
    email: email(a.name),
    kyc: "not_started",
    otherCategories: [],
    notes: [],
    ...a,
  });

  const applications: Application[] = [
    application(1, {
      name: "Sana Qureshi",
      city: "Ahmedabad",
      category: "makeup-artists",
      services: ["Bridal makeup", "Hairstyling"],
      experience: "3–5 years",
      languages: ["Hindi", "Gujarati", "English"],
      bio: "Bridal makeup with a soft, natural finish. I work with airbrush and HD products and travel with an assistant for big weddings.",
      links: ["https://example.com/portfolio/sana-makeup"],
      submittedAt: iso(-1, 9),
      status: "submitted",
    }),
    application(2, {
      name: "Harsh Vyas",
      city: "Vadodara",
      category: "photographers",
      services: ["Wedding photography", "Candid photography"],
      experience: "More than 5 years",
      languages: ["Gujarati", "Hindi"],
      bio: "Candid wedding photographer, two-person team, 60+ weddings covered across central Gujarat.",
      links: ["https://example.com/harshvyas-photos", "https://example.com/videos/harsh-reel"],
      submittedAt: iso(-2, 15),
      status: "review",
      notes: [{ at: iso(-1, 12), by: "Priya (Developer)", text: "Strong low-light work. Ask about second shooter rates." }],
    }),
    application(3, {
      name: "Zoya Mirza",
      city: "Ahmedabad",
      category: "anchors-hosts",
      services: ["Wedding emcee", "Sangeet host"],
      experience: "1–3 years",
      languages: ["Hindi", "English", "Urdu"],
      bio: "Bilingual host for sangeet and reception nights; theatre background.",
      links: ["https://example.com/zoya-hosting"],
      submittedAt: iso(-5, 18),
      status: "meeting",
      meeting: { at: iso(2, 11), place: "AOD office, Ahmedabad" },
    }),
    application(4, {
      name: "Parth Thakkar",
      city: "Surat",
      category: "cinematographers",
      otherCategories: ["drone-pilots", "editors"],
      services: ["Wedding film", "Reels & social video", "Aerial event coverage", "Wedding highlight edit"],
      experience: "3–5 years",
      languages: ["Gujarati", "Hindi"],
      bio: "Wedding films with drone and gimbal; quick turnaround on reels.",
      links: ["https://example.com/parth-films"],
      submittedAt: iso(-12, 10),
      status: "trial",
      kyc: "verified",
      notes: [{ at: iso(-6, 16), by: "Aditya (Admin)", text: "Met in person. Trial booking on the next Surat wedding." }],
    }),
    application(5, {
      name: "Neel Doshi",
      city: "Rajkot",
      category: "musicians-djs",
      services: ["Wedding / sangeet DJ"],
      experience: "Less than 1 year",
      languages: ["Gujarati"],
      bio: "Starting out as a DJ, have my own console and speakers.",
      links: ["https://example.com/neel-mixes"],
      submittedAt: iso(-20, 13),
      status: "rejected",
      notes: [{ at: iso(-15, 11), by: "Priya (Developer)", text: "Not enough event experience yet. Suggested reapplying in 3 months." }],
    }),
    application(6, {
      name: "Kavish Patel",
      city: "Gandhinagar",
      category: "drone-pilots",
      services: ["Event aerial coverage"],
      experience: "1–3 years",
      languages: ["Gujarati", "English"],
      bio: "DGCA-certified drone pilot with my own equipment and insurance.",
      links: ["https://example.com/kavish-aerial"],
      submittedAt: iso(0, 8),
      status: "submitted",
    }),
  ];

  const svc = (category: string, service: string) => ({ category, service });

  // Shorthand for the order's first line: `category` and `service` (from svc()), `artistsNeeded`
  // (default 1) and `artistId` or `artistIds`; `more` adds further lines.
  type SampleBooking = Omit<Booking, "id" | "history" | "notesLog" | "shortlist" | "customer" | "items"> & {
    customer: string;
    shortlist?: string[];
    category: string;
    service: string;
    artistsNeeded?: number;
    artistId?: string;
    artistIds?: string[];
    more?: BookingItem[];
  } & Partial<Omit<Booking, "customer" | "items">>;
  const booking = (n: number, { category, service, artistsNeeded, artistId, artistIds, more = [], ...b }: SampleBooking): Booking => ({
    id: `B-${1200 + n}`,
    history: [{ at: b.createdAt, by: "Website", status: "new" }],
    notesLog: [],
    ...b,
    items: [{ category, service, count: artistsNeeded ?? 1, artistIds: artistIds ?? (artistId ? [artistId] : []) }, ...more],
    shortlist: b.shortlist ?? [],
    customer: { name: b.customer, phone: phone(70 + n), email: email(b.customer) },
  });

  const bookings: Booking[] = [
    booking(1, { createdAt: iso(0, 9), audience: "Personal", customer: "Ritu Agarwal", ...svc("photographers", "Wedding photography"), event: "Wedding", date: date(24), time: "10:00", city: "Ahmedabad", venue: "Party plot, SG Highway", budget: "₹60,000–80,000", notes: "Two days: haldi and wedding.", status: "new", artistsNeeded: 2, brief: { byCategory: { photographers: { style: ["Candid", "Cinematic"], coverage: "More than one day", deliverables: ["Edited photos", "Printed album"], shots: "Family portraits, the varmala" }, "makeup-artists": { looks: ["Bride / groom", "Family members"], people: "2–3", style: "HD / airbrush" } }, preferences: "A female makeup artist", references: "https://www.instagram.com/p/example" }, more: [{ category: "drone-pilots", service: "Wedding flyover package", count: 1, artistIds: [] }, { category: "makeup-artists", service: "Bridal makeup", count: 1, artistIds: [] }] }),
    booking(2, { createdAt: iso(-1, 17), audience: "Business", customer: "Lumen Cafe", ...svc("photographers", "Product photography"), event: "Menu shoot", date: date(6), time: "15:00", city: "Ahmedabad", venue: "Lumen Cafe, Prahlad Nagar", budget: "₹12,000–15,000", notes: "40 dishes, white background and lifestyle.", status: "new" }),
    booking(3, { createdAt: iso(-2, 12), audience: "Personal", customer: "Mohit Jain", ...svc("musicians-djs", "Wedding / sangeet DJ"), event: "Sangeet", date: date(12), time: "19:00", city: "Vadodara", venue: "Banquet hall, Alkapuri", budget: "₹25,000–35,000", notes: "", status: "matched", shortlist: ["ART-205"] }),
    booking(4, { createdAt: iso(-3, 11), audience: "Personal", customer: "Sneha Iyer", ...svc("makeup-artists", "Bridal makeup"), event: "Wedding", date: date(18), time: "06:00", city: "Surat", venue: "Home, Vesu", budget: "₹20,000–30,000", notes: "Bride + mother; trial needed.", status: "quoted", artistId: "ART-204", shortlist: ["ART-204"], quote: 26000 }),
    booking(5, { createdAt: iso(-4, 16), audience: "Personal", customer: "Arjun Malhotra", ...svc("cinematographers", "Wedding film"), event: "Wedding", date: date(9), time: "09:00", city: "Ahmedabad", venue: "Riverfront lawns", budget: "₹80,000–1,20,000", notes: "Teaser within a week.", status: "payment_pending", artistId: "ART-203", shortlist: ["ART-203"], quote: 95000, advance: 30000 }),
    booking(6, { createdAt: iso(-6, 10), audience: "Business", customer: "Northwind Pharma", ...svc("anchors-hosts", "Corporate emcee"), event: "Annual day", date: date(4), time: "18:00", city: "Gandhinagar", venue: "Convention centre", budget: "₹30,000", notes: "Bilingual, 3-hour show.", status: "confirmed", artistId: "ART-206", shortlist: ["ART-206"], quote: 30000, advance: 15000 }),
    booking(7, { createdAt: iso(-9, 13), audience: "Personal", customer: "Pooja Bhatia", ...svc("photographers", "Candid photography"), event: "Engagement", date: date(1), time: "17:00", city: "Ahmedabad", venue: "Hotel ballroom, Ashram Road", budget: "₹50,000–60,000", notes: "Two photographers: one for the stage, one candid.", status: "confirmed", artistsNeeded: 2, artistIds: ["ART-201", "ART-210"], shortlist: ["ART-201", "ART-210"], quote: 56000, advance: 10000 }),
    booking(8, { createdAt: iso(-15, 12), audience: "Personal", customer: "Karan Sethi", ...svc("musicians-djs", "Wedding / sangeet DJ"), event: "Wedding", date: date(-3), time: "20:00", city: "Ahmedabad", venue: "Farmhouse, Bopal", budget: "₹40,000", notes: "", status: "completed", artistId: "ART-205", quote: 38000, advance: 15000 }),
    booking(9, { createdAt: iso(-25, 15), audience: "Personal", customer: "Divya Nair", ...svc("photographers", "Pre-wedding shoot"), event: "Pre-wedding", date: date(-10), time: "07:00", city: "Vadodara", venue: "Laxmi Vilas grounds", budget: "₹22,000", notes: "", status: "delivered", artistId: "ART-202", quote: 22000, advance: 8000, delivery: { link: "https://example.com/drive/divya-prewedding", expires: date(4) } }),
    booking(10, { createdAt: iso(-40, 11), audience: "Business", customer: "Gulmohar Hotels", ...svc("photographers", "Event photography"), event: "Expo booth", date: date(-21), time: "10:00", city: "Gandhinagar", venue: "Exhibition centre", budget: "₹35,000", notes: "Three days of booth coverage.", status: "reviewed", artistId: "ART-210", quote: 34000, advance: 34000, review: { rating: 5, text: "On time every day and the photos were ready the same evening." } }),
    booking(11, { createdAt: iso(-12, 9), audience: "Personal", customer: "Rahul Varma", ...svc("singers", "Garba night vocals"), event: "Navratri night", date: date(-5), time: "21:00", city: "Rajkot", venue: "Society ground", budget: "₹18,000", notes: "", status: "cancelled", artistId: "ART-207", quote: 18000 }),
    booking(12, { createdAt: iso(-8, 14), audience: "Personal", customer: "Ananya Rao", ...svc("comedians", "Private party set"), event: "Birthday", date: date(15), time: "20:30", city: "Vadodara", venue: "Rooftop, Gotri", budget: "₹15,000", notes: "Moved from last week.", status: "rescheduled", artistId: "ART-212", quote: 15000 }),
    booking(13, { createdAt: iso(-1, 20), audience: "Personal", customer: "Farhan Ali", ...svc("drone-pilots", "Wedding aerial shots"), event: "Wedding", date: date(20), time: "16:00", city: "Ahmedabad", venue: "Resort, Thol road", budget: "₹15,000–20,000", notes: "", status: "new" }),
    booking(14, { createdAt: iso(-30, 10), audience: "Personal", customer: "Isha Kulkarni", ...svc("editors", "Wedding highlight edit"), event: "Wedding", date: date(-14), time: "—", city: "Ahmedabad", venue: "Remote", budget: "₹12,000", notes: "Raw footage shared via Drive.", status: "delivered", artistId: "ART-209", quote: 12000, advance: 12000, delivery: { link: "https://example.com/drive/isha-highlights", expires: date(12) } }),
  ];
  // A little history so the timeline isn't empty.
  for (const b of bookings) {
    const order: BookingStatus[] = ["new", "matched", "quoted", "payment_pending", "confirmed", "completed", "delivered", "reviewed"];
    const upTo = order.indexOf(b.status);
    if (upTo > 0) {
      b.history = order.slice(0, upTo + 1).map((status, i) => ({
        at: new Date(new Date(b.createdAt).getTime() + i * 26 * 3600 * 1000).toISOString(),
        by: i === 0 ? "Website" : i % 2 ? "Priya (Developer)" : "Aditya (Admin)",
        status,
      }));
    } else if (b.status === "cancelled" || b.status === "rescheduled") {
      b.history.push({ at: iso(-6, 12), by: "Priya (Developer)", status: b.status });
    }
  }

  const payments: Payment[] = [
    { id: "PAY-3101", bookingId: "B-1205", amount: 30000, utr: "427100583349", payer: "Arjun Malhotra", reportedAt: iso(0, 8), status: "pending" },
    { id: "PAY-3100", bookingId: "B-1206", amount: 15000, utr: "426918220471", payer: "Northwind Pharma", reportedAt: iso(-2, 13), status: "verified", checkedBy: "Neha (Finance)", checkedAt: iso(-2, 17) },
    { id: "PAY-3099", bookingId: "B-1207", amount: 10000, utr: "426855102938", payer: "Pooja Bhatia", reportedAt: iso(-5, 10), status: "verified", checkedBy: "Neha (Finance)", checkedAt: iso(-5, 12) },
    { id: "PAY-3098", bookingId: "B-1208", amount: 15000, utr: "426744019283", payer: "Karan Sethi", reportedAt: iso(-11, 19), status: "verified", checkedBy: "Neha (Finance)", checkedAt: iso(-10, 10) },
    { id: "PAY-3097", bookingId: "B-1209", amount: 8000, utr: "426610938475", payer: "Divya Nair", reportedAt: iso(-20, 9), status: "verified", checkedBy: "Aditya (Admin)", checkedAt: iso(-20, 15) },
    { id: "PAY-3096", bookingId: "B-1204", amount: 13000, utr: "426590012345", payer: "Sneha Iyer", reportedAt: iso(-1, 22), status: "pending" },
    { id: "PAY-3095", bookingId: "B-1211", amount: 5000, utr: "426401118899", payer: "R Varma", reportedAt: iso(-9, 11), status: "rejected", checkedBy: "Neha (Finance)", checkedAt: iso(-9, 16), reason: "No matching credit in the bank statement." },
  ];

  const payouts: Payout[] = [
    { id: "PO-501", artistId: "ART-210", bookingId: "B-1210", amount: 28900, status: "paid", paidAt: iso(-18, 12), reference: "IMPS 6172839" },
    { id: "PO-502", artistId: "ART-202", bookingId: "B-1209", amount: 18700, status: "due" },
    { id: "PO-503", artistId: "ART-209", bookingId: "B-1214", amount: 10200, status: "due" },
    { id: "PO-504", artistId: "ART-205", bookingId: "B-1208", amount: 32300, status: "due" },
  ];

  const lead = (n: number, l: Omit<Lead, "id" | "phone" | "notes"> & Partial<Lead>): Lead => ({ id: `L-${700 + n}`, phone: phone(120 + n), notes: [], ...l });
  const leads: Lead[] = [
    lead(1, { createdAt: iso(0, 10), name: "Hetal Shah", source: "WhatsApp", type: "Personal", need: "Mehendi artist for 40 guests", city: "Ahmedabad", status: "new" }),
    lead(2, { createdAt: iso(-1, 11), name: "Crestline Realty", source: "Business form", type: "Business", need: "Monthly site photography and walkthrough films", city: "Ahmedabad", status: "new" }),
    lead(3, { createdAt: iso(-1, 19), name: "Manav Gohil", source: "Website", type: "Personal", need: "DJ + anchor for a 25th anniversary", city: "Surat", status: "contacted", notes: [{ at: iso(0, 9), by: "Priya (Developer)", text: "Called. Wants quotes by Friday." }] }),
    lead(4, { createdAt: iso(-3, 16), name: "Bloom Events", source: "Instagram", type: "Business", need: "Photographers for 6 weddings this season", city: "Vadodara", status: "contacted" }),
    lead(5, { createdAt: iso(-4, 12), name: "Ritu Agarwal", source: "Website", type: "Personal", need: "Wedding photography, two days", city: "Ahmedabad", status: "converted", bookingId: "B-1201" }),
    lead(6, { createdAt: iso(-6, 15), name: "Sahil Modi", source: "Phone call", type: "Personal", need: "Birthday magician", city: "Rajkot", status: "lost", notes: [{ at: iso(-5, 10), by: "Priya (Developer)", text: "We don't onboard magicians yet." }] }),
    lead(7, { createdAt: iso(-2, 9), name: "Kiran Joshi", source: "Referral", type: "Personal", need: "Pre-wedding shoot in Kutch", city: "Ahmedabad", status: "new" }),
    lead(8, { createdAt: iso(-7, 14), name: "Northwind Pharma", source: "Business form", type: "Business", need: "Annual day emcee", city: "Gandhinagar", status: "converted", bookingId: "B-1206" }),
  ];

  const team: Member[] = [
    { id: "U-1", name: "Aditya (Admin)", email: "owner@example.com", role: "owner", active: true, twoFactor: true, lastActive: iso(0, 10) },
    { id: "U-2", name: "Priya (Developer)", email: "dev@example.com", role: "developer", active: true, twoFactor: true, lastActive: iso(0, 9) },
  ];

  const cases: ResolutionCase[] = [
    {
      id: "DC-1003",
      createdAt: iso(0, 8),
      role: "customer",
      name: "Kavita Shah",
      email: email("Kavita Shah"),
      phone: phone(61),
      bookingRef: "B-1207",
      issue: "Photos or videos not delivered",
      incidentDate: date(-12),
      description: "The wedding film was promised in 10 days. It's been 12 and the photographer isn't answering calls.",
      outcome: "The photos or videos delivered",
      evidence: [],
      status: "received",
      history: [{ at: iso(0, 8), by: "Website", status: "received" }],
      notes: [],
    },
    {
      id: "DC-1002",
      createdAt: iso(-2, 15),
      role: "artist",
      name: "Rohan Bhatt",
      email: email("Rohan Bhatt"),
      phone: phone(62),
      bookingRef: "B-1196",
      issue: "Unpaid or delayed payment",
      incidentDate: date(-9),
      description: "The client approved two extra hours at the sangeet on the 3rd but won't pay the ₹4,000 for them.",
      outcome: "Payment for the extra work",
      evidence: ["https://example.com/chat-screenshot"],
      status: "investigating",
      history: [
        { at: iso(-2, 15), by: "Website", status: "received" },
        { at: iso(-1, 10), by: "Priya (Developer)", status: "acknowledged" },
        { at: iso(-1, 16), by: "Priya (Developer)", status: "investigating" },
      ],
      notes: [{ at: iso(-1, 16), by: "Priya (Developer)", text: "Checking the overtime the customer approved on the day." }],
    },
    {
      id: "DC-1001",
      createdAt: iso(-11, 11),
      role: "customer",
      name: "Imran Qureshi",
      email: email("Imran Qureshi"),
      phone: phone(63),
      bookingRef: "B-1188",
      issue: "Artist arrived late or left early",
      incidentDate: date(-14),
      description: "The anchor arrived 90 minutes late for the reception.",
      outcome: "A refund (full or part)",
      evidence: [],
      status: "resolved",
      resolution: "AOD refunded ₹3,000 (a third of the fee) on the 2nd. The artist has been warned.",
      history: [
        { at: iso(-11, 11), by: "Website", status: "received" },
        { at: iso(-10, 9), by: "Priya (Developer)", status: "acknowledged" },
        { at: iso(-8, 12), by: "Aditya (Admin)", status: "resolved" },
      ],
      notes: [],
    },
  ];

  // Newsletter sign-ups (example.com addresses, so nothing reaches a real person) and one sent issue.
  const subscribers: Subscriber[] = [
    { id: "S-104", email: email("Meera Joshi"), status: "pending", source: "/blog", createdAt: iso(0, 9) },
    { id: "S-103", email: email("Kunal Mehta"), status: "subscribed", source: "/", createdAt: iso(-3, 18), confirmedAt: iso(-3, 18) },
    { id: "S-102", email: email("Sana Khan"), status: "subscribed", source: "/blog/how-to-choose-a-wedding-photographer", createdAt: iso(-6, 11), confirmedAt: iso(-6, 12) },
    { id: "S-101", email: email("Dev Patel"), status: "unsubscribed", source: "/", createdAt: iso(-20, 15), confirmedAt: iso(-20, 15), unsubscribedAt: iso(-4, 9) },
  ];
  const newsletters: Newsletter[] = [
    {
      id: "N-101",
      subject: "Wedding season is here: 7 questions to ask your photographer",
      body: [
        "Hi there,",
        "Wedding season is here, so we've written down the questions we ask photographers on your behalf.",
        "[Read: How to choose a wedding photographer](/blog/how-to-choose-a-wedding-photographer)",
        "– Team AOD",
      ].join("\n\n"),
      status: "sent",
      createdAt: iso(-2, 10),
      sentAt: iso(-2, 11),
      sentBy: "Aditya (Admin)",
      recipients: 2,
    },
  ];

  return {
    version: 1,
    applications,
    artists,
    bookings,
    payments,
    payouts,
    leads,
    cases,
    posts: samplePosts,
    subscribers,
    newsletters,
    team,
    activity: [
      { id: "ACT-3", at: iso(-1, 12), by: "Priya (Developer)", area: "Applications", text: "Added a note to Harsh Vyas", target: "APP-1042" },
      { id: "ACT-2", at: iso(-2, 17), by: "Neha (Finance)", area: "Payments", text: "Verified ₹15,000 from Northwind Pharma", target: "PAY-3100" },
      { id: "ACT-1", at: iso(-3, 10), by: "Aditya (Admin)", area: "Bookings", text: "Sent the quote for B-1204", target: "B-1204" },
    ],
    settings: {
      commissionPct: 15,
      paymentHoldHours: 48,
      deliveryLinkDays: 30,
      advancePct: 30,
      notify: {
        "New booking request": true,
        "Artist replied to a request": true,
        "Customer cancelled a booking": true,
        "New resolution case": true,
        "New artist application": true,
        "Event tomorrow": true,
        "Delivery link expiring": true,
        "Daily summary email": false,
      },
    },
  };
}
