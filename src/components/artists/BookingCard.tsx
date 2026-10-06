"use client";

import { CalendarDays, Clock, IndianRupee, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { sampleBookings, type BookingStatus, type SampleBooking } from "@/content/artist-portal";
import { bookingActionsStore } from "@/lib/artist-store";
import { whatsappUrl } from "@/lib/whatsapp";
import { Badge, inputBase } from "./form";

export type Booking = SampleBooking & { quote?: string };

// The sample bookings with whatever the artist has done to them in this browser.
export function useBookings(): Booking[] {
  const actions = bookingActionsStore.use();
  return sampleBookings.map((b) => {
    const a = actions[b.id];
    return a && b.status === "new" ? { ...b, status: a.status, quote: a.quote } : b;
  });
}

const statusBadge: Record<BookingStatus, { tone: "neutral" | "brand" | "good" | "wait"; label: string }> = {
  new: { tone: "brand", label: "New request" },
  quoted: { tone: "wait", label: "Quote sent · waiting for customer" },
  confirmed: { tone: "good", label: "Confirmed" },
  completed: { tone: "neutral", label: "Completed" },
  declined: { tone: "neutral", label: "Declined" },
};

// One booking request or booking. New requests can be answered with a quote or declined.
export function BookingCard({ booking, compact = false }: { booking: Booking; compact?: boolean }) {
  const [quoting, setQuoting] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const badge = statusBadge[booking.status];

  function act(status: "quoted" | "declined", quote?: string) {
    bookingActionsStore.set({ ...bookingActionsStore.get(), [booking.id]: { status, quote } });
  }

  return (
    <article className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted">{booking.id}</p>
          <h3 className="mt-0.5 text-lg font-medium text-ink">
            {booking.event} · {booking.service}
          </h3>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-body sm:grid-cols-2">
        <li className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted" aria-hidden /> {booking.date}
        </li>
        <li className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted" aria-hidden /> {booking.city}
        </li>
        {booking.guests && (
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted" aria-hidden /> {booking.guests}
          </li>
        )}
        <li className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-muted" aria-hidden />
          {booking.status === "quoted" && booking.quote ? `Your quote: ₹${Number(booking.quote).toLocaleString("en-IN")}` : `Budget ${booking.budget}`}
        </li>
      </ul>
      {!compact && booking.note && <p className="mt-3 rounded-lg bg-wash p-3 text-sm text-ink">&ldquo;{booking.note}&rdquo;</p>}

      {booking.status === "new" && (
        <div className="mt-4 border-t border-line pt-4">
          {booking.replyBy && (
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-brand">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {booking.replyBy}
            </p>
          )}
          {quoting ? (
            <form
              className="flex flex-wrap items-start gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\d{3,7}$/.test(amount)) {
                  setError("Enter your quote in rupees.");
                  return;
                }
                act("quoted", amount);
              }}
            >
              <div className="flex min-w-[12rem] flex-1">
                <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-wash px-3 text-sm text-muted">₹</span>
                <input
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value.replace(/\D/g, "").slice(0, 7));
                    setError(null);
                  }}
                  inputMode="numeric"
                  placeholder="Your quote"
                  aria-label="Your quote in rupees"
                  aria-invalid={!!error}
                  autoFocus
                  className={`${inputBase} rounded-l-none py-2.5`}
                />
              </div>
              <button type="submit" className="h-11 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover">
                Send quote
              </button>
              <button type="button" onClick={() => setQuoting(false)} className="h-11 px-3 text-sm font-medium text-muted hover:text-ink">
                Cancel
              </button>
              {error && <p className="w-full text-xs text-red-600">{error}</p>}
              <p className="w-full text-xs text-muted">Preview: the quote isn&apos;t sent to anyone; it only changes this card.</p>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuoting(true)}
                className="h-10 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover"
              >
                Send a quote
              </button>
              <button
                type="button"
                onClick={() => act("declined")}
                className="h-10 rounded-lg border border-line px-5 text-sm font-medium text-body hover:border-ink hover:text-ink"
              >
                Decline
              </button>
            </div>
          )}
        </div>
      )}

      {booking.status === "confirmed" && !compact && (
        <a
          href={whatsappUrl(`Hi AOD, about booking ${booking.id} (${booking.event}, ${booking.date}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex text-sm font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
        >
          Questions about this booking? Message AOD
        </a>
      )}
    </article>
  );
}
