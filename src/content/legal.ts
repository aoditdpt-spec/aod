// Privacy policy, terms of service and cancellation & refund policy.
//
// DRAFTS written for the founder's review, not legal advice. Before relying on them:
// - add the legal entity name, registered address and GSTIN (marked [to add] below),
// - name a grievance officer,
// - confirm the commercial terms flagged in the refund policy (cut-off days, percentages),
// - have them checked by a lawyer familiar with the DPDP Act 2023 and consumer law.
// Pages and the "Draft" label are in src/components/legal/LegalPage.tsx.

import { brand } from "@/content/site";

export type LegalBlock = string | { list: string[] };
export type LegalSection = { id: string; heading: string; body: LegalBlock[] };
export type LegalDoc = { slug: string; title: string; description: string; updated: string; intro: string; sections: LegalSection[] };

const contact = `${brand.email} or WhatsApp/call ${brand.phoneDisplay}`;
const updated = "6 October 2026";

export const privacy: LegalDoc = {
  slug: "privacy",
  title: "Privacy policy",
  description: "How Artists on Demand collects, uses, shares and protects personal data, and the rights you have under India's Digital Personal Data Protection Act, 2023.",
  updated,
  intro: `This policy explains what personal data ${brand.fullName} ("AOD", "we") collects when you use ${brand.domain}, our artist portal and payment page, or talk to us on WhatsApp, and what we do with it. We follow India's Digital Personal Data Protection Act, 2023 (the DPDP Act).`,
  sections: [
    {
      id: "who",
      heading: "Who we are",
      body: [
        `${brand.fullName} is a marketplace based in ${brand.city}, ${brand.region}, that connects customers with vetted photographers, cinematographers, DJs, anchors, makeup artists and other event talent. For the personal data described here, AOD is the "data fiduciary" under the DPDP Act.`,
        "Legal entity name and registered address: [to add].",
      ],
    },
    {
      id: "collect",
      heading: "What we collect",
      body: [
        "If you book or enquire as a customer:",
        { list: ["Your name, phone number, email address and city.", "Event details: type, date, time, venue, budget, the services you want and any notes.", "Messages you send us on WhatsApp, email or phone.", "Payment details you share with us: the amount, and the UPI transaction ID (UTR) or bank reference. We never receive your UPI PIN, card number or bank login.", "Reviews and ratings you give."] },
        "If you apply or work with us as an artist:",
        { list: ["Your name, phone number, email address, city, craft, services, experience and languages.", "Your portfolio: photos, videos, links and resume you share.", "Identity verification through DigiLocker, via a KYC provider, when it is switched on: your verified name, date of birth and photo, and a masked Aadhaar number (last 4 digits). We never ask for your full Aadhaar number or a photo of your Aadhaar card.", "After your trial booking: bank account or UPI ID and PAN, for payouts and tax.", "Your availability, bookings, quotes, payouts and notes from our team."] },
        "When you use the website:",
        { list: ["Basic technical data our hosting provider logs, such as your IP address, browser and the pages you open, to keep the site running and secure.", "Settings saved in your own browser (for example your chosen city and unfinished application answers). These stay on your device; they are not sent to us until you submit."] },
      ],
    },
    {
      id: "use",
      heading: "Why we use it",
      body: [
        { list: ["To take your booking request, match you with suitable artists, send quotes and confirm the booking.", "To verify payments, issue invoices, pay artists and keep accounting records.", "To review artist applications, check portfolios and identity, and keep our marketplace safe.", "To send booking updates, reminders and delivery links on WhatsApp, SMS or email.", "To answer questions, handle cancellations, refunds and complaints.", "To prevent fraud and misuse, and to meet legal and tax obligations.", "To send offers or news, only if you have agreed to it. You can stop these at any time."] },
        "We use your data on the basis of your consent, or for the legitimate uses the DPDP Act allows, such as completing a booking you asked for and meeting legal obligations. You can withdraw consent at any time (see Your rights); this doesn't affect what we did before you withdrew it, and we may not be able to complete a booking without the details it needs.",
      ],
    },
    {
      id: "share",
      heading: "Who we share it with",
      body: [
        "We do not sell your personal data. We share only what is needed:",
        { list: ["With the artist matched to your booking: your name, event details, venue and, close to the event, your phone number.", "With customers: an artist's name, work profile, portfolio and reviews.", "With service providers who work for us under contract: website hosting (Vercel), our database and file storage (Supabase), WhatsApp (Meta) and our WhatsApp messaging provider, email delivery, Google Workspace or Drive for delivering files, the KYC provider for DigiLocker checks, and a payment gateway once card payments are added.", "With authorities, when the law requires it, or to protect someone's safety or our legal rights."] },
        "Some providers store data outside India. We use providers that protect data to standards comparable to the DPDP Act, and we follow any restrictions the Government of India places on transfers.",
      ],
    },
    {
      id: "keep",
      heading: "How long we keep it",
      body: [
        { list: ["Bookings, payments and invoices: as long as tax and accounting law requires (currently up to 8 years).", "Enquiries that didn't become bookings: up to 12 months after the last contact.", "Artist applications that weren't selected: up to 12 months, so you can reapply.", "Delivered photos and videos: only until the delivery link expires (we remind you to download before then).", "Marketing preferences: until you withdraw consent."] },
        "After that we delete the data or make it anonymous.",
      ],
    },
    {
      id: "rights",
      heading: "Your rights",
      body: [
        "Under the DPDP Act you can:",
        { list: ["Ask for a summary of the personal data we hold about you and who we've shared it with.", "Ask us to correct, complete or update it.", "Ask us to erase it, unless we must keep it by law (for example invoices).", "Withdraw consent you have given.", "Nominate someone to exercise these rights if you die or can't do so yourself.", "Raise a grievance with us, and if you're not satisfied, complain to the Data Protection Board of India."] },
        `To use any of these, contact us at ${contact}. We may ask you to confirm your identity. We aim to reply within 30 days.`,
      ],
    },
    {
      id: "children",
      heading: "Children",
      body: [
        "Bookings must be made by adults (18 or over). We don't knowingly collect data directly from children. Events can include children, and the customer who books is responsible for the consent of the people photographed or filmed at their event.",
      ],
    },
    {
      id: "events",
      heading: "Photos and videos from your event",
      body: [
        "Artists take photos and videos for you. We and the artist will use them in portfolios, social media or marketing only with your permission, which you can refuse or withdraw at any time.",
      ],
    },
    {
      id: "security",
      heading: "How we protect it",
      body: [
        "We limit access to staff who need it, use providers with encryption in transit and at rest, keep artists' uploaded documents private, and require 2-step verification for staff accounts. No system is perfectly secure; if a breach affects you, we will tell you and the Data Protection Board as the DPDP Act requires.",
      ],
    },
    {
      id: "contact",
      heading: "Grievances and contact",
      body: [
        `Grievance officer: [name to add], ${brand.fullName}, ${brand.city}, ${brand.region}. Email ${brand.email}, phone ${brand.phoneDisplay}.`,
        "We may update this policy. We'll change the date at the top, and tell you about significant changes on WhatsApp or email.",
      ],
    },
  ],
};

