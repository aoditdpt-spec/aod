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

// The same buckets as AOD's registration forms (Google Forms).
export const experienceLevels = ["Less than 1 year", "1–3 years", "3–5 years", "More than 5 years"];

// "Your work details": a step of the application with questions for the applicant's category,
// taken from AOD's registration form for each category (Google Forms), minus what the other steps
// already ask (name, contact, city, experience, languages, links and the declaration).
// Questions are required unless `optional`; one with `showIf` only appears (and is only checked)
// when another question has the given answer. Answers are saved by question id in
// `applications.details`, and the admin shows them with each question's `short` label.
export type WorkQuestion = {
  id: string;
  label: string;
  short: string; // the label in the review step and the admin
  kind: "one" | "many" | "text" | "long"; // long: a few lines of text
  options?: string[];
  hint?: string;
  optional?: boolean;
  showIf?: { id: string; is: string };
};

const yesNo = ["Yes", "No"];
const one = (id: string, label: string, short: string, options = yesNo): WorkQuestion => ({ id, label, short, kind: "one", options });
const many = (id: string, label: string, short: string, options: string[]): WorkQuestion => ({ id, label, short, kind: "many", options, hint: "Pick all that apply." });
const typed = (id: string, label: string, short: string, hint: string): WorkQuestion => ({ id, label, short, kind: "text", hint });

