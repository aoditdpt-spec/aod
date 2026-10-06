"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { bookingStages } from "@/content/admin";
import { useDb, useSession } from "@/lib/admin-store";
import { useAlerts } from "../AdminShell";
import { ago, artistName, Card, daysUntil, fmtDate, inr, PageHeader, StageBadge, Stat } from "../ui";

export function Dashboard() {
  const db = useDb();
  const session = useSession();
  const alerts = useAlerts(db);
  if (!db || !session) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const verifiedThisMonth = db.payments.filter((p) => p.status === "verified" && p.checkedAt && new Date(p.checkedAt).getTime() >= monthStart);
  const pending = db.payments.filter((p) => p.status === "pending");
  const upcoming = db.bookings
    .filter((b) => ["confirmed", "payment_pending", "quoted", "matched"].includes(b.status) && daysUntil(b.date) >= 0 && daysUntil(b.date) <= 14)
    .sort((a, b) => a.date.localeCompare(b.date));
  const pipeline = bookingStages.map((s) => ({ ...s, count: db.bookings.filter((b) => b.status === s.id).length }));
  const max = Math.max(1, ...pipeline.map((p) => p.count));
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${session.name.split(" ")[0]}`}
        text={now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <>
            <Link href="/admin/bookings?new=1" className="inline-flex h-9 items-center rounded-lg bg-brand px-3.5 text-sm font-medium text-white hover:bg-brand-hover">
              New booking
            </Link>
            <Link href="/admin/payments?tab=links" className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink">
              Payment link
            </Link>
            <Link href="/admin/leads?new=1" className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink">
              Add lead
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Stat label="New booking requests" value={db.bookings.filter((b) => b.status === "new").length} note="Waiting to be matched" tone={db.bookings.some((b) => b.status === "new") ? "alert" : undefined} />
        <Stat label="Payments to verify" value={pending.length} note={inr(pending.reduce((n, p) => n + p.amount, 0))} tone={pending.length ? "alert" : undefined} />
        <Stat label="Applications to review" value={db.applications.filter((a) => a.status === "submitted" || a.status === "review").length} note="Submitted or under review" />
        <Stat label="Events in 14 days" value={upcoming.filter((b) => b.status === "confirmed").length} note="Confirmed bookings" />
        <Stat label="Verified this month" value={inr(verifiedThisMonth.reduce((n, p) => n + p.amount, 0))} note={`${verifiedThisMonth.length} payments`} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card title="Needs attention">
          {alerts.length === 0 ? (
            <p className="text-sm text-muted">All clear.</p>
          ) : (
            <ul className="divide-y divide-line">
              {alerts.map((a) => (
                <li key={a.text}>
                  <Link href={a.href} className="flex items-center gap-3 py-2.5 text-sm text-ink hover:text-brand">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${a.tone === "brand" ? "bg-brand" : "bg-amber-500"}`} aria-hidden />
                    <span className="flex-1">{a.text}</span>
                    <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* One series, one colour: the title names it, each bar carries its own count. */}
        <Card title="Bookings by stage" action={<Link href="/admin/bookings?view=board" className="text-sm font-medium text-brand">Open board</Link>}>
          <ul className="space-y-2">
            {pipeline.map((p) => (
              <li key={p.id} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm" title={`${p.label}: ${p.count}`}>
                <span className="truncate text-body">{p.label}</span>
                <span className="h-3 rounded-full bg-wash">
                  <span className="block h-3 rounded-full bg-brand" style={{ width: `${(p.count / max) * 100}%`, minWidth: p.count ? "0.75rem" : 0 }} />
                </span>
                <span className="text-right font-medium text-ink">{p.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card title="Coming up (14 days)" action={<Link href="/admin/calendar" className="text-sm font-medium text-brand">Calendar</Link>}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Nothing booked in the next two weeks.</p>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Link href={`/admin/bookings?open=${b.id}`} className="flex items-center gap-4 py-2.5 text-sm hover:text-brand">
                    <span className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-wash py-1 text-center">
                      <CalendarDays className="h-3.5 w-3.5 text-brand" aria-hidden />
                      <span className="text-xs font-medium text-ink">{fmtDate(b.date)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">
                        {b.service} · {b.customer.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {b.city} · {artistName(db, b.artistId)}
                      </span>
                    </span>
                    <StageBadge stages={bookingStages} id={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Recent activity" action={<Link href="/admin/activity" className="text-sm font-medium text-brand">All</Link>}>
          <ul className="space-y-3">
            {db.activity.slice(0, 7).map((a) => (
              <li key={a.id} className="text-sm">
                <p className="text-ink">{a.text}</p>
                <p className="text-xs text-muted">
                  {a.by} · {a.area} · {ago(a.at)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
