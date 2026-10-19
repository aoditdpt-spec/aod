// Copy for the blog (aod.co.in/blog) and the newsletter (the sign-up box in the footer and on the
// blog, the confirm and unsubscribe pages, and the emails). Posts themselves are written in the
// admin (Blog) and kept in the database; `samplePosts` only show in the preview (no Supabase keys),
// labelled "Sample", so the pages can be seen working.

import type { Post } from "@/lib/admin-store";

export const blog = {
  title: "Blog",
  eyebrow: "The AOD blog",
  heading: "Tips, stories and advice from AOD",
  intro:
    "Planning tips for weddings, parties and brand shoots, stories from our artists, and advice for artists on getting booked and paid on time.",
  empty: "The first posts are on their way. Join the newsletter below to hear when they're out.",
  readMore: "Read the post",
  morePosts: "More from the blog",
  allPosts: "All posts",
  share: "Share on WhatsApp",
  bookTitle: "Ready to book?",
  bookText: "Tell us what you need in three quick questions, and we'll reply with curated matches.",
  bookCta: "Get your artist",
  description: "Planning tips for weddings and events, artist stories, and advice for artists from Artists on Demand, Ahmedabad.",
};

export const newsletter = {
  title: "Get the AOD newsletter",
  text: "Booking tips, artist stories and new categories, about once a month. No spam, ever.",
  placeholder: "you@example.com",
  button: "Subscribe",
  sending: "Subscribing…",
  consent: "We'll email you once to confirm. Unsubscribe any time with one click.",
  done: "Almost there: check your inbox and tap the link to confirm your subscription.",
  preview: "The newsletter isn't connected yet, so nothing was saved.",
  // The confirmation email.
  confirmSubject: "Confirm your AOD newsletter subscription",
  confirmIntro: "Tap the link below to confirm you'd like the AOD newsletter: booking tips, artist stories and new categories, about once a month.",
  confirmIgnore: "Didn't sign up? Ignore this email and you won't hear from us.",
  // The confirm and unsubscribe pages.
  confirmPageTitle: "Confirm your subscription",
  confirmPageText: "One tap and you're on the list for the AOD newsletter.",
  confirmButton: "Yes, subscribe me",
  confirmedTitle: "You're subscribed",
  confirmedText: "Thanks! The next AOD newsletter will land in your inbox.",
  unsubscribePageTitle: "Unsubscribe from the AOD newsletter",
  unsubscribePageText: "You'll stop getting the newsletter. Booking emails (confirmations and updates) aren't affected.",
  unsubscribeButton: "Unsubscribe",
  unsubscribedTitle: "You're unsubscribed",
  unsubscribedText: "You won't get the AOD newsletter any more. Changed your mind? Subscribe again from any page's footer.",
  badLink: "This link doesn't work any more. It may be old or copied incompletely.",
  // The footer of every newsletter issue.
  emailFooter: "You're getting this because you subscribed to the AOD newsletter.",
  unsubscribeLabel: "Unsubscribe",
};

const day = 86_400_000;
const at = (daysAgo: number) => new Date(Date.UTC(2026, 9, 18) - daysAgo * day).toISOString();

export const samplePosts: Post[] = [
  {
    id: "P-102",
    slug: "how-to-choose-a-wedding-photographer",
    title: "How to choose a wedding photographer: 7 questions to ask",
    excerpt: "Full galleries, delivery dates, what the advance covers: the questions that save you from surprises after the wedding.",
    body: [
      "Your photos are the one thing from the wedding you keep for life, so it's worth ten minutes of questions before you book. These are the ones we ask on your behalf.",
      "## 1. Can I see a full wedding, not just the highlights?",
      "Every portfolio shows the best 20 frames. Ask for one complete gallery from a real wedding: it tells you how the photographer handles the dull light of a reception hall, the rush of the pheras and the group photos.",
      "## 2. How long until I get the photos and the film?",
      "Get the delivery date in writing, for the edited photos and the film separately. Ask what happens if it's late.",
      "## 3. What does the advance cover?",
      "Agree the total, the advance and when the balance is due **before** the event, and keep it on WhatsApp or email.",
      "## 4. Who will actually shoot?",
      "If it's a team, ask who leads it on the day, and whether it's the person whose work you saw.",
      "## More to ask",
      [
        "- How many hours are included, and what does overtime cost?",
        "- Will I get the raw photos, or only the edited ones?",
        "- What's the backup if the photographer falls ill?",
      ].join("\n"),
      "Booking through AOD? Tell us what you need and we'll send you [curated matches](/book) with clear quotes.",
    ].join("\n\n"),
    cover: "/categories/photographers.jpg",
    coverAlt: "A photographer at a wedding",
    tags: ["Weddings", "Photography"],
    author: "Team AOD",
    status: "published",
    publishedAt: at(2),
    createdAt: at(4),
    updatedAt: at(2),
  },
  {
    id: "P-101",
    slug: "artists-get-paid-on-time",
    title: "For artists: five habits that get you paid on time",
    excerpt: "A clear quote, an advance and a written note of what's agreed: small habits that keep invoices from being ghosted.",
    body: [
      "Most payment disputes start with something nobody wrote down. These five habits keep you on the safe side.",
      [
        "1. **Put the quote in writing.** WhatsApp counts: what's included, the hours, the delivery date and the total.",
        "2. **Take an advance.** It confirms the date you're blocking for the client.",
        "3. **Agree the cancellation terms.** What's kept if the event is called off a week before, or a day before.",
        "4. **Send an invoice with a due date.** Then a polite reminder on the day it's due.",
        "5. **Note any extra work.** Overtime or extra edits? Confirm the price on WhatsApp before you do it.",
      ].join("\n"),
      "> Client still not paying? Raise it with the AOD Dispute Desk: we hear both sides and help you settle it.",
    ].join("\n\n"),
    cover: "/categories/editors.jpg",
    coverAlt: "An editor at work",
    tags: ["For artists"],
    author: "Team AOD",
    status: "published",
    publishedAt: at(9),
    createdAt: at(10),
    updatedAt: at(9),
  },
];