const levels = ["Full-time Professional", "Freelance", "Part-time", "Student / Beginner"];
const level = (who: string, options = levels) => one("level", `Are you a professional ${who}?`, "Works as", options);
const travel = (what: string) => one("travel", `Are you willing to travel for ${what} if required?`, "Travels", ["Yes", "No", "Within my city only"]);
const paid = (what: string, depends = "Depends on project") => one("paid", `Are you open to paid ${what} through AOD?`, "Open to paid work", ["Yes", depends, "No"]);
// "Have you worked with brands…?" and, if yes, which ones (optional).
const brandWork = (label = "Have you worked with brands, artists or events before?", follow = "Mention notable brands, clients or events"): WorkQuestion[] => [
  one("brandWork", label, "Worked with brands"),
  { id: "brandWorkDetails", label: follow, short: "Brands / clients", kind: "long", optional: true, showIf: { id: "brandWork", is: "Yes" } },
];
const camera = (who: string, what: string, specialisations: string[]): WorkQuestion[] => [
  level(who),
  many("specialisations", `Your ${what} specialisation`, "Specialisation", specialisations),
  one("editor", "Are you an editor as well, or do you have an editor with you?", "Edits / has an editor"),
  travel("shoots"),
  many("equipment", "Equipment you use", "Equipment", ["DSLR", "Mirrorless", "Gimbal", "Drone", "Studio lights"]),
  typed("cameraBrand", "Camera brand", "Camera brand", "E.g. Sony, Canon, Nikon, Fujifilm."),
  ...brandWork(),
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
    ...brandWork(),
  ],
  // From the "Host / Anchor – Registration" form.
  "anchors-hosts": [
    level("host / anchor", ["Full-time Professional", "Freelance", "Part-time", "Beginner"]),
    many("specialisations", "Type of hosting experience", "Hosting experience", ["Corporate Events", "Weddings", "Stage Shows", "Live Concerts", "Award Functions", "Exhibitions / Trade Shows", "Digital / Online Events", "Radio / Podcast Hosting", "Other"]),
    many("style", "Hosting style", "Hosting style", ["Formal / Corporate", "Energetic / Entertaining", "Interactive / Crowd Engagement", "Luxury / Premium", "Youth / Fun"]),
    ...brandWork("Have you hosted events for brands or corporate clients before?", "Mention notable events or brands"),
    paid("hosting assignments", "Depends on event"),
    many("preferredEvents", "Preferred type of events", "Preferred events", ["Corporate Events", "Weddings", "Brand Launches", "College Festivals", "Private Parties", "Virtual Events"]),
    travel("events"),
  ],
  // From the "Video Editor Registration" form.
  editors: [
    one("workMode", "Work preference", "Works", ["Work From Home (Remote)", "Hybrid (Remote + Occasional Visit)", "On-site Only"]),
    many("software", "Editing software you use", "Software", ["Adobe Premiere Pro", "After Effects", "DaVinci Resolve", "Final Cut Pro", "CapCut", "Other"]),
    one("skill", "Skill level", "Skill level", ["Beginner", "Intermediate", "Advanced", "Professional"]),
    many("specialisations", "Types of editing you specialise in", "Specialisation", ["Instagram Reels / Shorts", "YouTube Videos", "Wedding Films", "Corporate / Brand Videos", "Advertisements (Ads)", "Podcast Editing", "Cinematic Edits", "VFX / Motion Graphics", "Color Grading", "Other"]),
    ...brandWork("Have you worked with any brands or agencies?", "Mention brands or projects"),
    one("setup", "Do you have a proper editing setup (a laptop or PC with good performance)?", "Editing setup", ["Yes (High-performance system)", "Basic system", "No"]),
    one("internet", "Internet speed (for file transfer)", "Internet speed", ["Below 20 Mbps", "20–50 Mbps", "50+ Mbps"]),
    one("urgent", "Can you handle urgent / fast delivery projects?", "Urgent projects", ["Yes", "No", "Depends on workload"]),
    many("availability", "Availability", "Availability", ["Full-Time Freelance", "Part-Time Freelance", "Project-Based Only"]),
    one("shoots", "Do you also shoot, with a camera or an iPhone?", "Also shoots"),
    one("deadlines", "Do you follow deadlines strictly?", "Follows deadlines"),
    one("revisions", "Are you comfortable working under AOD guidelines and revisions?", "OK with AOD revisions"),
  ],
  "musicians-djs": [
    level("musician or DJ"),
    many("specialisations", "What you play", "Specialisation", ["Wedding / Sangeet", "Club / Lounge", "Corporate", "Bollywood", "Garba / Dandiya", "Live band", "Sufi / Ghazal", "Instrumental", "Other"]),
    one("lineUp", "Do you perform solo or with a band?", "Line-up", ["Solo", "Duo", "Band (3 or more)"]),
    many("equipment", "Equipment you bring", "Equipment", ["DJ controller / CDJs", "Speakers / PA", "Microphones", "Lights", "Smoke / effects", "Instruments", "None"]),
    travel("events"),
    ...brandWork(),
  ],
  // From the "Comedian – Registration" form.
  comedians: [
    level("comedian"),
    many("specialisations", "Type of comedy you perform", "Comedy", ["Stand-up Comedy", "Observational Comedy", "Dark Comedy", "Improvisation (Improv)", "Crowd Work", "Scripted Comedy", "Character Comedy", "Other"]),
    many("performLanguages", "Languages you perform in", "Performs in", ["English", "Hindi", "Gujarati", "Hinglish", "Other"]),
    many("events", "Types of events you have performed at", "Performed at", ["Corporate Events", "Private Parties", "Weddings / Sangeet", "Clubs / Open Mics", "College Events", "Ticketed Shows", "Online Shows", "Other"]),
    one("setLength", "Average performance duration", "Set length", ["5–10 minutes", "10–20 minutes", "20–40 minutes", "40+ minutes"]),
    { ...one("crowdComfort", "Comfort level with live audience interaction", "Crowd comfort", ["1", "2", "3", "4", "5"]), hint: "1 = not comfortable, 5 = very comfortable." },
    one("customContent", "Do you create customised content for events?", "Custom content", ["Yes", "No", "Depends on requirement"]),
    ...brandWork("Have you worked with brands, artists or events before?", "Mention notable collaborations, shows or performances"),
    paid("projects"),
    travel("shows"),
  ],
  singers: [
    level("singer"),
    many("specialisations", "Genres you sing", "Genres", ["Bollywood", "Ghazal", "Sufi", "Devotional / Bhajan", "Garba / Folk", "Western", "Classical", "Retro", "Other"]),
    one("liveWith", "How do you perform?", "Performs with", ["With a live band", "With karaoke tracks", "Both"]),
    one("sound", "Do you bring your own sound system?", "Own sound system"),
    travel("events"),
    ...brandWork(),
  ],
  // From the "Makeup Artist – Registration" form.
  "makeup-artists": [
    level("make-up artist"),
    many("specialisations", "Make-up specialisation", "Specialisation", ["Bridal Make-Up", "Party / Occasion Make-Up", "Fashion / Editorial", "Celebrity / Artist Make-Up", "HD Make-Up", "Airbrush Make-Up", "Natural / Minimal Look", "Special Effects (SFX)", "Other"]),
    ...brandWork("Have you worked with brands, artists, salons or events before?", "Mention notable collaborations or clients"),
    typed("products", "Make-up products / brands you use", "Products", "E.g. MAC, Huda Beauty, Bobbi Brown, Kryolan."),
    one("hygiene", "Do you follow proper hygiene and sanitisation practices?", "Hygiene", ["Yes, strictly", "Yes, basic hygiene", "Learning / Improving"]),
    paid("collaborations"),
    many("preferredProjects", "Preferred type of projects", "Preferred projects", ["Bridal Assignments", "Brand Shoots", "Artist / Influencer Shoots", "Fashion Shows", "Events", "Commercial Campaigns"]),
    travel("assignments"),
  ],
  models: [
    level("model"),
    many("specialisations", "Kind of modelling", "Specialisation", ["Fashion / Ramp", "Print / Catalogue", "Commercial / Ads", "Ethnic / Bridal", "Fitness", "Promotional / Hostess", "Other"]),
    typed("height", "Your height", "Height", "E.g. 5′7″ or 170 cm."),
    one("portfolioShoot", "Do you have a professional portfolio shoot?", "Portfolio shoot"),
    travel("shoots"),
    ...brandWork(),
  ],
  "content-creators": [
    level("content creator"),
    many("specialisations", "Content you make", "Content", ["Instagram reels", "Brand content", "Event reels (same day)", "UGC / product videos", "Food", "Fashion / Lifestyle", "Travel", "Other"]),
    one("process", "Do you shoot and edit yourself?", "Shoots / edits", ["Shoot and edit", "Shoot only", "Edit only"]),
    one("onCamera", "Do you appear on camera?", "On camera"),
    many("equipment", "Equipment you use", "Equipment", ["Phone", "Mirrorless / DSLR", "Gimbal", "Microphone", "Lights", "Drone"]),
    one("followers", "Your Instagram followers", "Followers", ["Under 1K", "1K–10K", "10K–50K", "50K–1L", "Over 1L"]),
    ...brandWork(),
  ],
};
export const workQuestionsFor = (category: string) => workQuestions[category] ?? [level("artist"), travel("events"), ...brandWork()];

// Whether a question is on screen for these answers (a `showIf` question only after the given choice).
export const workQuestionShown = (q: WorkQuestion, answers: Record<string, string | string[]> | undefined) =>
  !q.showIf || [answers?.[q.showIf.id] ?? []].flat().includes(q.showIf.is);

// These categories give both an Instagram link and a portfolio / showreel link (AOD's registration
// forms ask each of them for both).
export const bothLinksCategories = ["photographers", "cinematographers", "editors", "anchors-hosts", "comedians", "makeup-artists"];

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
