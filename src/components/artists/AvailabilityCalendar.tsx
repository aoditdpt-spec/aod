"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useHydrated } from "@/lib/motion-safe";
import { backendEnabled } from "@/lib/backend";
import { setBlockedDates, useBlockedDates } from "@/lib/artist-live";
import { Panel } from "./form";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Month calendar: tap days to mark them unavailable (tap again to free them). Past days are
// locked. Live: saved to the artist's record (the team's matching skips these days). Preview:
// saved in this browser. Rendered after hydration, because "today" depends on the visitor's clock.
export function AvailabilityCalendar() {
  const hydrated = useHydrated();
  const blocked = useBlockedDates();
  const [offset, setOffset] = useState(0); // months from the current one
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) return <div className="mt-8 h-[28rem] animate-pulse rounded-[1.25rem] bg-white" />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1)),
  ];
  const monthLabel = first.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const upcomingBlocked = blocked.filter((d) => d >= iso(today)).sort();

  function toggle(day: string) {
    setError(null);
    void setBlockedDates(blocked.includes(day) ? blocked.filter((d) => d !== day) : [...blocked, day]).then((err) => err && setError(err));
  }

  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
      <Panel
        title={monthLabel}
        action={
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              disabled={offset === 0}
              aria-label="Previous month"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-brand disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setOffset((o) => Math.min(11, o + 1))}
              aria-label="Next month"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:border-brand"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="pb-1 text-xs font-medium text-muted">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`blank-${i}`} />;
            const key = iso(d);
            const past = d < today;
            const off = blocked.includes(key);
            const isToday = d.getTime() === today.getTime();
            return (
              <button
                key={key}
                type="button"
                disabled={past}
                onClick={() => toggle(key)}
                aria-pressed={off}
                aria-label={`${d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}: ${off ? "unavailable" : "available"}`}
                className={`flex aspect-square items-center justify-center rounded-lg text-sm transition-colors sm:aspect-[4/3] ${
                  past
                    ? "cursor-not-allowed text-muted/40"
                    : off
                      ? "bg-night font-medium text-white line-through decoration-white/50"
                      : "bg-wash text-ink hover:bg-peach/60"
                } ${isToday ? "ring-2 ring-brand" : ""}`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-wash ring-1 ring-line" /> Available
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-night" /> Unavailable
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded ring-2 ring-brand" /> Today
          </span>
        </div>
      </Panel>

      <Panel title="Days off" text="AOD won't send requests for these days.">
        {upcomingBlocked.length === 0 ? (
          <p className="text-sm text-muted">None yet. Tap a day in the calendar to mark it.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingBlocked.map((d) => (
              <li key={d} className="flex items-center justify-between rounded-lg bg-wash px-3 py-2 text-sm">
                <span className="text-ink">
                  {new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button type="button" onClick={() => toggle(d)} className="text-sm font-medium text-brand hover:text-brand-hover">
                  Free up
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <p className="mt-5 text-xs text-muted">{backendEnabled ? "Saved to your AOD profile as you tap." : "Preview: saved in this browser only."}</p>
      </Panel>
    </div>
  );
}
