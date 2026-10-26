"use server";

import { categories } from "@/content/site";
import type { CustomerOrder } from "@/content/my-bookings";
import { backendEnabled } from "@/lib/backend";
import { after } from "next/server";
import { assignedArtists, itemsLabel, totalNeeded, withCount } from "@/lib/booking-needs";
import { canCancel, customerCancelHours } from "@/content/my-bookings";
import { sectionUrl } from "@/lib/site-url";
import { notifyEnabled, runOrQueue, teamEmails } from "@/server/notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { customerTopic } from "@/server/live";
import { fromRow } from "@/server/rows";

// My bookings for the signed-in customer: only bookings made with the email they signed in with
// (checked here), and only what a customer should see (no internal notes or shortlists).
// Customers can't read the tables directly. `topic` is their live-update channel.

export type MyOrders = { email: string; orders: CustomerOrder[]; topic: string };

const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

export async function myOrders(): Promise<MyOrders | null> {
  if (!backendEnabled) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email?.toLowerCase();
  if (!email) return null;
  if (!process.env.SUPABASE_SECRET_KEY) throw new Error("My bookings isn't set up yet (SUPABASE_SECRET_KEY).");
  const db = createAdminClient();
  const topic = customerTopic(email);

  const { data: rows, error } = await db.from("bookings").select("*").eq("customer_email", email).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const bookings = (rows ?? []).map(fromRow.booking);
  if (!bookings.length) return { email, orders: [], topic };

  // Payments name a booking id, or the request reference for the whole request.
  const refs = [...new Set(bookings.flatMap((b) => [b.id, b.requestRef]).filter((x): x is string => Boolean(x)))];
  const { data: payRows } = await db.from("payments").select("*").in("booking_id", refs);
  const payments = (payRows ?? []).map(fromRow.payment);
  // An older request AOD-1215 starts with booking B-1215; a new order's reference is its own ID
  // (AOD-PH-102601, src/server/actions/public.ts).
  const firstOfRequest = (b: (typeof bookings)[number]) =>
    !b.requestRef || b.id === b.requestRef || b.id === `B-${b.requestRef.replace(/^AOD-/, "")}`;

  // Name and city of the artists matched to each booking (their craft is the line they're on).
  const artistIds = [...new Set(bookings.flatMap((b) => assignedArtists(b.items)))];
  const artists = new Map<string, { name: string; city: string }>();
  if (artistIds.length) {
    const { data } = await db.from("artists").select("id, name, city").in("id", artistIds);
    for (const a of data ?? []) artists.set(String(a.id), { name: String(a.name), city: String(a.city) });
  }

  const orders = bookings.map((b): CustomerOrder => {
    // A payment made against the request reference counts once, on the request's first booking.
    const own = payments.filter(
      (p) => p.status !== "rejected" && (p.bookingId === b.id || (b.requestRef && p.bookingId === b.requestRef && firstOfRequest(b))),
    );
    const verified = own.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
    const remaining = b.quote ? b.quote - verified : 0;
    return {
      id: b.id,
      ref: b.requestRef,
      sample: false,
      createdAt: b.createdAt,
      status: b.status,
      occasion: b.event || "Booking",
      services: b.items.map((i) => withCount(i.service || categoryName(i.category), i.count)),
      audience: b.audience === "Business" ? "business" : "personal",
      again: b.items.map((i) => ({ slug: i.category, count: i.count })),
      date: b.date,
      time: b.time || undefined,
      endTime: b.endTime,
      city: b.city,
      venue: b.venue || undefined,
      notes: b.notes || undefined,
      artists: b.items.flatMap((i) =>
        i.artistIds.flatMap((id) => {
          const a = artists.get(id);
          return a ? [{ ...a, craft: categoryName(i.category) }] : [];
        }),
      ),
      needed: totalNeeded(b.items) > 1 ? totalNeeded(b.items) : undefined,
      quote: b.quote,
      advance: b.advance,
      payments: own.map((p) => ({ amount: p.amount, utr: p.utr, at: p.reportedAt, status: p.status === "verified" ? "verified" : "pending" })),
      balance: b.status === "confirmed" && remaining > 0 ? { amount: remaining, dueBy: b.date } : undefined,
      delivery: b.delivery,
      review: b.review,
      history: b.history.map((h) => ({ status: h.status, at: h.at })),
    };
  });
  return { email, orders, topic };
}

