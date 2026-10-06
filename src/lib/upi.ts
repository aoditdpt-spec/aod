// UPI payment helpers for the payment page: build the upi:// link that UPI apps open (and that
// the QR code encodes), and check amounts and transaction references. No imports, so it can
// be tested on its own (npm run check:pay).

export type UpiPayment = {
  upiId: string; // payee VPA, e.g. artistsondemand@okaxis
  payeeName: string;
  amount: number; // rupees
  note: string; // shown in the payer's app and on AOD's bank statement
};

// Most UPI apps cap a single payment at ₹1,00,000.
export const UPI_MAX = 100000;

export const isUpiId = (v: string) => /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/.test(v.trim());

// Rupees from what the payer typed or what a link carries: digits, optional commas and paise.
export function parseAmount(input: string): number | null {
  const clean = input.replace(/[,\s₹]/g, "");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(clean)) return null;
  const n = Math.round(Number(clean) * 100) / 100;
  return n > 0 ? n : null;
}

export function amountProblem(amount: number | null): string | null {
  if (amount === null) return "Enter the amount in rupees.";
  if (amount < 1) return "The amount must be at least ₹1.";
  if (amount > UPI_MAX) return "UPI allows up to ₹1,00,000 per payment. Split it into two payments, or ask us for bank details.";
  return null;
}

export const formatINR = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

// Keep notes short and plain: some apps reject long notes or special characters.
export const cleanNote = (s: string) => s.replace(/[^a-zA-Z0-9 .,/-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);

// The upi:// link. Built by hand rather than with URLSearchParams, because several apps show
// "+" literally instead of a space, and some reject an encoded "@" in the UPI ID.
export function upiUrl(p: UpiPayment, scheme = "upi://pay"): string {
  const parts = [
    `pa=${p.upiId.trim()}`,
    `pn=${encodeURIComponent(p.payeeName)}`,
    `am=${p.amount.toFixed(2)}`,
    "cu=INR",
    `tn=${encodeURIComponent(cleanNote(p.note))}`,
  ];
  return `${scheme}?${parts.join("&")}`;
}

// The UPI transaction ID / UTR the payer's app shows after paying: 12 digits.
export function cleanUtr(input: string): string {
  return input.replace(/\s/g, "");
}
export const isUtr = (input: string) => /^\d{12}$/.test(cleanUtr(input));
