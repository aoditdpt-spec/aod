// AOD Resolution Centre (/resolve, planned for resolve.aod.co.in): where a customer, business or
// artist formally raises a problem with a booking, gets a case number, tracks it, and can
// escalate it. It isn't a help desk: questions and changes go to WhatsApp as usual.
//
// DRAFT for the founder to confirm: the time promises follow India's Consumer Protection
// (E-Commerce) Rules 2020 (acknowledge a complaint within 48 hours, redress it within one
// month), and the grievance officer's name is still to be added (see src/content/legal.ts).

import { brand } from "./site";

export type CaseRole = "customer" | "business" | "artist";

export const resolution = {
  name: "Resolution Centre",
  title: "AOD Resolution Centre",
  tagline: "Something went wrong with a booking? AOD will put it right.",
  intro:
    "Raise a problem with a booking here. Every case gets a number, someone at AOD looks into it with both sides, and you can follow it until it's resolved.",
  notSupport: "Questions, quotes or changes to a booking? Message AOD on WhatsApp instead. This centre is for problems that need putting right.",
  promises: [
    { title: "Acknowledged within 48 hours", text: "You'll get a reply from a named person at AOD, by email, within two days." },
    { title: "Resolved within 30 days", text: "Most cases are settled in a few days. Every case gets a decision within a month." },
    { title: "Escalate any time", text: "Not happy with the outcome? AOD's grievance officer reviews the case afresh." },
  ],
  steps: [
    { title: "Raise a case", text: "Tell AOD what happened, which booking it's about and what you'd like done." },
    { title: "AOD looks into it", text: "AOD hears from both sides (customer and artist) and checks the booking's records." },
    { title: "A decision", text: "A refund, a replacement or re-shoot, a payout released, or an explanation, with the reason." },
    { title: "Escalation if needed", text: "Still not resolved? The grievance officer reviews it, and you can take it further." },
  ],
  roles: [
    { id: "customer", label: "I booked an artist", hint: "For a wedding, party or personal event" },
    { id: "business", label: "I booked for a business", hint: "Shoots, events or contracts for a company" },
    { id: "artist", label: "I'm an AOD artist", hint: "About a booking, a customer or a payout" },
  ] as { id: CaseRole; label: string; hint: string }[],
  issues: {
    customer: [
      "Artist didn't turn up",
      "Artist arrived late or left early",
      "Quality of the work",
      "Files not delivered or incomplete",
      "Refund or cancellation",
      "Charged the wrong amount",
      "Behaviour or safety",
      "Something else",
    ],
    business: [
      "Artist didn't turn up",
      "Quality of the work",
      "Files not delivered or incomplete",
      "Invoice, GST or billing",
      "Refund or cancellation",
      "Behaviour or safety",
      "Something else",
    ],
    artist: ["Payout not received or short", "Booking cancelled unfairly", "Customer behaviour or safety", "Extra work not paid", "Something else"],
  } satisfies Record<CaseRole, string[]>,
  outcomes: ["Full refund", "Partial refund", "Replacement artist or re-shoot", "Payout released", "An explanation and apology", "Something else"],
  grievanceOfficer: { name: "[name to add]", email: brand.email, phone: brand.phoneDisplay, phoneHref: brand.phoneHref },
  whoTitle: "Who can raise a case",
  whoText: "Anyone on either side of an AOD booking. Pick the one that fits you; the form asks the right questions.",
  escalateTitle: "Not happy with the outcome?",
  escalateText:
    "Escalate the case from its tracking page and AOD's grievance officer reviews it afresh. You can also contact them directly:",
  furtherHelp:
    "If it's still not resolved, you can take it to the National Consumer Helpline (call 1915, or consumerhelpline.gov.in) or your district consumer commission.",
  formTitle: "Raise a case",
  formText: "Tell AOD what happened. You'll get a case number straight away and a reply within 48 hours.",
  evidenceHint:
    "Links to photos, videos or chat screenshots (Google Drive, Google Photos, Dropbox…). You can also send them on WhatsApp later, quoting your case number.",
  bookingRefHint: "Your booking or request number, like B-1215 or AOD-1215. Can't find it? Write the artist's name and the event date.",
  previewNotice:
    "The Resolution Centre isn't connected yet, so this case can't be saved here. Send it to AOD on WhatsApp instead; nothing has been sent until you do.",
  trackTitle: "Track a case",
  trackText: "Enter your case number (like RC-1001) and the email you raised it with.",
};

// What the person raising a case sees at each stage (the admin uses the same ids, see caseStages
// in src/content/admin.ts).
export const caseSteps = [
  { id: "received", label: "Received", text: "AOD has your case and will reply within 48 hours." },
  { id: "acknowledged", label: "Acknowledged", text: "Someone at AOD is on it and has been in touch." },
  { id: "investigating", label: "Being looked into", text: "AOD is hearing from both sides and checking the booking." },
  { id: "resolved", label: "Resolved", text: "AOD has made a decision. If you're not satisfied, you can escalate it." },
] as const;
