"use client";

import { useState } from "react";
import { categories } from "@/data/site";
import { eventMinutes, timeRange } from "@/lib/event-time";
import { ago, parseDay, rupees, type Booking, type Db } from "@/lib/app-db";
import { rebookFrom, setRebook } from "@/lib/rebook";

// Parts of an order as the customer (My Bookings) and a company (AOD For Business) see it, as on
// aod.co.in: the artists shortlisted for them (profiles only, never contact details or prices),
// the payments, the files once delivered, and the order's timeline.

export const ADVANCE = 0.3; // the advance asked to confirm a booking

// The order's steps, ticked up to where it is.
const steps = ["Request Received", "Artists Shortlisted", "Advance Paid", "Confirmed", "Completed"];
export function progressOf(b: Booking) {
  if (b.stage === "cancelled") return -1;
  return { new: b.shortlist.length ? 1 : 0, matched: 1, advance: 2, confirmed: 3, completed: 4 }[b.stage];
}

export function Progress({ b }: { b: Booking }) {
  const at = progressOf(b);
  if (at < 0) return <p className="text-lg text-muted">{b.customerCancelled ? "You cancelled this request." : "This booking was cancelled."}</p>;
  return (
    <ol className="grid grid-cols-5 gap-1.5">
      {steps.map((s, i) => (
        <li key={s}>
          <i className={`block h-1 rounded-full ${i <= at ? "bg-ink" : "bg-line"}`} />
          <span className={`mt-2 block text-[11px] leading-tight sm:text-sm ${i <= at ? "text-ink" : "text-muted"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function EventRows({ b }: { b: Booking }) {
  const rows: [string, string][] = [
    ["Order", b.id],
    ["Who", b.needs],
    ["Occasion", b.occasion ?? ""],
    ["Date", parseDay(b.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })],
    ["Time", b.start ? timeRange(b.start, b.end) : ""],
    ["Venue", b.venue || b.city],
    ["Brief For An Artist", b.notes],
    ["Brief", b.brief ?? ""],
  ];
  return (
    <dl className="border-t border-ink">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-4 border-b border-line py-3.5">
          <dt className="w-28 shrink-0 text-muted sm:w-36">{k}</dt>
          <dd className="min-w-0 flex-1 whitespace-pre-line break-words">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// "Shortlisted For You": the artists' profiles (name, craft, city; no photos, on request
// 2026-11-20), the chosen ones marked.
export function ArtistCards({ db, b }: { db: Db; b: Booking }) {
  const ids = [...new Set([...b.assigned, ...b.shortlist])];
  const list = ids.map((id) => db.artists.find((a) => a.id === id)).filter((a) => !!a);
  if (!list.length) return <p className="text-muted">AOD is finding the right artists. Their profiles show here once they&apos;re shortlisted.</p>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {list.map((a) => (
        <li key={a.id} className="rounded-xl border border-line p-4">
          <div className="min-w-0">
            <p className="font-medium">{a.name}</p>
            <p className="text-sm text-muted">
              {a.craft}, {a.city}
            </p>
            {b.assigned.includes(a.id) && <p className="mt-1 text-sm font-medium">Your Artist</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

// The quote, the advance, what's been paid (verified or being checked) and the balance.
export function Payments({ db, b }: { db: Db; b: Booking }) {
  const [asked, setAsked] = useState<"" | "advance" | "balance">("");
  const pays = db.payments.filter((p) => p.booking === b.id);
  const paid = pays.filter((p) => p.verified).reduce((n, p) => n + p.amount, 0);
  if (!b.quote) return <p className="text-muted">The quote shows here once AOD sends it.</p>;
  const advance = Math.round(b.quote * ADVANCE);
  const due = b.quote - paid;
  return (
    <div>
      <dl className="border-t border-ink">
        {(
          [
            ["Quote", rupees(b.quote)],
            ["Advance (30%)", rupees(advance)],
            ["Paid", rupees(paid)],
            ["Balance", rupees(Math.max(0, due))],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-line py-3">
            <dt className="text-muted">{k}</dt>
            <dd className="tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {pays.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-muted">
          {pays.map((p) => (
            <li key={p.id}>
              {p.kind} {rupees(p.amount)}, {p.utr}, {p.verified ? "Verified" : "Being Checked"}
            </li>
          ))}
        </ul>
      )}
      {due > 0 && b.stage !== "cancelled" && (
        <div className="mt-5 flex flex-wrap gap-3 max-sm:*:flex-1">
          {paid < advance && (
            <button type="button" onClick={() => setAsked("advance")} className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-[15px] font-medium text-paper">
              Pay The Advance
            </button>
          )}
          {paid >= advance && (
            <button type="button" onClick={() => setAsked("balance")} className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-[15px] font-medium text-paper">
              Pay The Balance
            </button>
          )}
        </div>
      )}
      {asked && (
        <p className="mt-4 rounded-lg bg-wash p-4 text-sm" role="status">
          AOD sends you the UPI and bank details for the {asked} ({rupees(asked === "advance" ? advance - paid : due)}). Pay, then share the UTR; the team records and verifies it here.
        </p>
      )}
    </div>
  );
}

export function Timeline({ b }: { b: Booking }) {
  return (
    <ol className="border-t border-line">
      {b.history
        .slice()
        .reverse()
        .map((e, i) => (
          <li key={i} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
            <span>{e.text}</span>
            <span className="shrink-0 text-muted">{ago(e.at)}</span>
          </li>
        ))}
    </ol>
  );
}

// Book Again: this order's answers into the booking questions (the new date is left).
export function bookAgain(b: Booking) {
  setRebook(rebookFrom(b, Object.fromEntries(categories.map((c) => [c.slug, c.types])), eventMinutes(b.start, b.end)));
}
