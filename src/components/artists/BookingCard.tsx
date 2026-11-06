"use client";

import { CalendarDays, Clock, IndianRupee, MapPin, Users, UsersRound } from "lucide-react";
import { useState } from "react";
import { sampleBookings, type BookingStatus, type SampleBooking } from "@/content/artist-portal";
import { backendEnabled } from "@/lib/backend";
import { artistOrderLabels } from "@/lib/artist-orders";
import { answerRequest, usePortalState } from "@/lib/artist-live";
import { bookingActionsStore } from "@/lib/artist-store";
import { whatsappUrl } from "@/lib/whatsapp";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "./form";

export type Booking = SampleBooking & { quote?: string; ref?: string };

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

// The labels are shared with the admin's artist drawer (src/lib/artist-orders.ts).
const tones: Record<BookingStatus, "neutral" | "brand" | "good" | "wait"> = {
  new: "brand",
  accepted: "wait",
  shortlisted: "good",
  quoted: "wait",
  selected: "good",
  confirmed: "good",
  completed: "neutral",
  declined: "neutral",
  cancelled: "neutral",
};
const statusBadge = Object.fromEntries(
  (Object.keys(tones) as BookingStatus[]).map((s) => [s, { tone: tones[s], label: artistOrderLabels[s] }]),
) as Record<BookingStatus, { tone: (typeof tones)[BookingStatus]; label: string }>;

// One booking request or booking. New requests can be answered with a quote or declined.
export function BookingCard({ booking, compact = false }: { booking: Booking; compact?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState<"accepted" | "declined" | null>(null); // the answer being sent
  const badge = statusBadge[booking.status];

  function act(status: "accepted" | "declined") {
    if (sending) return;
    setError(null);
    setSending(status);
    void answerRequest(booking.id, status)
      .then((err) => err && setError(err))
      .finally(() => setSending(null));
  }

  return (
    <article className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted">{booking.ref ?? booking.id}</p>
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
            <UsersRound className="h-4 w-4 text-muted" aria-hidden /> Team of {booking.team}: {["new", "accepted", "quoted", "declined"].includes(booking.status) ? "you'd be" : "you're"} one of them
          </li>
        )}
        <li className="flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-muted" aria-hidden />
          Budget {booking.budget}
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

      {(booking.status === "new" || booking.status === "accepted" || booking.status === "shortlisted") && (
        <div className="mt-4 border-t border-line pt-4">
          {booking.status === "new" && booking.replyBy && (
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-brand">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {booking.replyBy}
            </p>
          )}
          {booking.status === "new" && <p className="mb-3 text-sm text-body">Are you available on this day? Accept to tell AOD you can do it.</p>}
          {booking.status === "accepted" && <p className="mb-3 text-sm text-body">You&apos;re marked available. AOD shortlists from the artists who accept and you&apos;ll be told here and by email.</p>}
          {booking.status === "shortlisted" && <p className="mb-3 text-sm text-body">AOD has shortlisted you for this event and shared the shortlist with the customer. We&apos;ll tell you if you&apos;re chosen.</p>}
          <div className="flex flex-wrap gap-2">
            {booking.status === "new" && (
              <button
                type="button"
                onClick={() => act("accepted")}
                disabled={sending !== null}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-wait"
              >
                {sending === "accepted" ? (
                  <>
                    <Spinner /> Accepting…
                  </>
                ) : (
                  "Accept"
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => act("declined")}
              disabled={sending !== null}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-5 text-sm font-medium text-body hover:border-ink hover:text-ink disabled:cursor-wait"
            >
              {sending === "declined" ? (
                <>
                  <Spinner /> {booking.status === "new" ? "Declining…" : "Updating…"}
                </>
              ) : booking.status === "new" ? (
                "Decline"
              ) : (
                "I'm not available after all"
              )}
            </button>
          </div>
          {!backendEnabled && <p className="mt-2 text-xs text-muted">Preview: your answer isn&apos;t sent to anyone; it only changes this card.</p>}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      {(booking.status === "confirmed" || booking.status === "selected") && !compact && (
        <a
          href={whatsappUrl(`Hi AOD, about booking ${booking.ref ?? booking.id} (${booking.event}, ${booking.date}).`)}
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
