// All copy for the site, taken from the old aod.co.in so it can be reviewed and edited in one place.
//
// NEEDS REVIEW before launch: ratings, booking counts, artist counts and the
// "escrowed payments" claim are carried over from the old site as sample data.
// Replace them with real numbers from Supabase, or remove them (see CLAUDE.md).

export const brand = {
  name: "AOD",
  fullName: "Artists on Demand",
  region: "Gujarat",
  city: "Ahmedabad",
  tagline: "Artists at your fingertips — book a verified artist as easily as you book a cab.",
  phoneDisplay: "+91 92747 39763",
  phoneHref: "tel:+919274739763",
  email: "communication.aod@gmail.com",
  // Opens Gmail's compose window in the browser, addressed to AOD.
  gmailComposeUrl: (subject: string) =>
    `https://mail.google.com/mail/?view=cm&fs=1&to=communication.aod@gmail.com&su=${encodeURIComponent(subject)}`,
  instagramHandle: "@artistsondemand.in",
  instagramUrl: "https://www.instagram.com/artistsondemand.in/",
  // AOD's LinkedIn company page (the footer icon hides if this is empty).
  linkedinUrl: "https://www.linkedin.com/company/artists-on-demand-pvt-ltd/",
  domain: "aod.co.in",
};

export const cities = ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara", "Rajkot"];

export type IconName =
  | "camera"
  | "video"
  | "drone"
  | "mic"
  | "film"
  | "music"
  | "ticket"
  | "mic-vocal"
  | "brush"
  | "sparkles";

export type Service = {
  name: string;
  rating: number; // sample data — see note at top
  bookings: number; // sample data — see note at top
  popular?: boolean;
};

export type Category = {
  slug: string;
  name: string;
  singular: string;
  icon: IconName;
  short: string;
  description: string;
  services: Service[];
  keywords: string[]; // other words people search with, e.g. "dj", "mua", "camera"
};

