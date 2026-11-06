"use client";

import { useState } from "react";
import type { CustomerOrder } from "@/content/my-bookings";
import { stageOf, stages, type Stage } from "@/content/business-portal";
import { timeRange } from "@/lib/event-time";
import { fmtDate, OrderDetail, StageChip } from "./OrderDetail";

// Every order of the company, newest event first, filtered by stage. Open one to see it in full.
export function BusinessOrders({ orders, onBook }: { orders: CustomerOrder[]; onBook: () => void }) {
  const [filter, setFilter] = useState<Stage | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const count = (s: Stage | "all") => (s === "all" ? orders.length : orders.filter((o) => stageOf(o) === s).length);
  // Undated orders first (they need a date), then the latest event date.
  const list = orders
    .filter((o) => filter === "all" || stageOf(o) === filter)
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") * -1 || b.createdAt.localeCompare(a.createdAt));

  return (
    <section className="rounded-[1.25rem] border border-line bg-white p-4 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Your orders</h2>
        <button type="button" onClick={onBook} className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover">
          Book artists
        </button>
      </div>

      <div role="group" aria-label="Filter by stage" className="mt-4 flex flex-wrap gap-2">
        {[{ id: "all" as const, label: "All" }, ...stages].map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={filter === s.id}
            onClick={() => setFilter(s.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              filter === s.id ? "border-brand bg-peach/50 font-medium text-ink" : "border-line text-body hover:border-brand/50"
            }`}
          >
            {s.label} <span className="text-muted">{count(s.id)}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{orders.length === 0 ? "No orders yet. Book artists and every order shows up here." : "No orders at this stage."}</p>
      ) : (
        <ul className="mt-5 divide-y divide-line">
          {list.map((o) => {
            const open = openId === o.id;
            return (
              <li key={o.id} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : o.id)}
                  aria-expanded={open}
                  className="flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-1 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink sm:text-base">{o.occasion}</span>
                    <span className="mt-0.5 block text-xs text-muted sm:text-sm">
                      {fmtDate(o.date)}
                      {o.time ? ` · ${timeRange(o.time)}` : ""} · {o.city || "City not set"}
                    </span>
                    <span className="mt-0.5 block text-xs text-body sm:text-sm">{o.services.join(", ")}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <StageChip order={o} />
                    <span className="text-xs text-muted">{o.ref ?? o.id}</span>
                  </span>
                </button>
                {open && (
                  <div className="mt-4 rounded-xl bg-wash/60 p-4 sm:p-6">
                    <OrderDetail order={o} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
