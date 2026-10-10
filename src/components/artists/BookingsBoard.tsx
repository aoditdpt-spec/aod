"use client";

import Link from "next/link";
import { CalendarCheck2 } from "lucide-react";
import { useState } from "react";
import { backendEnabled } from "@/lib/backend";
import { usePortalMode } from "@/lib/artist-live";
import { BookingCard, useBookings } from "./BookingCard";
import { Badge } from "./form";

const tabs = [
  { id: "requests", label: "Requests", match: ["new", "quoted"] },
  { id: "upcoming", label: "Upcoming", match: ["selected", "confirmed"] },
  { id: "past", label: "Past", match: ["completed", "declined", "cancelled"] },
] as const;

// Booking requests and bookings, in three tabs. New applicants see an empty state.
export function BookingsBoard() {
  const mode = usePortalMode();
  const bookings = useBookings();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("requests");

  if (mode === "applicant") {
    return (
      <div className="mt-8 rounded-[1.25rem] border border-line bg-white p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-brand">
          <CalendarCheck2 className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-medium">Bookings start once you&apos;re live</h2>
        <p className="mx-auto mt-2 max-w-md text-body">
          After your review and trial booking, requests that match your craft and city show up here.
        </p>
        <Link href="/artists/dashboard" className="mt-6 inline-flex text-sm font-medium text-brand underline underline-offset-4">
          See your onboarding steps
        </Link>
      </div>
    );
  }

  const current = tabs.find((t) => t.id === tab)!;
  const list = bookings.filter((b) => (current.match as readonly string[]).includes(b.status));

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Bookings" className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
          {tabs.map((t) => {
            const count = bookings.filter((b) => (t.match as readonly string[]).includes(b.status)).length;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t.id ? "bg-brand text-white" : "text-body hover:text-ink"}`}
              >
                {t.label} <span className={tab === t.id ? "text-white/80" : "text-muted"}>{count}</span>
              </button>
            );
          })}
        </div>
        {!backendEnabled && <Badge>Sample data</Badge>}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 rounded-[1.25rem] border border-line bg-white p-10 text-center text-muted">Nothing here yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {list.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
