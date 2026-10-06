// Copy and sample data for the artist portal: served at /artists for now, and on
// artists.aod.co.in once that domain points here (see src/proxy.ts).
//
// PREVIEW: there is no backend yet. Sign-in, uploads, verification and submitting do not
// save or send anything. The sample artist, booking requests and statuses below are made up
// to show how the portal will work, and every portal page says so. Replace them with
// Supabase data when the backend is built.

// The customer site, for "back" links. On the artists domain "/" is the portal itself, so this
// must be a full address there: set NEXT_PUBLIC_SITE_URL (e.g. https://artistsondemand.vercel.app).
export const mainSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "/";

export const portal = {
  name: "AOD for Artists",
  host: "artists.aod.co.in",
  signIn: {
    title: "Your bookings, profile and portfolio, in one place.",
    subtitle: "Sign in with the phone number you joined AOD with. We'll send a one-time code on WhatsApp.",
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

// The steps of the application form, in order.
export const applySteps = [
  { id: "about", title: "About you", text: "Name, contact and city" },
  { id: "craft", title: "Your craft", text: "What you do and where" },
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

export type BookingStatus = "new" | "quoted" | "confirmed" | "completed" | "declined";

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
