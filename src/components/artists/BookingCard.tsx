"use client";

import { CalendarDays, Clock, IndianRupee, MapPin, Users, UsersRound } from "lucide-react";
import { useState } from "react";
import { sampleBookings, type BookingStatus, type SampleBooking } from "@/content/artist-portal";
import { backendEnabled } from "@/lib/backend";
import { answerRequest, usePortalState } from "@/lib/artist-live";
import { bookingActionsStore } from "@/lib/artist-store";
import { whatsappUrl } from "@/lib/whatsapp";
import { Spinner } from "@/components/ui/Spinner";
import { Badge, inputBase } from "./form";

export type Booking = SampleBooking & { quote?: string };

// Live: the artist's real requests and bookings. Preview: the sample bookings with whatever the
// artist has done to them in this browser.
export function useBookings(): Booking[] {
  const live = usePortalState();
  const actions = bookingActionsStore.use();
  if (backendEnabled) return live.data?.bookings ?? [];
  return sampleBookings.map((b) => {
    const a = actions[b.id];
    return a && b.status === "new" ? { ...b, status: a.status, quote: a.quote } : b;
  });
}

const statusBadge: Record<BookingStatus, { tone: "neutral" | "brand" | "good" | "wait"; label: string }> = {
  new: { tone: "brand", label: "New request" },
  quoted: { tone: "wait", label: "Quote sent · waiting for customer" },
  selected: { tone: "good", label: "You're chosen · waiting for the advance" },
  confirmed: { tone: "good", label: "Confirmed" },
  completed: { tone: "neutral", label: "Completed" },
  declined: { tone: "neutral", label: "Declined" },
  cancelled: { tone: "neutral", label: "Cancelled" },
};

// One booking request or booking. New requests can be answered with a quote or declined.
export function BookingCard({ booking, compact = false }: { booking: Booking; compact?: boolean }) {
  const [quoting, setQuoting] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<"quoted" | "declined" | null>(null); // the reply being sent
  const badge = statusBadge[booking.status];

  function act(status: "quoted" | "declined", quote?: string) {
    if (sending) return;
    setSending(status);
    void answerRequest(booking.id, status, quote)
      .then((err) => err && setError(err))
      .finally(() => setSending(null));
  }

  return (
    <article className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted">{booking.id}</p>
          <h3 className="mt-0.5 text-lg font-bold text-ink">
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
        {booking.team && (
          <li className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-muted" aria-hidden /> Team of {booking.team}: {["new", "quoted", "declined"].includes(booking.status) ? "you'd be" : "you're"} one of them
          </li>
        )}
        <li className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-muted" aria-hidden />
          {booking.status === "quoted" && booking.quote ? `Your quote: ₹${Number(booking.quote).toLocaleString("en-IN")}` : `Budget ${booking.budget}`}
        </li>
      </ul>
      {!compact && booking.note && <p className="mt-3 rounded-lg bg-wash p-3 text-sm text-ink">&ldquo;{booking.note}&rdquo;</p>}
      {/* The customer's "Brief for the artists": what they want from this artist. */}
      {!compact && booking.brief && booking.brief.length > 0 && (
        <div className="mt-3 rounded-lg border border-line p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">The customer&apos;s brief</p>
          <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
            {booking.brief.map((r) => (
              <div key={r.label} className="contents">
                <dt className="text-muted">{r.label}</dt>
                <dd className="whitespace-pre-line text-ink">{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

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
              <button
                type="submit"
                disabled={sending !== null}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-wait"
              >
                {sending === "quoted" ? (
                  <>
                    <Spinner /> Sending…
                  </>
                ) : (
                  "Send quote"
                )}
              </button>
              <button type="button" onClick={() => setQuoting(false)} className="h-11 px-3 text-sm font-medium text-muted hover:text-ink">
                Cancel
              </button>
              {error && <p className="w-full text-xs text-red-600">{error}</p>}
              <p className="w-full text-xs text-muted">
                {backendEnabled ? "AOD sees your quote straight away and shares the shortlist with the customer." : "Preview: the quote isn't sent to anyone; it only changes this card."}
              </p>
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
                disabled={sending !== null}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-5 text-sm font-medium text-body hover:border-ink hover:text-ink disabled:cursor-wait"
              >
                {sending === "declined" ? (
                  <>
                    <Spinner /> Declining…
                  </>
                ) : (
                  "Decline"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {error && !quoting && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {(booking.status === "confirmed" || booking.status === "selected") && !compact && (
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
