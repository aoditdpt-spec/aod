// Copy and sample data for the artist portal: served at /artists for now, and on
// artists.aod.co.in once that domain points here (see src/proxy.ts).
//
// PREVIEW: there is no backend yet. Sign-in, uploads, verification and submitting do not
// save or send anything. The sample artist, booking requests and statuses below are made up
// to show how the portal will work, and every portal page says so. Replace them with
// Supabase data when the backend is built.

import { siteUrl } from "@/lib/site-url";

// The customer site, for "back" links. On the artists domain "/" is the portal itself, so this
// is the full address (src/lib/site-url.ts).
export const mainSiteUrl = siteUrl;

export const portal = {
  name: "AOD for Artists",
  host: "artists.aod.co.in",
  signIn: {
    title: "Your bookings, profile and portfolio, in one place.",
    subtitle: "Sign in with the phone number you joined AOD with. We'll send a one-time code on WhatsApp.",
    // With the backend on, codes go by email (WhatsApp codes need the WhatsApp Business API).
    subtitleLive: "Sign in with the email you applied with. AOD sends you a 6-digit code.",
    points: [
      "Reply to booking requests with your quote",
      "Keep your portfolio and availability up to date",
      "Track your onboarding, from application to going live",
    ],
  },
  apply: {
    title: "Apply to join AOD",
    subtitle: "Takes about 10 minutes. Have a few of your best photos or videos and your portfolio links ready.",
  },
};

export const languages = ["Gujarati", "Hindi", "English", "Marathi", "Punjabi", "Urdu", "Bengali", "Tamil"];

export const experienceLevels = ["Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"];

// "Your work details": a step of the application with questions for the applicant's category.
// Every question is required. Answers are saved by question id in `applications.details`, and the
// admin shows them with each question's `short` label.
export type WorkQuestion = {
  id: string;
  label: string;
  short: string; // the label in the review step and the admin
  kind: "one" | "many" | "text";
  options?: string[];
  hint?: string;
};

const yesNo = ["Yes", "No"];
const one = (id: string, label: string, short: string, options = yesNo): WorkQuestion => ({ id, label, short, kind: "one", options });
const many = (id: string, label: string, short: string, options: string[]): WorkQuestion => ({ id, label, short, kind: "many", options, hint: "Pick all that apply." });
const typed = (id: string, label: string, short: string, hint: string): WorkQuestion => ({ id, label, short, kind: "text", hint });

const levels = ["Full-time Professional", "Freelance", "Part-time", "Student / Beginner"];
const level = (who: string) => one("level", `Are you a professional ${who}?`, "Works as", levels);
const travel = (what: string) => one("travel", `Are you willing to travel to other cities for ${what} if required?`, "Travels to other cities");
const brandWork = one("brandWork", "Have you worked with brands, artists or events before?", "Worked with brands");
const camera = (who: string, what: string, specialisations: string[]): WorkQuestion[] => [
  level(who),
  many("specialisations", `Your ${what} specialisation`, "Specialisation", specialisations),
  one("editor", "Are you an editor as well, or do you have an editor with you?", "Edits / has an editor"),
  travel("shoots"),
  many("equipment", "Equipment you use", "Equipment", ["DSLR", "Mirrorless", "Gimbal", "Drone", "Studio lights"]),
  typed("cameraBrand", "Camera brand", "Camera brand", "E.g. Sony, Canon, Nikon, Fujifilm."),
  brandWork,
];
const shootTypes = ["Wedding", "Pre-wedding", "Fashion", "Portrait", "Product", "Event", "Corporate", "Lifestyle", "Travel", "Creative / Cinematic", "Other"];

