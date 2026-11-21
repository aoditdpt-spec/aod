// The newsletter's wording: the confirmation email, the confirm and unsubscribe pages, and the footer of
// every issue (src/server/actions/newsletter.ts). Blog posts are written in the admin and kept in the database.

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
