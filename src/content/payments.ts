// Copy and settings for the payment page: served at /pay for now, and on pay.aod.co.in once
// that domain points here (see src/proxy.ts).
//
// Today payments go by UPI straight to AOD's account: the page shows a QR code and opens the
// payer's UPI app, then the payer sends the transaction ID on WhatsApp and the team checks it.
// The page never says a payment is received or confirmed, because it can't see the bank account.
// Razorpay (cards, netbanking, wallets, automatic confirmation) plugs in later; see CLAUDE.md.

export const payee = {
  // Set these on Vercel. Without a UPI ID the page explains that payments aren't set up yet,
  // rather than showing a QR code that pays the wrong account.
  upiId: process.env.NEXT_PUBLIC_UPI_ID ?? "",
  name: process.env.NEXT_PUBLIC_UPI_NAME || "Artists on Demand",
};

// Bank transfer (NEFT / IMPS) details shown under the QR code, for payments above the UPI limit
// or from corporate accounts. Shown only when the account number and IFSC are set.
export const bank = {
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "",
  ifsc: process.env.NEXT_PUBLIC_BANK_IFSC ?? "",
  bankName: process.env.NEXT_PUBLIC_BANK_NAME ?? "",
};

export const purposes = ["Booking advance", "Full payment", "Balance payment", "Business invoice", "Other"];

// Buttons that open a specific app with the payment filled in. "Any UPI app" (upi://) shows the
// phone's app chooser on Android; iPhones need an app-specific link, hence the two schemes.
export const upiApps = [
  { name: "Google Pay", android: "tez://upi/pay", ios: "gpay://upi/pay" },
  { name: "PhonePe", android: "phonepe://pay", ios: "phonepe://pay" },
  { name: "Paytm", android: "paytmmp://pay", ios: "paytmmp://pay" },
];

export const payCopy = {
  title: "Pay Artists on Demand",
  subtitle: "Pay by UPI from any app. The money goes straight to AOD's bank account.",
  checkName: "Before you pay, check that your UPI app shows the name",
  afterPay:
    "After paying, send us the 12-digit UPI transaction ID from your app. Our team matches it with the payment and confirms on WhatsApp, usually within a few hours.",
  notConfirmed: "Waiting for AOD to confirm",
  cardsSoon: "Cards, netbanking and wallets",
  setupMissing:
    "Online payments aren't switched on yet. Please message us on WhatsApp and we'll share the payment details.",
};