export const terms: LegalDoc = {
  slug: "terms",
  title: "Terms of service",
  description: "The terms for booking artists through Artists on Demand: our role, quotes and payments, bookings, deliverables, conduct and liability.",
  updated,
  intro: `These terms apply when you use ${brand.domain}, our artist portal or payment page, or book an artist through ${brand.fullName} ("AOD", "we"). By making a booking request or paying, you agree to them. Our Cancellation & refund policy and Privacy policy are part of these terms.`,
  sections: [
    {
      id: "role",
      heading: "What AOD does",
      body: [
        "AOD is a marketplace. We vet artists, match them to your request, send you a quote, collect payment and stay your point of contact until delivery. Artists are independent professionals, not AOD employees; they decide how to do their creative work within the brief you agree.",
      ],
    },
    {
      id: "use",
      heading: "Using the site",
      body: [
        { list: ["You must be 18 or over to book.", "Give accurate details (event date, venue, contact) so we can match and plan correctly.", "Don't misuse the site: no false bookings, scraping, attempts to break in, or harassment of artists or staff."] },
      ],
    },
    {
      id: "booking",
      heading: "Requests, quotes and bookings",
      body: [
        { list: ["A booking request is not a booking. We reply with matched artists and a quote.", "A quote is valid for the time shown on it (usually 48 hours), because artists' dates fill up.", "A booking is confirmed only when we have verified your payment (usually an advance) and confirmed it to you on WhatsApp or email. Opening a chat or sharing a transaction ID is not a confirmation.", "The quote lists what's included: hours, deliverables, travel, and anything you must provide (for example power, access or meals for long events)."] },
      ],
    },
    {
      id: "payment",
      heading: "Prices and payment",
      body: [
        { list: ["Prices are in Indian rupees. Each quote states whether GST is included. AOD's GSTIN: [to add].", "Pay only to AOD's official UPI ID or bank account shown on our payment page or in our messages. Don't pay artists directly for a booking made through AOD; we can't protect payments made outside AOD.", "The balance (if any) is due by the date shown on your quote, before the event unless agreed otherwise.", "Card, netbanking and wallet payments will be added through a payment gateway; until then we accept UPI and bank transfer."] },
      ],
    },
    {
      id: "changes",
      heading: "Cancellations, rescheduling and replacements",
      body: ["These are covered by our Cancellation & refund policy. If an artist can't attend, we'll offer a suitable replacement or a refund, as that policy explains."],
    },
    {
      id: "event",
      heading: "At the event",
      body: [
        { list: ["You're responsible for the venue's permission for photography, filming, music or drones, and for a safe working environment.", "Artists may stop work if they are harassed or unsafe; such a stoppage isn't a breach by the artist.", "Overtime beyond the booked hours is charged at the rate in the quote, only if you agree to it."] },
      ],
    },
    {
      id: "deliverables",
      heading: "Deliverables and copyright",
      body: [
        { list: ["Photos, videos and edits are delivered through a link we manage, within the time stated in the quote. Download them before the link expires.", "The artist keeps the copyright in their work. You get the right to use the deliverables for your personal, non-commercial purposes; business bookings get the usage rights stated in the quote or contract.", "AOD and the artist may show the work in portfolios or marketing only with your permission."] },
      ],
    },
    {
      id: "artists",
      heading: "If you are an artist",
      body: [
        "Artists also sign AOD's artist agreement after approval, which covers rates, payouts, conduct and cancellations. Customers introduced through AOD should be booked through AOD for 12 months after the introduction.",
      ],
    },
    {
      id: "reviews",
      heading: "Reviews",
      body: ["Reviews must be honest and about your own booking. We may remove reviews that are abusive, fake or unrelated, but not because they're negative."],
    },
    {
      id: "liability",
      heading: "Our responsibility",
      body: [
        { list: ["We take care in vetting and matching artists and in handling your booking, and we'll help put things right if something goes wrong.", "To the extent the law allows, AOD's total liability for a booking is limited to the amount you paid for it, and we're not liable for indirect losses.", "Nothing in these terms limits your rights under the Consumer Protection Act, 2019, or our liability where the law doesn't allow it to be limited.", "We're not responsible for delays or failures caused by events beyond reasonable control, such as natural disasters, government orders or widespread outages; the refund policy explains what happens then."] },
      ],
    },
    {
      id: "law",
      heading: "Law and disputes",
      body: [`These terms are governed by the laws of India. Please contact us first at ${contact}; most issues are solved quickly. Otherwise, the courts at ${brand.city}, ${brand.region}, have jurisdiction.`],
    },
    {
      id: "updates",
      heading: "Changes to these terms",
      body: ["We may update these terms. The version that applies to your booking is the one in force when the booking was confirmed."],
    },
  ],
};

