"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { bookingStages } from "@/content/admin";
import { categories } from "@/content/site";
import { useDb } from "@/lib/admin-store";
import { artistName, fieldBase, PageHeader, todayKey } from "../ui";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const chip: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-800",
  wait: "bg-amber-50 text-amber-900",
  brand: "bg-peach text-brand-hover",
  bad: "bg-red-50 text-red-700 line-through",
  neutral: "bg-wash text-muted",
};

// Month view of events (bookings), applicant meetings and artist days off.
export function Calendar() {
  const db = useDb();
  const [offset, setOffset] = useState(0);
  const [artist, setArtist] = useState("");
  const [category, setCategory] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  if (!db) return null;

  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
  const today = todayKey();

  const bookings = db.bookings.filter((b) => (showCancelled || b.status !== "cancelled") && (!artist || b.artistId === artist) && (!category || b.category === category));
  const meetings = artist || category ? [] : db.applications.filter((a) => a.status === "meeting" && a.meeting);
  const off = db.artists.filter((a) => (!artist || a.id === artist) && (!category || a.category === category));

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" text="Events, applicant meetings and artist days off. Click an entry to open it." />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month" className="rounded-lg border border-line bg-white p-2 hover:border-ink">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={() => setOffset(0)} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">
            Today
          </button>
          <button type="button" onClick={() => setOffset((o) => o + 1)} aria-label="Next month" className="rounded-lg border border-line bg-white p-2 hover:border-ink">
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <h2 className="mr-auto px-2 text-lg font-medium">{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className={`${fieldBase} w-auto`}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={artist} onChange={(e) => setArtist(e.target.value)} aria-label="Artist" className={`${fieldBase} w-auto`}>
          <option value="">All artists</option>
          {db.artists.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} className="accent-[var(--color-brand)]" /> Cancelled
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <div className="grid min-w-[52rem] grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div key={w} className="border-b border-line px-2 py-2 text-xs font-medium text-muted">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`b${i}`} className="min-h-28 border-b border-r border-line bg-wash/40" />;
            const k = key(d);
            const items = bookings.filter((b) => b.date === k);
            const meets = meetings.filter((a) => a.meeting!.at.slice(0, 10) === k || key(new Date(a.meeting!.at)) === k);
            const offs = off.filter((a) => a.blockedDates.includes(k));
            return (
              <div key={k} className={`min-h-28 border-b border-r border-line p-1.5 ${k === today ? "bg-peach/30" : ""}`}>
                <p className={`mb-1 text-xs ${k === today ? "font-semibold text-brand" : "text-muted"}`}>{d.getDate()}</p>
                <ul className="space-y-1">
                  {items.map((b) => {
                    const tone = bookingStages.find((s) => s.id === b.status)?.tone ?? "neutral";
                    return (
                      <li key={b.id}>
                        <Link href={`/admin/bookings?open=${b.id}`} title={`${b.id} · ${b.service} · ${b.customer.name} · ${artistName(db, b.artistId)}`} className={`block truncate rounded px-1.5 py-0.5 text-[0.7rem] font-medium ${chip[tone]}`}>
                          {b.time !== "—" ? `${b.time} ` : ""}
                          {b.service}
                        </Link>
                      </li>
                    );
                  })}
                  {meets.map((a) => (
                    <li key={a.id}>
                      <Link href={`/admin/applications?open=${a.id}`} className="block truncate rounded bg-night px-1.5 py-0.5 text-[0.7rem] font-medium text-white">
                        Meet {a.name.split(" ")[0]}
                      </Link>
                    </li>
                  ))}
                  {offs.map((a) => (
                    <li key={a.id}>
                      <Link href={`/admin/artists?open=${a.id}`} className="block truncate rounded border border-dashed border-line px-1.5 py-0.5 text-[0.7rem] text-muted">
                        {a.name.split(" ")[0]} off
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <p className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-100" /> Confirmed or done</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100" /> In progress</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-peach" /> New</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-night" /> Applicant meeting</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-line" /> Artist day off</span>
      </p>
    </div>
  );
}
