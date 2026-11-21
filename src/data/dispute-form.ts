// The Dispute Desk's form and tracking, from aod.co.in (src/content/resolution.ts there): each
// side picks what the dispute is about and what would settle it. A booking outside AOD can't be
// settled with AOD's money, so its outcomes are things the other side does, or a written record.

export type Side = "artist" | "customer" | "business";

export const caseForm = {
  title: "Raise A Dispute.",
  trackTitle: "Track A Dispute.",
  sides: [
    { id: "artist", label: "I'm An Artist", hint: "A problem with a client: unpaid, ghosted or cancelled" },
    { id: "customer", label: "I Booked An Artist", hint: "A problem with the artist you booked" },
    { id: "business", label: "I Booked For A Business", hint: "A problem with an artist on a business booking" },
  ] as { id: Side; label: string; hint: string }[],
  throughAod: { question: "Was It Booked Through AOD?", yes: "Yes, Through AOD", no: "No, Directly Or Elsewhere" },
  outcomes: {
    artist: ["Get Paid What I'm Owed", "Keep The Advance Or A Cancellation Fee", "Payment For The Extra Work", "Credit, Or My Work Taken Down", "A Written Settlement Both Sides Sign", "Something Else"],
    customer: ["A Refund (Full Or Part)", "A Re-Shoot Or A Replacement Artist", "The Photos Or Videos Delivered", "A Written Settlement Both Sides Sign", "Something Else"],
    business: ["A Refund (Full Or Part)", "A Re-Shoot Or A Replacement Artist", "The Files Delivered", "Usage Rights Or Credit Sorted", "A Written Settlement Both Sides Sign", "Something Else"],
  } as Record<Side, string[]>,
  outcomesOutside: {
    artist: ["Get Paid What I'm Owed", "Keep The Advance Or A Cancellation Fee", "Payment For The Extra Work", "Credit, Or My Work Taken Down", "A Written Settlement Both Sides Sign", "A Written Summary To Take Further", "Something Else"],
    customer: ["A Refund From The Artist (Full Or Part)", "A Re-Shoot Or A Redo", "The Photos Or Videos Delivered", "A Replacement Artist Through AOD", "A Written Settlement Both Sides Sign", "A Written Summary To Take Further", "Something Else"],
    business: ["A Refund From The Artist (Full Or Part)", "A Re-Shoot Or A Redo", "The Files Delivered", "Usage Rights Or Credit Sorted", "A Replacement Artist Through AOD", "A Written Settlement Both Sides Sign", "A Written Summary To Take Further", "Something Else"],
  } as Record<Side, string[]>,
  bookingRefHint: "The AOD booking or request number, like AOD-PH-261001. Can't find it? Write the client's or artist's name and the event date.",
  otherPartyHint: "AOD contacts them to hear their side, and only for this dispute. Taking part is up to them.",
  evidenceHint: "Links to the chats, invoice, contract, photos or payment screenshots (Google Drive, Google Photos, Dropbox…).",
  // What the person sees at each stage.
  steps: [
    { id: "received", label: "Received", text: "The Dispute Desk has your case and will reply within 48 hours." },
    { id: "hearing", label: "Hearing Both Sides", text: "AOD is talking to both sides and checking the chats, invoices and booking." },
    { id: "settled", label: "Settled", text: "There's an outcome. If you're not satisfied, you can escalate it." },
  ],
  stepsOutside: [
    { id: "received", label: "Received", text: "The Dispute Desk has your case and will reply within 48 hours." },
    { id: "hearing", label: "Mediating", text: "AOD is reaching out to the other side and working towards a settlement you both agree to." },
    { id: "settled", label: "Settled Or Summarised", text: "Either a written settlement, or a written summary of the case and your next step." },
  ],
};