export const refunds: LegalDoc = {
  slug: "refund-policy",
  title: "Cancellation & refund policy",
  description: "How to cancel or reschedule an Artists on Demand booking, what you get back and when, and what happens if an artist can't attend.",
  updated,
  intro: "Plans change. This policy explains how cancelling and rescheduling work, what is refunded, and what we do if an artist can't make it. Days are counted to the event date, from when we receive your message.",
  sections: [
    {
      id: "how",
      heading: "How to cancel or reschedule",
      body: [`Message us on WhatsApp or email ${brand.email} with your booking reference (for example B-1204). We'll confirm in writing and, for refunds, tell you the amount and timeline.`],
    },
    {
      id: "customer",
      heading: "If you cancel",
      body: [
        { list: ["30 days or more before the event: full refund of what you've paid, minus any payment processing charges.", "15 to 29 days before: 50% of the advance is refunded, plus anything you paid beyond the advance.", "Less than 15 days before: the advance isn't refunded, because the artist has turned down other work for your date. Anything paid beyond the advance is refunded. You can choose a reschedule instead (below)."] },
      ],
    },
    {
      id: "reschedule",
      heading: "Rescheduling",
      body: [
        { list: ["You can move your booking to a new date once, free of charge, if you tell us at least 7 days before the event and the artist (or a replacement you're happy with) is available.", "The new date must be within 6 months. If the price for the new date is different, you pay or get back the difference.", "Requests made less than 7 days before the event are treated as a cancellation, unless the artist agrees."] },
      ],
    },
    {
      id: "artist",
      heading: "If the artist cancels or doesn't show up",
      body: [
        { list: ["We'll offer a replacement artist of the same or better standing at no extra cost.", "If we can't find one, or you'd rather not, you get a full refund of everything you paid for that booking.", "If an artist doesn't show up without notice, you also get a full refund, and we'll work with you on a replacement where there's still time."] },
      ],
    },
    {
      id: "beyond",
      heading: "Events beyond anyone's control",
      body: ["If the event can't happen because of natural disasters, government orders or similar events, we'll reschedule free of charge within 6 months, or refund what you paid minus any costs already incurred (such as artist travel booked for you)."],
    },
    {
      id: "quality",
      heading: "If something isn't right",
      body: ["Tell us within 7 days of delivery. We'll work with the artist to fix it, such as a re-edit or missing files. If the work was clearly not as agreed in the quote, we may offer a partial refund after reviewing it with you."],
    },
    {
      id: "business",
      heading: "Business bookings",
      body: ["Retainers, multi-day and corporate bookings follow the cancellation terms in their contract or quote; where it says nothing, this policy applies."],
    },
    {
      id: "timing",
      heading: "When refunds arrive",
      body: ["Approved refunds are sent within 7 working days to the UPI ID or bank account you paid from. Your bank may take a few more days to show it."],
    },
  ],
};

export const legalDocs = [privacy, terms, refunds];
