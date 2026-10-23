// AOD's Dispute Desk (/resolve, at resolve.aod.co.in; called the Resolution Centre in the code):
// where an artist or the person who booked them raises a dispute with the other side of an AOD
// booking, gets a case number, tracks it, and can escalate it. AOD sits in the middle: it hears
// both sides and works towards a settlement. The wording points at the other side of the booking
// (a client who ghosted an invoice, an artist who didn't deliver), never at AOD itself. It isn't a
// help desk: questions and changes go to WhatsApp as usual.
//
// DRAFT for the founder to confirm: the time promises follow India's Consumer Protection
// (E-Commerce) Rules 2020 (acknowledge a complaint within 48 hours, redress it within one
// month), and the grievance officer's name is still to be added (see src/content/legal.ts).

import { brand } from "./site";

export type CaseRole = "customer" | "business" | "artist";

export const resolution = {
  name: "Dispute Desk",
  title: "AOD Dispute Desk",
  tagline: "A dispute with a client or an artist? We'll help you settle it.",
  intro:
    "Client ghosted your invoice, cancelled at the last minute, or an artist didn't deliver what was agreed? Raise it here. You get a case number, AOD hears both sides, and works towards a fair settlement. Free.",
  notSupport:
    "Questions, quotes or changes to a booking? Message AOD on WhatsApp instead. The Dispute Desk is for disagreements between a client and an artist that need settling.",
  promises: [
    { title: "A reply within 48 hours", text: "Someone at the Dispute Desk reads your case and gets in touch by email within two days." },
    { title: "An outcome within 30 days", text: "Most disputes settle in a few days. Every case gets an outcome within a month." },
    { title: "Escalate any time", text: "Not happy with the outcome? AOD's grievance officer reviews the case afresh." },
  ],
  steps: [
    { title: "Tell us what happened", text: "Which booking, what the other side did or didn't do, and what would settle it for you." },
    { title: "We hear both sides", text: "AOD contacts the client or the artist, and looks at the chats, invoices and booking records." },
    { title: "A fair settlement", text: "Payment of what's owed, a refund of the advance, a re-shoot, credit given, or a written agreement both sides sign." },
    { title: "Escalation if needed", text: "Still not settled? AOD's grievance officer reviews it, and you can take it further." },
  ],
  // Artists first: most disputes are an artist chasing a client.
  roles: [
    { id: "artist", label: "I'm an artist", hint: "A problem with a client: unpaid, ghosted or cancelled" },
    { id: "customer", label: "I booked an artist", hint: "A problem with the artist you booked" },
    { id: "business", label: "I booked for a business", hint: "A problem with an artist on a business booking" },
  ] as { id: CaseRole; label: string; hint: string }[],
  // What the dispute is about, for each side. Each is about the other side of the booking.
  issues: {
    artist: [
      "Unpaid or delayed payment",
      "Client stopped replying (ghosted)",
      "Last-minute cancellation",
      "Extra work not agreed or paid (scope creep)",
      "My work used without permission",
      "Missing credit for my work",
      "Advance or refund dispute",
      "Client's behaviour or safety",
      "Something else",
    ],
    customer: [
      "Artist didn't turn up",
      "Artist arrived late or left early",
      "Artist cancelled at the last minute",
      "Work not what was agreed",
      "Photos or videos not delivered",
      "Artist asking for more money",
      "Advance or refund dispute",
      "Artist's behaviour or safety",
      "Something else",
    ],
    business: [
      "Artist didn't turn up",
      "Artist cancelled at the last minute",
      "Work not what was agreed",
      "Files not delivered or incomplete",
      "Usage rights or credit",
      "Advance or refund dispute",
      "Artist's behaviour or safety",
      "Something else",
    ],
  } satisfies Record<CaseRole, string[]>,
  // What would settle it, for each side.
  outcomes: {
    artist: [
      "Get paid what I'm owed",
      "Keep the advance or a cancellation fee",
      "Payment for the extra work",
      "Credit, or my work taken down",
      "A written settlement both sides sign",
      "Something else",
    ],
    customer: [
      "A refund (full or part)",
      "A re-shoot or a replacement artist",
      "The photos or videos delivered",
      "A written settlement both sides sign",
      "Something else",
    ],
    business: [
      "A refund (full or part)",
      "A re-shoot or a replacement artist",
      "The files delivered",
      "Usage rights or credit sorted",
      "A written settlement both sides sign",
      "Something else",
    ],
  } satisfies Record<CaseRole, string[]>,
  grievanceOfficer: { name: "[name to add]", email: brand.email, phone: brand.phoneDisplay, phoneHref: brand.phoneHref },
  whoTitle: "Who can use the Dispute Desk",
  whoText: "Both sides of an AOD booking: artists, and the people and businesses who book them. Pick the side you're on; the form asks the right questions.",
  escalateTitle: "Not happy with the outcome?",
  escalateText:
    "Escalate the case from its tracking page and AOD's grievance officer reviews it afresh. You can also contact them directly:",
  furtherHelp:
    "Still not settled? Customers can go to the National Consumer Helpline (call 1915, or consumerhelpline.gov.in) or their district consumer commission. Artists can ask their District Legal Services Authority for free legal aid, and an artist registered on Udyam as a micro or small enterprise can also take a late payment to the government's MSME Samadhaan portal.",
  formTitle: "Raise a dispute",
  formText: "Tell us what happened and who it's with. You'll get a case number straight away and a reply within 48 hours.",
  evidenceHint:
    "Links to the chats, invoice, contract, photos or payment screenshots (Google Drive, Google Photos, Dropbox…). You can also send them on WhatsApp later, quoting your case number.",
  bookingRefHint:
    "The AOD booking or request number, like AOD-PH-102601. Can't find it? Write the client's or artist's name and the event date.",
  previewNotice:
    "The Dispute Desk isn't connected yet, so this case can't be saved here. Send it to AOD on WhatsApp instead; nothing has been sent until you do.",
  trackTitle: "Track a dispute",
  trackText: "Enter your case number (like RC-1001) and the email you raised it with.",
};

// What the person raising a case sees at each stage (the admin uses the same ids, see caseStages
// in src/content/admin.ts).
export const caseSteps = [
  { id: "received", label: "Received", text: "The Dispute Desk has your case and will reply within 48 hours." },
  { id: "acknowledged", label: "Acknowledged", text: "Someone at the desk is on it and has been in touch." },
  { id: "investigating", label: "Hearing both sides", text: "AOD is talking to both sides and checking the chats, invoices and booking." },
  { id: "resolved", label: "Settled", text: "There's an outcome. If you're not satisfied, you can escalate it." },
] as const;
