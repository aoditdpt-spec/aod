"use client";

import type { ReactNode } from "react";
import { dayKey } from "@/lib/app-db";

// A month as a Sunday-first grid. `cell` draws each day of the month; the days before and after
// it are left blank. Used by the admin's calendar and the artist's availability.
export function MonthGrid({ month, cell, compact = false }: { month: Date; cell: (key: string, day: number) => ReactNode; compact?: boolean }) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = first.getDay();
  const keys = Array.from({ length: days }, (_, i) => dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1)));
  return (
    <div className={`grid grid-cols-7 ${compact ? "text-center text-sm" : "gap-px border border-line bg-line"} tabular-nums`}>
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
        <span key={d} className={`text-xs text-muted ${compact ? "pb-2" : "bg-paper px-2 py-2"}`}>
          {compact ? d[0] : d}
        </span>
      ))}
      {Array.from({ length: lead }, (_, i) => (
        <span key={`b${i}`} className={compact ? "" : "bg-paper"} />
      ))}
      {keys.map((k, i) => (
        <div key={k} className={compact ? "" : "min-h-24 bg-paper p-1.5"}>
          {cell(k, i + 1)}
        </div>
      ))}
      {!compact && Array.from({ length: (7 - ((lead + days) % 7)) % 7 }, (_, i) => <span key={`a${i}`} className="bg-paper" />)}
    </div>
  );
}

// Previous / Next as clear outlined buttons either side of the month (on request, 2026-11-20).
const monthButton = "h-10 rounded-full border border-ink px-4 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper";

export function MonthSwitch({ month, onChange }: { month: Date; onChange: (m: Date) => void }) {
  const shift = (n: number) => onChange(new Date(month.getFullYear(), month.getMonth() + n, 1));
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button type="button" onClick={() => shift(-1)} className={monthButton}>
        Previous
      </button>
      <span className="min-w-32 text-center text-base font-medium text-ink">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
      <button type="button" onClick={() => shift(1)} className={monthButton}>
        Next
      </button>
    </div>
  );
}

// Phones: the month as a list of the days that have something on (the grid is too narrow to read).
// `day` returns that day's items, or nothing to leave the day out.
export function MonthAgenda({ month, today, day, empty = "Nothing this month." }: { month: Date; today: string; day: (key: string) => ReactNode[]; empty?: string }) {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const rows = Array.from({ length: days }, (_, i) => {
    const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
    const key = dayKey(d);
    return { key, d, items: day(key) };
  }).filter((r) => r.items.length);
  if (!rows.length) return <p className="border-y border-line py-5 text-muted">{empty}</p>;
  return (
    <ul className="border-t border-ink">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[52px_1fr] gap-3 border-b border-line py-3">
          <span className="leading-tight">
            <b className={`block text-xl font-medium tabular-nums ${r.key === today ? "text-brand" : ""}`}>{r.d.getDate()}</b>
            <small className="text-xs text-muted">{r.d.toLocaleDateString("en-GB", { weekday: "short" })}</small>
          </span>
          <div className="min-w-0 space-y-1.5">{r.items}</div>
        </li>
      ))}
    </ul>
  );
}
