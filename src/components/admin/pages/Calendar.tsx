"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { bookingStages } from "@/content/admin";
import { categories } from "@/content/site";
import { useDb, type Artist } from "@/lib/admin-store";
import { assignedArtists, itemsLabel, worksIn } from "@/lib/booking-needs";
import { time12 } from "@/lib/event-time";
import { artistNames, categoryNames, Drawer, fieldBase, fmtDate, PageHeader, PersonCell, todayKey } from "../ui";
import { useOpen } from "../useOpen";
import { ArtistDrawer } from "./Artists";
import { sectionLink } from "@/lib/site-url";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const chip: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-800",
  wait: "bg-amber-50 text-amber-900",
  brand: "bg-peach text-brand-hover",
  bad: "bg-red-50 text-red-700 line-through",
  neutral: "bg-wash text-muted",
};

// Month view of events (bookings), applicant meetings and artist days off. Days off show as one
// "N artists off" chip per day (tidy with 100 artists); it opens the list of those artists
// (?off=<day>), and an artist opens their drawer over the calendar (?artist=<id>), so closing it,
// or the browser's Back, returns to the list and the calendar.
export function Calendar() {
  const db = useDb();
  const [offDay, setOffDay] = useOpen("off");
  const [artistOpen, setArtistOpen] = useOpen("artist");
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

  const bookings = db.bookings.filter((b) => (showCancelled || b.status !== "cancelled") && (!artist || assignedArtists(b.items).includes(artist)) && (!category || b.items.some((i) => i.category === category)));
  const meetings = artist || category ? [] : db.applications.filter((a) => a.status === "meeting" && a.meeting);
  const off = db.artists.filter((a) => (!artist || a.id === artist) && (!category || worksIn(a, category)));

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
        <h2 className="mr-auto px-2 text-lg font-bold">{first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</h2>
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
                        <Link href={sectionLink(`/admin/bookings?open=${b.id}`)} title={`${b.id} · ${itemsLabel(b.items)} · ${b.customer.name} · ${artistNames(db, assignedArtists(b.items))}`} className={`block truncate rounded px-1.5 py-0.5 text-[0.7rem] font-medium ${chip[tone]}`}>
                          {b.time !== "—" ? `${time12(b.time)} ` : ""}
                          {itemsLabel(b.items)}
                        </Link>
                      </li>
                    );
                  })}
                  {meets.map((a) => (
                    <li key={a.id}>
                      <Link href={sectionLink(`/admin/applications?open=${a.id}`)} className="block truncate rounded bg-night px-1.5 py-0.5 text-[0.7rem] font-medium text-white">
                        Meet {a.name.split(" ")[0]}
                      </Link>
                    </li>
                  ))}
                  {offs.length > 0 && (
                    <li>
                      <button
                        type="button"
                        onClick={() => setOffDay(k)}
                        title={offs.map((a) => a.name).join(", ")}
                        className="block w-full truncate rounded border border-dashed border-line px-1.5 py-0.5 text-left text-[0.7rem] text-muted hover:border-ink hover:text-ink"
                      >
                        {offs.length} artist{offs.length === 1 ? "" : "s"} off
                      </button>
                    </li>
                  )}
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
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-line" /> Artists off that day</span>
      </p>

      {offDay && !artistOpen && <DaysOffList day={offDay} artists={off.filter((a) => a.blockedDates.includes(offDay))} onOpen={setArtistOpen} onClose={() => setOffDay(null)} />}
      {(() => {
        const a = artistOpen ? db.artists.find((x) => x.id === artistOpen) : undefined;
        return a ? <ArtistDrawer key={a.id} artist={a} db={db} onClose={() => setArtistOpen(null)} /> : null;
      })()}
    </div>
  );
}

// The artists off on one day: tap one to open their drawer (over the calendar).
function DaysOffList({ day, artists, onOpen, onClose }: { day: string; artists: Artist[]; onOpen: (id: string) => void; onClose: () => void }) {
  return (
    <Drawer open onClose={onClose} title={`${artists.length} artist${artists.length === 1 ? "" : "s"} off`} subtitle={fmtDate(day)}>
      {artists.length === 0 ? (
        <p className="text-sm text-muted">Nobody is off this day.</p>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line">
          {[...artists]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => onOpen(a.id)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-wash">
                  <PersonCell name={a.name} id={a.id} photo={a.photo} />
                  <span className="shrink-0 text-right text-xs text-muted">
                    {categoryNames(a)}
                    <span className="block">{a.city}</span>
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </Drawer>
  );
}
