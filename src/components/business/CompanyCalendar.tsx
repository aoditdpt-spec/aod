"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { CustomerOrder } from "@/content/my-bookings";
import { stageInfo, stageOf, stages } from "@/content/business-portal";
import { timeRange } from "@/lib/event-time";
import { fmtDate, OrderDetail, StageChip } from "./OrderDetail";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const key = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// The company's calendar: every booking on its event date, coloured by stage (Inquired, Artist
// assigned, Done). Pick a day to list its bookings, and a booking to see it in full.
export function CompanyCalendar({ orders, onBook }: { orders: CustomerOrder[]; onBook: () => void }) {
  const now = new Date();
  const todayKey = key(now.getFullYear(), now.getMonth(), now.getDate());
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [day, setDay] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, CustomerOrder[]>();
    for (const o of orders) if (o.date) map.set(o.date, [...(map.get(o.date) ?? []), o]);
    return map;
  }, [orders]);

  const first = new Date(view.y, view.m, 1);
  const length = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array<null>(first.getDay()).fill(null), ...Array.from({ length }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const move = (by: number) => setView((v) => ({ y: new Date(v.y, v.m + by, 1).getFullYear(), m: new Date(v.y, v.m + by, 1).getMonth() }));

  const upcoming = orders
    .filter((o) => o.date >= todayKey && o.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const shown = day ? (byDay.get(day) ?? []) : upcoming;
  const unscheduled = orders.filter((o) => !o.date && o.status !== "cancelled");
  const open = orders.find((o) => o.id === openId) ?? null;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-[1.25rem] border border-line bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink sm:text-xl">{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => move(-1)} aria-label="Previous month" className="rounded-lg p-2 text-muted hover:bg-wash hover:text-ink">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                setView({ y: now.getFullYear(), m: now.getMonth() });
                setDay(todayKey);
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand hover:bg-wash"
            >
              Today
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next month" className="rounded-lg p-2 text-muted hover:bg-wash hover:text-ink">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
          {weekdays.map((w) => (
            <span key={w} className="py-1">
              {w}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} aria-hidden className="min-h-14 rounded-lg sm:min-h-20" />;
            const k = key(view.y, view.m, d);
            const list = byDay.get(k) ?? [];
            const picked = day === k;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDay(picked ? null : k);
                  setOpenId(null);
                }}
                aria-pressed={picked}
                aria-label={`${d} ${first.toLocaleDateString("en-IN", { month: "long" })}${list.length ? `, ${list.length} booking${list.length === 1 ? "" : "s"}` : ""}`}
                className={`flex min-h-14 flex-col items-start rounded-lg border p-1.5 text-left transition-colors sm:min-h-20 sm:p-2 ${
                  picked ? "border-brand bg-peach/50" : "border-transparent bg-wash/60 hover:border-brand/40"
                }`}
              >
                <span className={`text-xs font-medium sm:text-sm ${k === todayKey ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white" : "text-ink"}`}>{d}</span>
                <span className="mt-auto flex flex-wrap gap-1">
                  {list.slice(0, 4).map((o) => (
                    <span key={o.id} className={`h-2 w-2 rounded-full ${stageInfo(stageOf(o)).dot}`} />
                  ))}
                  {list.length > 4 && <span className="text-[0.625rem] leading-none text-muted">+{list.length - 4}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Colour key">
          {stages
            .filter((s) => s.id !== "cancelled")
            .map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} /> {s.label}
              </li>
            ))}
        </ul>
      </section>

      <section className="rounded-[1.25rem] border border-line bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{day ? fmtDate(day) : "Coming up"}</h2>
          {day && (
            <button type="button" onClick={() => setDay(null)} className="text-sm font-medium text-brand hover:underline">
              Show all
            </button>
          )}
        </div>

        {shown.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            {day ? "No bookings on this day." : "Nothing coming up yet."}{" "}
            <button type="button" onClick={onBook} className="font-medium text-brand underline underline-offset-2">
              Book artists
            </button>
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {shown.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === o.id ? null : o.id)}
                  aria-expanded={openId === o.id}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                    openId === o.id ? "border-brand bg-peach/40" : "border-line hover:border-brand/50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{o.occasion}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {!day && o.date ? `${fmtDate(o.date)} · ` : ""}
                      {o.time ? timeRange(o.time) : "Time not fixed"} · {o.city || "City not set"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-body">{o.services.join(", ")}</span>
                  </span>
                  <StageChip order={o} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {unscheduled.length > 0 && !day && (
          <p className="mt-4 text-xs text-muted">
            {unscheduled.length} booking{unscheduled.length === 1 ? " has" : "s have"} no date yet. Find {unscheduled.length === 1 ? "it" : "them"} under Orders.
          </p>
        )}
      </section>

      {open && (
        <section className="rounded-[1.25rem] border border-line bg-white p-5 sm:p-7 lg:col-span-2">
          <OrderDetail order={open} />
        </section>
      )}
    </div>
  );
}
