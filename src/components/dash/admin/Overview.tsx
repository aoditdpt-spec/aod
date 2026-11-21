"use client";

import { Avatar } from "@/components/ui/Avatar";
import Link from "@/components/ui/AppLink";
import { useState } from "react";
import { appStageLabel, ago, hoursLeft, counts, dayDiff, longDate, openStage, rupees, sameMonth, shortDate, stageLabel, stages, teamUnread, useDb, type Db } from "@/lib/app-db";
import { downloadCsv, bookingsCsv } from "@/lib/csv";
import { HeadLink, Head, Loading, Nums, Status, Tabs, Title, btn, stageTone, sub, td, th } from "../ui";

// Overview (design-tests/test2.html): the day's numbers, the order pipeline and the open orders,
// new applications, what needs the team, revenue against last month, and the latest activity.
export function Overview() {
  const db = useDb();
  const [tab, setTab] = useState<"open" | "week" | "all">("open");
  if (!db) return <Loading />;

  const c = counts(db);
  const open = db.bookings.filter((b) => openStage(b.stage));
  const assigned = open.filter((b) => b.assigned.length).length;
  const waiting = db.payments.filter((p) => !p.verified);
  const lastMonthRef = new Date(db.today.getFullYear(), db.today.getMonth() - 1, 15);
  // Up to the same day of the month, so a month half gone compares fairly.
  const revenue = (ref: Date) => db.payments.filter((p) => p.verified && sameMonth(p.at, ref) && new Date(p.at).getDate() <= db.today.getDate()).reduce((n, p) => n + p.amount, 0);
  const now = revenue(db.today);
  const before = revenue(lastMonthRef);
  const change = before ? Math.round(((now - before) / before) * 100) : 0;
  const meetingsThisWeek = db.applications.filter((a) => a.stage === "meeting" && a.meetingAt && dayDiff(a.meetingAt.slice(0, 10), db.today) <= 7).length;
  const month = db.today.toLocaleDateString("en-GB", { month: "long" });

  const rows = (tab === "open" ? open : tab === "week" ? db.bookings.filter((b) => { const d = dayDiff(b.date, db.today); return d >= 0 && d <= 7; }) : db.bookings).slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  const pipe = stages.filter((s) => s.id !== "cancelled").map((s) => ({ ...s, n: db.bookings.filter((b) => b.stage === s.id).length }));
  const attention = needsAttention(db);

  return (
    <>
      <Title title="Overview" text={`${longDate(db.today)}. ${attention.length ? `${attention.length} ${attention.length === 1 ? "thing needs" : "things need"} the team today.` : "Nothing is waiting on the team."}`}>
        <button type="button" className={btn} onClick={() => downloadCsv(`aod-bookings-${db.todayKey}.csv`, bookingsCsv(db))}>
          Download Bookings (CSV)
        </button>
      </Title>

      <Nums
        items={[
          { value: String(c.newRequests), label: "New Requests", note: "Not Yet Matched", hot: c.newRequests > 0, href: "/admin/bookings" },
          { value: String(open.length), label: "Open Orders", note: `${assigned} With Artists Assigned`, href: "/admin/bookings" },
          { value: rupees(now), label: `Revenue In ${month}`, note: before && change ? `${change > 0 ? "Up" : "Down"} ${Math.abs(change)}% On Last Month` : undefined, href: "/admin/reports" },
          { value: String(waiting.length), label: "Payments To Verify", note: `${rupees(waiting.reduce((n, p) => n + p.amount, 0))} Waiting`, hot: waiting.length > 0, href: "/admin/payments" },
          { value: String(c.applications), label: "Applications", note: `${meetingsThisWeek} ${meetingsThisWeek === 1 ? "Meeting" : "Meetings"} This Week`, href: "/admin/applications" },
        ]}
      />

      <div className="mt-10 grid gap-12 xl:grid-cols-[1.7fr_1fr]">
        <div className="min-w-0">
          <Head title="Bookings">
            <Tabs
              value={tab}
              onChange={setTab}
              options={[
                { id: "open", label: "Open" },
                { id: "week", label: "This Week" },
                { id: "all", label: "All" },
              ]}
            />
          </Head>
          <div className="mb-2.5 mt-1.5 flex h-1.5 gap-0.5" aria-hidden>
            {pipe.map((s) => s.n > 0 && <i key={s.id} style={{ flex: s.n }} className={`rounded-sm ${{ new: "bg-brand", matched: "bg-ink", advance: "bg-ink/60", confirmed: "bg-ink/35", completed: "bg-ink/15", cancelled: "" }[s.id]}`} />)}
          </div>
          <div className="mb-5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            {pipe.map((s) => (
              <span key={s.id}>
                <b className="font-medium text-ink">{s.n}</b> {s.label}
              </span>
            ))}
          </div>
          <BookingTable db={db} rows={rows} />
          <div className="mt-3">
            <HeadLink href="/admin/bookings">All Bookings</HeadLink>
          </div>

          <Head title="New Applications" className="mt-11">
            <HeadLink href="/admin/applications">All {db.applications.length}</HeadLink>
          </Head>
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr>
                <th className={th}>Artist</th>
                <th className={`${th} max-sm:hidden`}>Category</th>
                <th className={th}>Stage</th>
                <th className={`${th} max-sm:hidden`}>Applied</th>
              </tr>
            </thead>
            <tbody>
              {db.applications
                .filter((a) => a.stage !== "approved" && a.stage !== "rejected")
                .slice(0, 4)
                .map((a) => (
                  <tr key={a.id} className="hover:bg-wash">
                    <td className={td}>
                      <Link href={`/admin/applications?open=${a.id}`} className="flex items-center gap-2.5">
                        <Avatar src={a.photo} name={a.name} size={30} />
                        <span>
                          {a.name}
                          <small className={sub}>
                            {a.id}, {a.city}
                          </small>
                        </span>
                      </Link>
                    </td>
                    <td className={`${td} max-sm:hidden`}>{a.craft}</td>
                    <td className={td}>
                      <Status tone={a.stage === "meeting" && a.meetingAt && dayDiff(a.meetingAt.slice(0, 10), db.today) === 0 ? "hot" : a.stage === "trial" ? "mid" : "ink"}>
                        {a.stage === "meeting" && a.meetingAt ? `Meeting ${meetingWhen(a.meetingAt, db)}` : appStageLabel(a.stage)}
                      </Status>
                    </td>
                    <td className={`${td} max-sm:hidden`}>{shortDate(a.applied)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="min-w-0">
          <Head title="Needs Attention">{attention.length}</Head>
          {attention.length ? (
            <div className="border-b border-line">
              {attention.map((a) => (
                <div key={a.title} className="flex gap-2.5 border-t border-line py-3">
                  <i className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <div className="min-w-0 flex-1">
                    {a.title}
                    <small className="block text-[13px] text-muted">{a.text}</small>
                  </div>
                  <Link href={a.href} className="self-center border-b border-ink text-[13px] font-medium">
                    {a.action}
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="border-y border-line py-3 text-muted">All clear.</p>
          )}

          <Head title="Revenue" className="mt-10">
            {month} Against Last Month
          </Head>
          <RevenueChart db={db} />

          <Head title="Activity" className="mt-10">
            <HeadLink href="/admin/activity">Activity Log</HeadLink>
          </Head>
          <ul>
            {db.activity.slice(0, 4).map((a, i) => (
              <li key={i} className="border-t border-line py-2.5">
                {a.text}
                <small className="block text-muted">
                  {a.by}, {ago(a.at)}
                </small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export function meetingWhen(iso: string, db: Db) {
  const d = dayDiff(iso.slice(0, 10), db.today);
  const t = new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toUpperCase();
  return d === 0 ? `Today, ${t}` : d === 1 ? `Tomorrow, ${t}` : `${shortDate(iso.slice(0, 10))}, ${t}`;
}

// The orders table, shared with the Bookings page.
export function BookingTable({ db, rows, onOpen }: { db: Db; rows: Db["bookings"]; onOpen?: (id: string) => void }) {
  if (!rows.length) return <p className="border-y border-line py-5 text-muted">No orders here.</p>;
  return (
    <table className="w-full border-collapse tabular-nums">
      <thead>
        <tr>
          <th className={th}>Order</th>
          <th className={`${th} max-sm:hidden`}>Who They Need</th>
          <th className={th}>Event</th>
          <th className={th}>Status</th>
          <th className={`${th} text-right max-sm:hidden`}>Quote</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((b) => {
          const accepted = Object.values(db.replies[b.id] ?? {}).filter((r) => r === "accepted").length;
          return (
            <tr key={b.id} className="cursor-pointer hover:bg-wash" onClick={() => (onOpen ? onOpen(b.id) : undefined)}>
              <td className={td}>
                {onOpen ? (
                  <button type="button" className="whitespace-nowrap text-left" onClick={() => onOpen(b.id)}>
                    {b.id}
                  </button>
                ) : (
                  <Link href={`/admin/bookings?open=${b.id}`} className="whitespace-nowrap">
                    {b.id}
                  </Link>
                )}
                <small className={sub}>{b.customer}</small>
              </td>
              <td className={`${td} max-sm:hidden`}>
                {b.needs}
                {b.stage === "new" && accepted > 0 && <small className={sub}>{accepted} Accepted</small>}
              </td>
              <td className={td}>
                {shortDate(b.date)}
                <small className={sub}>{b.city}</small>
              </td>
              <td className={td}>
                <Status tone={stageTone[b.stage]}>{stageLabel(b.stage)}</Status>
              </td>
              <td className={`${td} text-right max-sm:hidden`}>{b.quote ? rupees(b.quote) : "–"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function needsAttention(db: Db) {
  const out: { title: string; text: string; href: string; action: string }[] = [];
  for (const c of db.cases.filter((c) => c.status === "new" || c.status === "escalated")) {
    const left = hoursLeft(c.raisedAt, 48);
    out.push({ title: `Dispute ${c.id}`, text: c.status === "escalated" ? "Escalated, Decision Due" : left > 0 ? `Reply Due In ${left} Hours` : "Reply Overdue", href: `/admin/disputes?open=${c.id}`, action: "Open" });
  }
  const waiting = db.payments.filter((p) => !p.verified);
  if (waiting.length) out.push({ title: `${waiting.length} ${waiting.length === 1 ? "Payment" : "Payments"} To Verify`, text: `${rupees(waiting.reduce((n, p) => n + p.amount, 0))} Across ${new Set(waiting.map((p) => p.booking)).size} Orders`, href: "/admin/payments", action: "Verify" });
  for (const b of db.bookings.filter((b) => b.stage === "new" && !b.assigned.length && dayDiff(b.date, db.today) >= 0 && dayDiff(b.date, db.today) <= 5)) {
    const accepted = Object.values(db.replies[b.id] ?? {}).filter((r) => r === "accepted").length;
    out.push({ title: `${b.id} Has No Artists`, text: `Event In ${dayDiff(b.date, db.today)} Days, ${accepted} Accepted`, href: `/admin/bookings?open=${b.id}`, action: "Assign" });
  }
  for (const a of db.applications.filter((a) => a.stage === "meeting" && a.meetingAt && dayDiff(a.meetingAt.slice(0, 10), db.today) === 0)) {
    out.push({ title: `Meeting With ${a.name}`, text: `Applicant, ${meetingWhen(a.meetingAt!, db)}`, href: `/admin/applications?open=${a.id}`, action: "View" });
  }
  const unread = db.artists.filter((a) => teamUnread(db, a.id) > 0);
  if (unread.length) out.push({ title: `${unread.length} Unread ${unread.length === 1 ? "Chat" : "Chats"}`, text: unread.map((a) => a.name).join(", "), href: "/admin/chat", action: "Reply" });
  return out;
}

// This month's verified payments added up day by day (black), against last month's (dashed grey).
function RevenueChart({ db }: { db: Db }) {
  const series = (ref: Date) => {
    const days = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    const pays = db.payments.filter((p) => p.verified && sameMonth(p.at, ref));
    let sum = 0;
    return Array.from({ length: days }, (_, i) => {
      sum += pays.filter((p) => new Date(p.at).getDate() === i + 1).reduce((n, p) => n + p.amount, 0);
      return sum;
    });
  };
  const now = series(db.today).slice(0, db.today.getDate());
  const before = series(new Date(db.today.getFullYear(), db.today.getMonth() - 1, 15));
  const max = Math.max(1, ...now, ...before);
  const pts = (s: number[]) => s.map((v, i) => `${(i / 30) * 300},${118 - (v / max) * 100}`).join(" ");
  const last = now.length - 1;
  return (
    <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="block h-[120px] w-full" role="img" aria-label={`Revenue this month ${rupees(now[last] ?? 0)}, last month ${rupees(before[before.length - 1] ?? 0)}`}>
      <line x1="0" x2="300" y1="119.5" y2="119.5" className="stroke-line" />
      <polyline points={pts(before)} fill="none" className="stroke-ink/30" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      <polyline points={pts(now)} fill="none" className="stroke-ink" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={(last / 30) * 300} cy={118 - ((now[last] ?? 0) / max) * 100} r="3.5" className="fill-brand" />
    </svg>
  );
}