export async function submitReview(bookingId: string, rating: number, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return { ok: false, error: "Reviews aren't set up yet." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email?.toLowerCase();
  if (!email) return { ok: false, error: "Please sign in again." };
  const stars = Math.round(Number(rating));
  const words = String(text ?? "").trim().slice(0, 1000);
  if (!(stars >= 1 && stars <= 5) || !words) return { ok: false, error: "Pick a rating and write a line or two." };

  // Only the customer's own booking, once the event is done.
  const db = createAdminClient();
  const { data } = await db.from("bookings").select("*").eq("id", bookingId).eq("customer_email", email).maybeSingle();
  if (!data) return { ok: false, error: "Booking not found." };
  const b = fromRow.booking(data);
  if (!["completed", "delivered"].includes(b.status)) return { ok: false, error: "You can review a booking once the event is done." };

  const at = new Date().toISOString();
  const { error } = await db
    .from("bookings")
    .update({ review: { rating: stars, text: words }, status: "reviewed", history: [...b.history, { at, by: "Customer", status: "reviewed" }] })
    .eq("id", b.id);
  if (error) return { ok: false, error: "Couldn't save your review. Please try again." };
  return { ok: true };
}

// The customer cancels their own booking, within customerCancelHours of making it (checked here
// again: the page's button only shows while it's allowed). The team is emailed (unless switched off
// in admin Settings) and the customer gets a confirmation.
export async function cancelMyBooking(bookingId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return { ok: false, error: "Cancelling isn't set up yet." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email?.toLowerCase();
  if (!email) return { ok: false, error: "Please sign in again." };

  const db = createAdminClient();
  const { data } = await db.from("bookings").select("*").eq("id", String(bookingId)).eq("customer_email", email).maybeSingle();
  if (!data) return { ok: false, error: "Booking not found." };
  const b = fromRow.booking(data);
  if (b.status === "cancelled") return { ok: true };
  if (!canCancel(b)) {
    return {
      ok: false,
      error: `Bookings can be cancelled here within ${customerCancelHours} hours of booking. Message AOD on WhatsApp to cancel this one; the refund policy applies.`,
    };
  }

  const at = new Date().toISOString();
  const minutes = Math.max(1, Math.round((Date.now() - new Date(b.createdAt).getTime()) / 60_000));
  const { error } = await db
    .from("bookings")
    .update({
      status: "cancelled",
      history: [...b.history, { at, by: "Customer", status: "cancelled" }],
      notes_log: [{ at, by: "Customer", text: `Cancelled by the customer in My bookings, ${minutes} min after booking.` }, ...b.notesLog],
    })
    .eq("id", b.id)
    .neq("status", "cancelled");
  if (error) return { ok: false, error: "Couldn't cancel just now. Please try again, or message AOD on WhatsApp." };

  const ref = b.requestRef ?? b.id;
  const what = itemsLabel(b.items.map((i) => ({ service: i.service || categoryName(i.category), count: i.count })));
  after(async () => {
    const jobs: Parameters<typeof runOrQueue>[0] = [
      {
        kind: "email",
        to: [email],
        subject: `Your booking ${ref} is cancelled`,
        text: `Hi ${b.customer.name},

Your booking ${ref} (${what}, ${b.date}, ${b.city}) is cancelled, as you asked in My bookings.

Changed your mind? Just send a new request.

– Team AOD`,
      },
    ];
    if (await notifyEnabled("Customer cancelled a booking")) {
      jobs.push({
        kind: "email",
        to: await teamEmails(),
        subject: `${b.customer.name} cancelled ${ref} (${what})`,
        text: `${b.customer.name} cancelled ${b.id} (${what}, ${b.event}, ${b.date}, ${b.city}) in My bookings, ${minutes} min after booking.

Open it: ${sectionUrl("admin", `/bookings?open=${b.id}`)}`,
        replyTo: email,
      });
    }
    await runOrQueue(jobs);
  });
  return { ok: true };
}
