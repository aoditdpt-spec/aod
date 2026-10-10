"use server";

import { categories } from "@/content/site";
import type { CustomerOrder } from "@/content/my-bookings";
import { backendEnabled } from "@/lib/backend";
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
  // Request AOD-1215 starts with booking B-1215 (src/server/actions/public.ts).
  const firstOfRequest = (b: (typeof bookings)[number]) => !b.requestRef || b.id === `B-${b.requestRef.replace(/^AOD-/, "")}`;

  // Artist name and craft for matched bookings.
  const artistIds = [...new Set(bookings.map((b) => b.artistId).filter((x): x is string => Boolean(x)))];
  const artists = new Map<string, { name: string; craft: string; city: string }>();
  if (artistIds.length) {
    const { data } = await db.from("artists").select("id, name, category, city").in("id", artistIds);
    for (const a of data ?? []) artists.set(String(a.id), { name: String(a.name), craft: categoryName(String(a.category)), city: String(a.city) });
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
      services: [b.service || categoryName(b.category)],
      date: b.date,
      time: b.time || undefined,
      endTime: b.endTime,
      city: b.city,
      venue: b.venue || undefined,
      notes: b.notes || undefined,
      artist: b.artistId ? artists.get(b.artistId) : undefined,
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
