// "My bookings" for customers: copy, the status steps customers see, and sample bookings.
//
// PREVIEW: there is no backend yet. Sign-in accepts any code, and the bookings shown are
// samples (clearly labelled) plus the requests this browser sent from the booking form.
// When Supabase is added, this page lists the signed-in customer's real bookings.

import type { BookingStatus } from "@/lib/admin-store";

export const myBookingsCopy = {
  title: "My bookings",
  signInTitle: "See your bookings",
  signInText: "Sign in with the email you booked with. We'll send a 6-digit code.",
  empty: "No bookings yet. When you send a request, it shows up here.",
};

// What the customer sees at each stage (the admin pipeline, in customer words).
export const customerSteps: { id: BookingStatus; label: string; text: string }[] = [
  { id: "new", label: "Request received", text: "We have your request and are finding artists." },
  { id: "matched", label: "Artists matched", text: "We've picked the right artist for your event." },
  { id: "quoted", label: "Quote ready", text: "Your quote is ready. Pay the advance to lock the date." },
  { id: "payment_pending", label: "Payment check", text: "We're matching your payment with our bank account." },
  { id: "confirmed", label: "Booking confirmed", text: "The artist is locked in for your date." },
  { id: "completed", label: "Event done", text: "Hope it went well! Your files are being edited." },
  { id: "delivered", label: "Files delivered", text: "Download your files before the link expires." },
  { id: "reviewed", label: "Reviewed", text: "Thanks for your review." },
];

export type CustomerOrder = {
  id: string;
  ref?: string; // AOD-1215: the request reference the customer got when sending it
  sample: boolean;
  createdAt: string;
  status: BookingStatus | "sent";
  occasion: string;
  services: string[];
  date: string; // yyyy-mm-dd, or "" if not fixed
  time?: string; // start, HH:MM
  endTime?: string; // end, HH:MM
  city: string;
  venue?: string;
  notes?: string;
  artist?: { name: string; craft: string; city: string };
  quote?: number;
  advance?: number;
  payments: { amount: number; utr: string; at: string; status: "pending" | "verified" }[];
  balance?: { amount: number; dueBy: string };
  delivery?: { link: string; expires: string };
  review?: { rating: number; text: string };
  history: { status: BookingStatus; at: string }[];
};

// Sample bookings at different stages, with dates relative to today.
export function sampleOrders(now: Date): CustomerOrder[] {
  const day = (n: number, hour = 11) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const iso = (n: number, hour?: number) => day(n, hour).toISOString();
  const ymd = (n: number) => {
    const d = day(n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  return [
    {
      id: "AOD-1047",
      sample: true,
      createdAt: iso(-2, 18),
      status: "quoted",
      occasion: "Sangeet",
      services: ["Wedding / sangeet DJ"],
      date: ymd(32),
      time: "19:00",
      city: "Vadodara",
      venue: "Banquet hall, Alkapuri",
      notes: "About 250 guests, Bollywood and Garba mix.",
      artist: { name: "DJ Rohan Bhatt", craft: "Musicians & DJs", city: "Ahmedabad" },
      quote: 32000,
      advance: 9600,
      payments: [],
      history: [
        { status: "new", at: iso(-2, 18) },
        { status: "matched", at: iso(-1, 12) },
        { status: "quoted", at: iso(-1, 16) },
      ],
    },
    {
      id: "AOD-1042",
      sample: true,
      createdAt: iso(-9, 10),
      status: "confirmed",
      occasion: "Wedding",
      services: ["Wedding photography", "Candid photography"],
      date: ymd(24),
      time: "10:00",
      city: "Ahmedabad",
      venue: "Party plot, SG Highway",
      notes: "Two days: haldi and wedding.",
      artist: { name: "Aarav Joshi", craft: "Photographers", city: "Ahmedabad" },
      quote: 70000,
      advance: 21000,
      payments: [{ amount: 21000, utr: "427100583349", at: iso(-6, 13), status: "verified" }],
      balance: { amount: 49000, dueBy: ymd(17) },
      history: [
        { status: "new", at: iso(-9, 10) },
        { status: "matched", at: iso(-8, 12) },
        { status: "quoted", at: iso(-8, 15) },
        { status: "payment_pending", at: iso(-6, 13) },
        { status: "confirmed", at: iso(-6, 17) },
      ],
    },
    {
      id: "AOD-1019",
      sample: true,
      createdAt: iso(-40, 9),
      status: "delivered",
      occasion: "Pre-wedding",
      services: ["Pre-wedding shoot"],
      date: ymd(-21),
      time: "07:00",
      city: "Vadodara",
      venue: "Laxmi Vilas grounds",
      artist: { name: "Meera Trivedi", craft: "Photographers", city: "Vadodara" },
      quote: 22000,
      advance: 8000,
      payments: [
        { amount: 8000, utr: "426610938475", at: iso(-35, 10), status: "verified" },
        { amount: 14000, utr: "426702118930", at: iso(-23, 18), status: "verified" },
      ],
      delivery: { link: "https://example.com/drive/your-prewedding-photos", expires: ymd(9) },
      history: [
        { status: "new", at: iso(-40, 9) },
        { status: "matched", at: iso(-39, 12) },
        { status: "quoted", at: iso(-39, 15) },
        { status: "payment_pending", at: iso(-35, 10) },
        { status: "confirmed", at: iso(-35, 14) },
        { status: "completed", at: iso(-21, 13) },
        { status: "delivered", at: iso(-12, 11) },
      ],
    },
  ];
}
