// The artist portal's names and stages, as the server and the installable app read them. The
// portal's screens and copy are in src/components/dash/portal and src/data (the new design,
// 2026-11-21); the kinds of artist, their services and work questions in src/data/work-questions.ts.

export const portal = {
  name: "AOD for Artists",
  host: "artists.aod.co.in",
};

// The onboarding stages, from the application to going live (loadArtistPortal's `stage` indexes these).
export const onboardingStages = [
  { title: "Application", text: "Your details, portfolio and links reach the AOD team." },
  { title: "Portfolio & background check", text: "Our creative team reviews your style; your identity and references are verified." },
  { title: "Trial booking", text: "One supervised booking to confirm professionalism and punctuality." },
  { title: "Live on AOD", text: "You appear in curated matches and start getting booking requests." },
];

// How an order looks to an artist (src/lib/artist-orders.ts decides which one).
export type BookingStatus = "new" | "accepted" | "shortlisted" | "quoted" | "selected" | "confirmed" | "completed" | "declined" | "cancelled";