export const categories: Category[] = [
  {
    slug: "photographers",
    name: "Photographers",
    singular: "Photographer",
    icon: "camera",
    keywords: ["photo", "photography", "photographer", "photoshoot", "camera", "pics", "pictures", "candid", "shoot"],
    short: "Weddings, events, portraits & product shoots",
    description:
      "Verified photographers with reviewed portfolios — from candid wedding coverage to crisp product catalogues. Portfolio-reviewed, no negotiation.",
    services: [
      { name: "Wedding photography", rating: 4.9, bookings: 214, popular: true },
      { name: "Candid photography", rating: 4.88, bookings: 178, popular: true },
      { name: "Pre-wedding shoot", rating: 4.86, bookings: 132 },
      { name: "Event photography", rating: 4.84, bookings: 246, popular: true },
      { name: "Product photography", rating: 4.82, bookings: 97 },
      { name: "Portrait session", rating: 4.9, bookings: 84 },
    ],
  },
  {
    slug: "cinematographers",
    name: "Cinematographers",
    singular: "Cinematographer",
    icon: "video",
    keywords: ["video", "videography", "videographer", "cinematography", "film", "filmmaker", "movie", "shoot", "reels", "camera"],
    short: "Wedding films, corporate videos & reels",
    description:
      "Cinematic wedding films, corporate AVs and social-first reels — shot and delivered on time by verified professionals.",
    services: [
      { name: "Wedding film", rating: 4.9, bookings: 156, popular: true },
      { name: "Corporate film", rating: 4.85, bookings: 88 },
      { name: "Event videography", rating: 4.86, bookings: 121, popular: true },
      { name: "Reels & social video", rating: 4.88, bookings: 143, popular: true },
    ],
  },
  {
    slug: "drone-pilots",
    name: "Drone Pilots",
    singular: "Drone Pilot",
    icon: "drone",
    keywords: ["drone", "aerial", "fpv", "uav", "flyover"],
    short: "Licensed aerial photo & film coverage",
    description:
      "DGCA-compliant drone pilots for aerial wedding shots, real-estate walkthroughs and event flyovers. Equipment included.",
    services: [
      { name: "Aerial event coverage", rating: 4.87, bookings: 64, popular: true },
      { name: "Real-estate aerials", rating: 4.85, bookings: 41 },
      { name: "Wedding flyover package", rating: 4.9, bookings: 77, popular: true },
    ],
  },
  {
    slug: "anchors-hosts",
    name: "Anchors & Hosts",
    singular: "Anchor / Host",
    icon: "mic",
    keywords: ["anchor", "host", "emcee", "mc", "compere", "presenter"],
    short: "Emcees for weddings, corporate & expos",
    description:
      "Bilingual anchors and emcees who keep your event moving — sangeets, award nights, product launches and exhibition booths.",
    services: [
      { name: "Wedding / sangeet anchoring", rating: 4.89, bookings: 118, popular: true },
      { name: "Corporate emcee", rating: 4.87, bookings: 92, popular: true },
      { name: "Expo booth host", rating: 4.83, bookings: 57 },
    ],
  },
  {
    slug: "editors",
    name: "Editors",
    singular: "Editor",
    icon: "film",
    keywords: ["editing", "editor", "edit", "post production", "retouch", "album", "colour grading", "color grading"],
    short: "Photo, film & reel post-production",
    description:
      "Fast, reliable post-production — wedding albums, highlight films, reels and colour grading with express delivery add-ons.",
    services: [
      { name: "Wedding highlight edit", rating: 4.86, bookings: 73, popular: true },
      { name: "Reel editing (pack of 5)", rating: 4.88, bookings: 96, popular: true },
      { name: "Album design & retouch", rating: 4.84, bookings: 52 },
    ],
  },
  {
    slug: "musicians-djs",
    name: "Musicians & DJs",
    singular: "Musician / DJ",
    icon: "music",
    keywords: ["dj", "deejay", "music", "musician", "band", "live music", "instrumentalist", "dance"],
    short: "Live bands, instrumentalists & party DJs",
    description:
      "From soulful live sets to packed dance floors — verified musicians and DJs with their own equipment, ready for any stage.",
    services: [
      { name: "Wedding / sangeet DJ", rating: 4.88, bookings: 134, popular: true },
      { name: "Live acoustic set", rating: 4.9, bookings: 87, popular: true },
      { name: "Corporate party DJ", rating: 4.85, bookings: 66 },
    ],
  },
  {
    slug: "comedians",
    name: "Stand-up Comedians",
    singular: "Comedian",
    icon: "ticket",
    keywords: ["comedy", "comedian", "stand up", "standup", "comic", "humour", "humor"],
    short: "Corporate shows & private gigs",
    description:
      "Clean corporate sets or no-holds-barred private shows — verified comics with real stage time.",
    services: [
      { name: "Corporate comedy show", rating: 4.87, bookings: 48, popular: true },
      { name: "Private party set", rating: 4.85, bookings: 39 },
    ],
  },
  {
    slug: "singers",
    name: "Singers & Vocalists",
    singular: "Singer",
    icon: "mic-vocal",
    keywords: ["singer", "singing", "vocalist", "vocals", "sufi", "ghazal", "garba", "bollywood"],
    short: "Playback, sufi, garba & live vocals",
    description:
      "Wedding sangeets, sufi nights, garba evenings and corporate galas — vocalists with verified live-performance experience.",
    services: [
      { name: "Sangeet live vocals", rating: 4.9, bookings: 91, popular: true },
      { name: "Sufi / ghazal night", rating: 4.88, bookings: 63 },
      { name: "Garba night vocals", rating: 4.92, bookings: 104, popular: true },
    ],
  },
  {
    slug: "makeup-artists",
    name: "Makeup Artists",
    singular: "Makeup Artist",
    icon: "brush",
    keywords: ["makeup", "make up", "mua", "beautician", "bridal", "hair", "hairstyle", "beauty"],
    short: "Bridal, party & editorial looks",
    description:
      "HD bridal, party glam and editorial looks — kit-verified artists who arrive on time with everything they need.",
    services: [
      { name: "Bridal makeup", rating: 4.91, bookings: 167, popular: true },
      { name: "Party makeup", rating: 4.87, bookings: 203, popular: true },
      { name: "Editorial / shoot makeup", rating: 4.86, bookings: 71 },
      { name: "Hair styling add-on", rating: 4.84, bookings: 89 },
    ],
  },
  {
    slug: "models",
    name: "Models",
    singular: "Model",
    icon: "sparkles",
    keywords: ["model", "modelling", "modeling", "ramp", "fashion", "promoter"],
    short: "Brand shoots, ramp & promotions",
    description:
      "Portfolio-verified models for product campaigns, ramp shows, showroom launches and promotional events.",
    services: [
      { name: "Brand / product shoot", rating: 4.85, bookings: 58, popular: true },
      { name: "Ramp / fashion show", rating: 4.88, bookings: 43 },
      { name: "Promotional event", rating: 4.82, bookings: 67 },
    ],
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// "Most booked services" on the old homepage, in its original order.
export const mostBooked: { service: string; category: string }[] = [
  { service: "Event photography", category: "photographers" },
  { service: "Wedding photography", category: "photographers" },
  { service: "Party makeup", category: "makeup-artists" },
  { service: "Candid photography", category: "photographers" },
  { service: "Bridal makeup", category: "makeup-artists" },
  { service: "Wedding film", category: "cinematographers" },
];

// Sample data — see note at top.
export const stats = [
  // `visual` picks the small graphic under the number (drawn in src/components/home/Stats.tsx).
  { value: "150+", label: "verified artists", visual: "artists" },
  { value: "4.9", label: "average rating", visual: "stars" },
  { value: "10", label: "talent categories", visual: "categories" },
  { value: "Zero", label: "negotiation drama", visual: "handshake" },
] as const;

// Brands that trust AOD, shown in the scrolling strip under the stats ("Trusted by renowned brands").
// Logos live in public/brands/: cut out of their backgrounds, cropped tight, 160–240px tall.
// `width` / `height` are the image's real pixel size (the strip uses them for the shape).
export const clientBrands = [
  { name: "Aluminium Bharat", logo: "/brands/aluminium-bharat-logo.png", width: 1955, height: 251 },
  { name: "ATOA Technologies", logo: "/brands/atoa-technologies.png", width: 491, height: 160 },
  { name: "Meraki", logo: "/brands/meraki.png", width: 280, height: 160 },
  { name: "GTZ", logo: "/brands/gtz.png", width: 219, height: 160 },
  { name: "Lalaji", logo: "/brands/lalaji.png", width: 269, height: 160 },
  { name: "HI Interior Hardware", logo: "/brands/hi-interior-hardware.png", width: 181, height: 160 },
  { name: "Ralco Extrusion", logo: "/brands/ralco-extrusion.png", width: 276, height: 160 },
  { name: "Saru Aikoh Chemicals", logo: "/brands/saru-aikoh-chemicals-logo.png", width: 714, height: 240 },
  { name: "MMR Mayur Group", logo: "/brands/mmr-mayur-group.png", width: 195, height: 160 },
  { name: "Swastik Furnaces", logo: "/brands/swastik-furnaces.png", width: 246, height: 160 },
  { name: "FCT Surface Innovators", logo: "/brands/fct.png", width: 359, height: 160 },
  { name: "Galco", logo: "/brands/galco.png", width: 468, height: 160 },
  { name: "Power Hydrotech", logo: "/brands/power-hydrotech-logo.png", width: 910, height: 240 },
  { name: "Ayodhya", logo: "/brands/ayodhya-logo.png", width: 353, height: 240 },
  { name: "Shree Ramji Buildcon Group", logo: "/brands/shree-ramji-logo.png", width: 330, height: 240 },
];

export const guarantees = [
  { icon: "tag", label: "Transparent upfront quotes" },
  { icon: "lock", label: "Escrowed payments" }, // not built yet — see note at top
  { icon: "refresh", label: "Replacement guarantee" },
  { icon: "signature", label: "Digital contract on every booking" },
] as const;

export const hero = {
  eyebrow: "Artists On Demand",
  // Each entry is shown on its own line.
  subtitle: ["Get yours now or browse categories", "and find your perfect match."],
  primaryCta: "Get yours now",
  secondaryCta: "Browse categories",
  searchPlaceholder: "Search for 'wedding photographer'",
  // Animated walk-through of a booking shown beside the headline. Illustrative steps, not real customers.
  demo: [
    { icon: "camera", title: "Request sent", text: "Wedding photographer · Surat · 14 Oct" },
    { icon: "sparkles", title: "Curated matches ready", text: "Verified, with clear quotes" },
    { icon: "signature", title: "Booking confirmed", text: "Digital contract shared on WhatsApp" },
  ],
};

// Booking features shown on the homepage. Cancellation, rescheduling and meeting the artist
// (customers can meet their artist before booking) are new promises for the relaunch —
// confirm the exact policy before launch.
export const features = [
  {
    icon: "calendar-x",
    title: "Last-minute cancellation",
    text: "Plans change. Cancel your booking even at the last moment.",
  },
  {
    icon: "calendar-sync",
    title: "Reschedule to another day",
    text: "Event date moved? Shift your booking to another day instead of losing it.",
  },
  {
    icon: "handshake",
    title: "Meet the artist in person",
    text: "Not sure yet? Meet them, see their work and get to know their art before you book.",
  },
  {
    icon: "refresh",
    title: "Replacement guarantee",
    text: "If an artist cancels, AOD sends a verified substitute — you are never stranded.",
  },
  {
    icon: "tag",
    title: "Transparent quotes",
    text: "One clear quote per curated match — no haggling, no surprises.",
  },
  {
    icon: "signature",
    title: "Digital contract",
    text: "Every booking comes with a digital contract, so everyone knows what's agreed.",
  },
] as const;

// Occasion choices for the "get matched" questions, per kind of booking.
export const occasions = {
  personal: [
    { label: "Wedding / sangeet", icon: "heart" },
    { label: "Pre-wedding shoot", icon: "camera" },
    { label: "Party / private event", icon: "party" },
    { label: "Garba / festive night", icon: "music" },
    { label: "Portrait / personal shoot", icon: "user" },
    { label: "Something else", icon: "question" },
  ],
  business: [
    { label: "Corporate event", icon: "briefcase" },
    { label: "Expo / exhibition", icon: "store" },
    { label: "Brand / product shoot", icon: "camera" },
    { label: "Hotel / café content", icon: "hotel" },
    { label: "Product launch", icon: "rocket" },
    { label: "Something else", icon: "question" },
  ],
  any: [
    { label: "Wedding / sangeet", icon: "heart" },
    { label: "Party / private event", icon: "party" },
    { label: "Corporate event", icon: "briefcase" },
    { label: "Expo / exhibition", icon: "store" },
    { label: "Brand / product shoot", icon: "camera" },
    { label: "Something else", icon: "question" },
  ],
} as const;

export type Audience = "personal" | "business";

// The choosing screen at /book.
export const bookingChoice = {
  title: "How are you booking?",
  subtitle: "Pick one — we'll ask a few quick questions and send curated matches.",
  personal: {
    label: "For personal events",
    text: "Weddings, sangeets, parties, pre-wedding and portrait shoots.",
  },
  business: {
    label: "For business",
    text: "Corporate events, expos, brand shoots and recurring content on contract.",
  },
};

// Trust message shown on the homepage, booking and category pages: every artist is verified.
export const verifiedArtists = {
  short: "Every AOD artist has been verified thoroughly",
  title: "Only thoroughly verified artists.",
  text: "We don't list strangers. Every artist on AOD is checked by our team, from their portfolio and past work to their background and references, before they're ever sent to your event.",
  points: [
    "Portfolio and past work reviewed",
    "Background and references checked",
    "Trial booking before going live",
  ],
};

// Artists join over WhatsApp until the online registration system is built.
export const artistJoinMessage = "Hi Artists on Demand! I am an artist and I want to join AOD.";

export const howItWorks = {
  clients: [
    { title: "Tell us your need", text: "Event type, date, details — takes 2 minutes." },
    {
      title: "Get curated matches",
      text: "Verified artists with clear quotes. No scrolling through 500 profiles.",
    },
    { title: "Book & relax", text: "Secure payment, digital contract, on-time delivery." },
  ],
  // Joining AOD: every artist is verified before going live.
  artists: [
    {
      title: "Apply with your work",
      text: "Share your portfolio, links and experience online. Our team reviews every application.",
    },
    {
      title: "Portfolio & background check",
      text: "Our creative team reviews your style and quality, and verifies your identity and references.",
    },
    {
      title: "Trial booking & go live",
      text: "One supervised booking to confirm professionalism and punctuality — then the bookings start coming.",
    },
  ],
  replacement:
    "Replacement guarantee: if an artist cancels, AOD sends a verified substitute — you are never stranded.",
};

export const differentiators = {
  title: ["Others hand you a long list.", "We deliver the curated match."],
  items: [
    {
      title: "Instant booking",
      text: "Request to confirmed in minutes — not the industry-average 72 hours.",
    },
    {
      title: "Verified professionals",
      text: "Portfolio review, background checks and trial shoots before anyone goes live.",
    },
    {
      title: "Transparent quotes",
      text: "One clear quote per curated match — no haggling, no surprises. The price you agree is the price you pay.",
    },
  ],
};

export const bookingOptions = {
  personal: {
    name: "Personal events",
    audience: "Weddings, sangeets, parties and one-off shoots",
    text: "Photographers, DJs, anchors, makeup artists & more — booked as easily as a cab.",
    includesLabel: "Every booking includes:",
    features: [
      "Curated matches — verified artists with clear quotes",
      "Transparent upfront quotes — no haggling, no surprises",
      "Escrowed payments — released after delivery",
      "Replacement guarantee — never stranded if an artist cancels",
      "Last-minute cancellation or reschedule to another day",
      "Meet the artist in person before you book",
      "Digital contract on every booking",
    ],
    cta: "Get yours now",
  },
  business: {
    name: "AOD for Business",
    audience: "Hotels, cafés, agencies, corporates and expos",
    text: "Product catalogues, event coverage, brand films and expo visuals — delivered by verified talent under one contract, one invoice, one point of contact.",
    includesLabel: "Everything in personal, plus:",
    features: [
      "Digital contracts on every engagement",
      "Transparent quotes upfront — budget approvals without surprises",
      "Dedicated account manager and single point of contact",
      "Priority replacement guarantee — coverage never falls through",
      "Retainers, multi-day contracts and one-off projects",
    ],
    cta: "Book for business",
  },
};

export const business = {
  eyebrow: "AOD for Business",
  title: "One partner for every shoot.",
  subtitle: bookingOptions.business.text,
  segments: [
    {
      title: "Hotels, cafés & agencies",
      text: "Monthly content shoots on retainer — food, interiors, events and social reels, delivered on a fixed calendar.",
    },
    {
      title: "Corporates & pharma",
      text: "Annual contracts for town halls, conferences, leadership shoots and product launches across locations.",
    },
    {
      title: "Expos & exhibitions",
      text: "Official visual-partner coverage: booth photography, walkthrough films and same-day social edits.",
    },
  ],
  whyTitle: "Why procurement teams like us",
  why: [
    "Digital contracts on every engagement",
    "Transparent quotes upfront — budget approvals without surprises",
    "Dedicated account manager and single point of contact",
    "Priority replacement guarantee — coverage never falls through",
    "Escrowed payments released only after delivery",
  ],
  caseStudy: {
    label: "GATE Expo — Official Visual Partner",
    text: "AOD delivered end-to-end visual coverage as official partner.",
  },
  ctaTitle: "Put your shoots on autopilot",
  ctaText: "Tell us your annual creative calendar — we'll come back with a contract proposal in 48 hours.",
};

// The About us page (/about).
export const about = {
  eyebrow: "About AOD",
  title: "Artists, on demand.",
  intro:
    "Artists on Demand (AOD) is an Ahmedabad company that makes booking event talent as easy as booking a cab. Photographers, cinematographers, DJs, anchors, makeup artists and more — verified, matched to your event and booked with one clear quote.",
  storyTitle: "Why we started AOD",
  story: [
    "Finding the right artist for a wedding, a launch or a shoot usually means scrolling through hundreds of profiles, chasing replies, haggling over prices and hoping they turn up on the day.",
    "We started AOD to take that guesswork away. You tell us what you need, and we send curated matches: artists we have verified, with clear quotes and a digital contract on every booking.",
    "For artists, AOD means the right bookings at the right rate, with zero joining fees and a team that handles the back-and-forth.",
  ],
  valuesTitle: "What we stand for",
  values: [
    { title: "Verified, not just listed", text: "Portfolio review, background checks and a trial booking before any artist goes live." },
    { title: "One clear price", text: "One clear quote per curated match. The price you agree is the price you pay." },
    { title: "Never stranded", text: "If an artist cancels, we send a verified substitute." },
    { title: "Fair to artists", text: "Zero joining fees, and bookings that suit each artist's craft and rate." },
  ],
  // Names and titles from the founders' public eChai listings — confirm before launch, and add photos.
  teamTitle: "The people behind AOD",
  team: [
    { name: "Vaibhav Patel", role: "Co-founder & CEO" },
    { name: "Dhruvi Thakkar", role: "Co-founder" },
  ],
  contactTitle: "Talk to us",
  contactText: "Questions, partnerships or press — reach the AOD team directly.",
};

export const forArtists = {
  eyebrow: "For artists",
  title: "Join as an artist with AOD.",
  subtitle:
    "Your talent and potential, put in the right place at the right rate. We bring you real bookings — weddings, corporate events, expos — so you can focus on your art.",
  note: "Zero joining fees · Every artist is verified before going live",
  cta: "Join AOD",
  // The artist portal (/artists, later artists.aod.co.in) is reached only from this page.
  applyCta: "Apply online",
  signInText: "Already with AOD?",
  signInCta: "Sign in to the artist portal",
  whyTitle: "Your talent deserves the right stage",
  why: [
    {
      title: "Your talent, in the right place",
      text: "We match you to events that fit your style, so your skills are used where they count.",
    },
    {
      title: "A fair rate for your work",
      text: "Clear quotes agreed upfront. No undercutting, no haggling — you're paid what your work is worth.",
    },
    {
      title: "Steady work",
      text: "Weddings, corporate contracts and expo coverage — regular bookings across Gujarat.",
    },
    {
      title: "Grow your potential",
      text: "A verified badge, reviews and a portfolio that grows with every booking you deliver.",
    },
  ],
  meetTitle: "We verify every artist thoroughly",
  meetText:
    "No one joins AOD from a form alone. Our team reviews your work, checks your background and references, and runs a trial booking — so clients know exactly who is walking into their event.",
  verificationTitle: "How joining works",
  verificationIntro: "Three steps, starting with your application. Once you're through, you appear in curated matches and category listings.",
  ctaTitle: "Ready to put your talent to work?",
  ctaText: "Apply in a few minutes. Our team reviews every application.",
  ctaNote: "Zero joining fees — we only earn when you do.",
};

export const finalCta = {
  title: ["stop hunting.", "start booking."],
  text: "Tell us what you need — we'll send curated matches.",
};