export const workQuestions: Record<string, WorkQuestion[]> = {
  photographers: camera("photographer", "photography", shootTypes),
  cinematographers: camera("cinematographer", "cinematography", shootTypes),
  "drone-pilots": [
    level("drone pilot"),
    many("specialisations", "What do you fly for?", "Specialisation", ["Wedding", "Event", "Real estate", "Construction / progress", "Corporate", "Tourism / travel", "FPV", "Other"]),
    one("licence", "Do you have a DGCA remote pilot certificate?", "DGCA certificate"),
    typed("drones", "Drones you fly", "Drones", "E.g. DJI Mini 4 Pro, Air 3, Mavic 3."),
    one("editor", "Do you edit the footage as well, or have an editor with you?", "Edits / has an editor"),
    travel("shoots"),
    brandWork,
  ],
  "anchors-hosts": [
    level("anchor"),
    many("specialisations", "Events you host", "Events", ["Wedding / Sangeet", "Corporate", "Award shows", "Concerts / Live shows", "Garba / Navratri", "Product launches", "College fests", "Kids' parties", "Other"]),
    one("script", "Do you write your own script?", "Writes own script"),
    one("games", "Do you run games and audience activities?", "Runs games"),
    one("bigCrowd", "Have you hosted for an audience of over 500?", "Hosted 500+ audience"),
    travel("events"),
    brandWork,
  ],
  editors: [
    level("editor"),
    many("specialisations", "What you edit", "Specialisation", ["Wedding films", "Reels / short-form", "YouTube", "Corporate videos", "Ads / commercials", "Music videos", "Photo retouching / albums", "Other"]),
    many("software", "Software you use", "Software", ["Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "After Effects", "Lightroom", "Photoshop", "CapCut", "Other"]),
    one("colour", "Do you do colour grading?", "Colour grading"),
    one("turnaround", "Your usual turnaround for an event film", "Turnaround", ["Same day", "2–3 days", "About a week", "More than a week"]),
    one("onSite", "Can you edit on site at events (same-day edits)?", "Edits on site"),
    brandWork,
  ],
  "musicians-djs": [
    level("musician or DJ"),
    many("specialisations", "What you play", "Specialisation", ["Wedding / Sangeet", "Club / Lounge", "Corporate", "Bollywood", "Garba / Dandiya", "Live band", "Sufi / Ghazal", "Instrumental", "Other"]),
    one("lineUp", "Do you perform solo or with a band?", "Line-up", ["Solo", "Duo", "Band (3 or more)"]),
    many("equipment", "Equipment you bring", "Equipment", ["DJ controller / CDJs", "Speakers / PA", "Microphones", "Lights", "Smoke / effects", "Instruments", "None"]),
    travel("events"),
    brandWork,
  ],
  comedians: [
    level("comedian"),
    many("specialisations", "Your style", "Style", ["Stand-up", "Improv", "Mimicry", "Hosting with comedy", "Gujarati comedy", "Hindi comedy", "Other"]),
    one("clean", "Can you perform a clean, family-friendly set?", "Clean set"),
    one("setLength", "Longest set you can perform", "Longest set", ["Up to 15 min", "15–30 min", "30–60 min", "Over an hour"]),
    travel("shows"),
    brandWork,
  ],
  singers: [
    level("singer"),
    many("specialisations", "Genres you sing", "Genres", ["Bollywood", "Ghazal", "Sufi", "Devotional / Bhajan", "Garba / Folk", "Western", "Classical", "Retro", "Other"]),
    one("liveWith", "How do you perform?", "Performs with", ["With a live band", "With karaoke tracks", "Both"]),
    one("sound", "Do you bring your own sound system?", "Own sound system"),
    travel("events"),
    brandWork,
  ],
  "makeup-artists": [
    level("makeup artist"),
    many("specialisations", "Your specialisation", "Specialisation", ["Bridal", "Party", "Engagement", "HD / Airbrush", "Editorial / shoot", "Hair styling", "Saree draping", "Other"]),
    typed("products", "Main makeup brands you use", "Products", "E.g. MAC, Huda Beauty, Kryolan."),
    one("team", "Do you have a team for large weddings?", "Has a team"),
    travel("bookings"),
    brandWork,
  ],
  models: [
    level("model"),
    many("specialisations", "Kind of modelling", "Specialisation", ["Fashion / Ramp", "Print / Catalogue", "Commercial / Ads", "Ethnic / Bridal", "Fitness", "Promotional / Hostess", "Other"]),
    typed("height", "Your height", "Height", "E.g. 5′7″ or 170 cm."),
    one("portfolioShoot", "Do you have a professional portfolio shoot?", "Portfolio shoot"),
    travel("shoots"),
    brandWork,
  ],
  "content-creators": [
    level("content creator"),
    many("specialisations", "Content you make", "Content", ["Instagram reels", "Brand content", "Event reels (same day)", "UGC / product videos", "Food", "Fashion / Lifestyle", "Travel", "Other"]),
    one("process", "Do you shoot and edit yourself?", "Shoots / edits", ["Shoot and edit", "Shoot only", "Edit only"]),
    one("onCamera", "Do you appear on camera?", "On camera"),
    many("equipment", "Equipment you use", "Equipment", ["Phone", "Mirrorless / DSLR", "Gimbal", "Microphone", "Lights", "Drone"]),
    one("followers", "Your Instagram followers", "Followers", ["Under 1K", "1K–10K", "10K–50K", "50K–1L", "Over 1L"]),
    brandWork,
  ],
};
export const workQuestionsFor = (category: string) => workQuestions[category] ?? [level("artist"), travel("events"), brandWork];

// Photographers and cinematographers give both an Instagram link and a portfolio link.
export const bothLinksCategories = ["photographers", "cinematographers"];

// The steps of the application form, in order.
export const applySteps = [
  { id: "about", title: "About you", text: "Name, contact and city" },
  { id: "craft", title: "Your craft", text: "What you do and where" },
  { id: "work", title: "Your work details", text: "Questions about how you work" },
  { id: "portfolio", title: "Portfolio", text: "Your best work and links" },
  { id: "verify", title: "Verification", text: "Identity and agreements" },
  { id: "review", title: "Review", text: "Check and send" },
] as const;

// Joining AOD, from application to live.
export const onboardingStages = [
  { title: "Application", text: "Your details, portfolio and links reach the AOD team." },
  { title: "Portfolio & background check", text: "Our creative team reviews your style; your identity and references are verified." },
  { title: "Trial booking", text: "One supervised booking to confirm professionalism and punctuality." },
  { title: "Live on AOD", text: "You appear in curated matches and start getting booking requests." },
];

// What an applicant sees on the overview at each step of their application (live mode).
export const applicantStatusText: Record<string, { title: string; text: string }> = {
  submitted: { title: "Your application is in the queue", text: "AOD's team reviews every application, usually within a few days." },
  review: { title: "Our team is reviewing your portfolio", text: "We'll message you if we need anything else." },
  meeting: { title: "Meeting with the AOD team", text: "Details are below. The AOD team confirms them with you on WhatsApp." },
  trial: { title: "Your trial booking is being arranged", text: "AOD will share the event details with you directly." },
  approved: { title: "You're approved", text: "Welcome to AOD. Your bookings appear here." },
  rejected: { title: "Application closed", text: "AOD's team has emailed you about the decision. Questions? Message us." },
};

// Uploads: what the portal accepts. Checked in the browser before anything is sent.
export const uploadRules = {
  samples: {
    accept: "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime",
    imageMaxMb: 15,
    videoMaxMb: 200,
    min: 6,
    max: 30,
    hint: "JPG, PNG, WebP or HEIC photos up to 15 MB; MP4 or MOV videos up to 200 MB. At least 6, up to 30.",
  },
  resume: { accept: "application/pdf", maxMb: 5, hint: "PDF up to 5 MB. Optional, but it helps for corporate and expo work." },
  gst: { accept: "application/pdf,image/jpeg,image/png", maxMb: 5, hint: "Only if you invoice as a registered business. PDF or image up to 5 MB." },
};

// Identity: done through DigiLocker by a KYC provider, never by uploading an Aadhaar card.
export const identity = {
  title: "Verify your identity with DigiLocker",
  text: "You sign in to DigiLocker (the Government of India app) and approve sharing. AOD receives only your verified name, date of birth and photo, plus a masked Aadhaar number showing the last 4 digits.",
  never: "We never ask for your full Aadhaar number or a photo of your Aadhaar card, and we don't store them.",
};

// ---------------------------------------------------------------------------
// Sample data for the preview. Not real artists or bookings.
// ---------------------------------------------------------------------------

export const sampleArtist = {
  fullName: "Kavya Desai",
  phone: "98250 12345",
  email: "kavya.frames@example.com",
  city: "Ahmedabad",
  category: "photographers",
  services: ["Wedding photography", "Candid photography", "Pre-wedding shoot"],
  experience: "3–5 years",
  languages: ["Gujarati", "Hindi", "English"],
  bio: "Candid wedding and pre-wedding photographer. I like quiet, unposed moments and warm colour. I shoot with a second shooter for weddings over 300 guests.",
  links: ["https://www.instagram.com/kavya.frames/", "https://www.youtube.com/@kavyadesaifilms"],
};

// Where the sample applicant is in onboarding (index into onboardingStages).
export const sampleStage = 1;

// "selected": the customer chose this artist and AOD is waiting for the advance payment.
export type BookingStatus = "new" | "quoted" | "selected" | "confirmed" | "completed" | "declined" | "cancelled";

export type SampleBooking = {
  id: string;
  event: string;
  service: string;
  date: string; // display text
  city: string;
  guests?: string;
  budget: string;
  note?: string;
  replyBy?: string;
  status: BookingStatus;
};

export const sampleBookings: SampleBooking[] = [
  {
    id: "R-2041",
    event: "Wedding",
    service: "Candid photography",
    date: "Sat, 21 Nov 2026 · 2 days",
    city: "Vadodara",
    guests: "300–500 guests",
    budget: "₹40,000–60,000",
    note: "Sangeet on the first evening, ceremony the next morning.",
    replyBy: "Reply within 18 hours",
    status: "new",
  },
  {
    id: "R-2038",
    event: "Corporate event",
    service: "Event photography",
    date: "Sat, 24 Oct 2026 · 4 hours",
    city: "Ahmedabad",
    guests: "120 guests",
    budget: "₹15,000–20,000",
    note: "Annual awards night. Stage shots and candid networking photos.",
    replyBy: "Reply within 6 hours",
    status: "new",
  },
  {
    id: "R-2029",
    event: "Pre-wedding",
    service: "Pre-wedding shoot",
    date: "Sun, 1 Nov 2026 · half day",
    city: "Gandhinagar",
    budget: "₹18,000–25,000",
    status: "quoted",
  },
  {
    id: "B-1187",
    event: "Engagement",
    service: "Candid photography",
    date: "Sun, 18 Oct 2026 · 6 hours",
    city: "Ahmedabad",
    guests: "200 guests",
    budget: "₹28,000",
    status: "confirmed",
  },
  {
    id: "B-1152",
    event: "Birthday",
    service: "Event photography",
    date: "Sat, 26 Sep 2026 · 3 hours",
    city: "Ahmedabad",
    budget: "₹9,000",
    status: "completed",
  },
];
