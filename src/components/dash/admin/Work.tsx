"use client";

import Link from "@/components/ui/AppLink";
import { useState } from "react";
import { COMMISSION, act, ago, caseStatuses, hoursLeft, rupees, useDb } from "@/lib/app-db";
import { MonthAgenda, MonthGrid, MonthSwitch } from "../MonthGrid";
import { Drawer, Head, Loading, Rows, Status, Tabs, Title, btn, btnInk, btnMain, field, sub, td, th, useOpen } from "../ui";

// Calendar: events, applicant meetings and artists' days off (the portal artist's), month by month.
export function Calendar() {
  const db = useDb();
  const [month, setMonth] = useState<Date | null>(null);
  if (!db) return <Loading />;
  const m = month ?? new Date(db.today.getFullYear(), db.today.getMonth(), 1);
  const me = db.artists[0];

  return (
    <>
      <Title title="Calendar" text="Events, applicant meetings and artists' days off.">
        <MonthSwitch month={m} onChange={setMonth} />
      </Title>
      {/* Phones: the month as a list of the days with something on. */}
      <div className="mt-7 sm:hidden">
        <MonthAgenda
          month={m}
          today={db.todayKey}
          day={(k) => [
            ...db.bookings
              .filter((b) => b.date === k)
              .map((b) => (
                <Link key={b.id} href={`/admin/bookings?open=${b.id}`} className={`block ${b.stage === "cancelled" ? "text-muted line-through" : ""}`}>
                  {b.customer}
                  <small className="block text-xs text-muted">
                    {b.needs} · {b.city}
                  </small>
                </Link>
              )),
            ...db.applications
              .filter((a) => a.stage === "meeting" && a.meetingAt?.slice(0, 10) === k)
              .map((a) => (
                <Link key={a.id} href={`/admin/applications?open=${a.id}`} className="block">
                  Meeting, {a.name}
                  <small className="block text-xs text-muted">Applicant, {a.craft}</small>
                </Link>
              )),
            ...(db.daysOff.includes(k) ? [<span key="off" className="block text-muted">{me.name} Off</span>] : []),
          ]}
        />
      </div>
      <div className="mt-7 hidden overflow-x-auto sm:block">
        <div className="min-w-[720px]">
          <MonthGrid
            month={m}
            cell={(k, d) => {
              const events = db.bookings.filter((b) => b.date === k);
              const meetings = db.applications.filter((a) => a.stage === "meeting" && a.meetingAt?.slice(0, 10) === k);
              const off = db.daysOff.includes(k);
              return (
                <>
                  <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs ${k === db.todayKey ? "bg-brand text-white" : "text-muted"}`}>{d}</span>
                  <div className="mt-1 space-y-1">
                    {events.map((b) => (
                      <Link key={b.id} href={`/admin/bookings?open=${b.id}`} className={`block truncate rounded px-1.5 py-0.5 text-xs ${b.stage === "new" ? "bg-brand/10 text-ink" : b.stage === "cancelled" ? "text-muted line-through" : "bg-wash"}`}>
                        {b.customer}
                      </Link>
                    ))}
                    {meetings.map((a) => (
                      <Link key={a.id} href={`/admin/applications?open=${a.id}`} className="block truncate rounded border border-line px-1.5 py-0.5 text-xs">
                        Meeting, {a.name}
                      </Link>
                    ))}
                    {off && <span className="block truncate px-1.5 text-xs text-muted">{me.name} Off</span>}
                  </div>
                </>
              );
            }}
          />
        </div>
      </div>
    </>
  );
}

// Payments: customers' UTRs to verify (verifying an advance confirms the order's advance), then
// payouts to artists.
export function Payments() {
  const db = useDb();
  if (!db) return <Loading />;
  const waiting = db.payments.filter((p) => !p.verified);
  const done = db.payments.filter((p) => p.verified).sort((a, b) => b.at.localeCompare(a.at));
  const name = (id: string) => db.artists.find((a) => a.id === id)?.name ?? id;
  // Confirmed or completed orders with a quote, for each assigned artist without a payout yet.
  const suggested = db.bookings
    .filter((b) => b.quote && (b.stage === "confirmed" || b.stage === "completed") && b.assigned.length)
    .flatMap((b) => b.assigned.map((artist) => ({ booking: b.id, artist, amount: Math.round(((b.quote ?? 0) * (1 - COMMISSION)) / b.assigned.length) })))
    .filter((s) => !db.payouts.some((p) => p.booking === s.booking && p.artist === s.artist));

  const table = (list: typeof db.payments, verify: boolean) => (
    <table className="w-full border-collapse tabular-nums">
      <thead>
        <tr>
          <th className={th}>Payment</th>
          <th className={`${th} max-sm:hidden`}>Order</th>
          <th className={`${th} text-right`}>Amount</th>
          <th className={`${th} text-right`}>{verify ? "" : "Recorded"}</th>
        </tr>
      </thead>
      <tbody>
        {list.map((p) => (
          <tr key={p.id} className="hover:bg-wash">
            <td className={td}>
              {p.id} · {p.kind}
              <small className={sub}>{p.utr}</small>
            </td>
            <td className={`${td} max-sm:hidden`}>
              {p.booking.startsWith("AOD-") ? <Link href={`/admin/bookings?open=${p.booking}`}>{p.booking}</Link> : p.booking}
              <small className={sub}>{p.customer}</small>
            </td>
            <td className={`${td} text-right`}>{rupees(p.amount)}</td>
            <td className={`${td} text-right`}>
              {verify ? (
                <button type="button" onClick={() => act.verify(p.id)} className={btnMain}>
                  Verify
                </button>
              ) : (
                ago(p.at)
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <Title title="Payments" text="Check each UTR in the bank account before verifying." />
      <Head title="To Verify" className="mt-9">
        {waiting.length}
      </Head>
      {waiting.length ? table(waiting, true) : <p className="border-y border-line py-4 text-muted">Nothing to verify.</p>}

      <Head title="Payouts To Artists" className="mt-11">
        AOD Keeps {Math.round(COMMISSION * 100)}%
      </Head>
      {suggested.length > 0 && (
        <div className="mb-6 rounded-lg bg-wash p-4">
          <p className="mb-2 text-[13px] text-muted">Suggested: each assigned artist&apos;s equal part of the quote, minus AOD&apos;s share. Change the amount before adding.</p>
          <ul>
            {suggested.map((s) => (
              <SuggestedPayout key={`${s.booking}-${s.artist}`} {...s} name={name(s.artist)} />
            ))}
          </ul>
        </div>
      )}
      <table className="w-full border-collapse tabular-nums">
        <thead>
          <tr>
            <th className={th}>Payout</th>
            <th className={th}>Artist</th>
            <th className={`${th} text-right`}>Amount</th>
            <th className={`${th} text-right`}>Status</th>
          </tr>
        </thead>
        <tbody>
          {db.payouts.map((p) => (
            <tr key={p.id} className="hover:bg-wash">
              <td className={td}>
                {p.id}
                <small className={sub}>{p.booking}</small>
              </td>
              <td className={td}>{name(p.artist)}</td>
              <td className={`${td} text-right`}>{rupees(p.amount)}</td>
              <td className={`${td} text-right`}>
                {p.sent ? (
                  "Sent"
                ) : (
                  <button type="button" onClick={() => act.sendPayout(p.id)} className={btn}>
                    Mark Sent
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Head title="Verified" className="mt-11">
        {done.length}
      </Head>
      {table(done, false)}
    </>
  );
}

// Dispute Desk: cases from both sides, with the 48-hour reply clock.
export function Disputes() {
  const db = useDb();
  const o = useOpen();
  const [tab, setTab] = useState<"open" | "all">("open");
  if (!db) return <Loading />;
  const rows = db.cases.filter((c) => tab === "all" || c.status !== "resolved");
  const open = db.cases.find((c) => c.id === o.value);
  const due = (iso: string) => {
    const h = hoursLeft(iso, 48);
    return h > 0 ? `Reply Due In ${h} Hours` : "Reply Overdue";
  };

  return (
    <>
      <Title title="Dispute Desk" text="A reply within 48 hours, a decision within 30 days." />
      <div className="mt-7 border-t border-ink pt-4">
        <Tabs value={tab} onChange={setTab} options={[{ id: "open", label: "Open" }, { id: "all", label: "All" }]} />
      </div>
      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Case</th>
            <th className={`${th} max-sm:hidden`}>Raised By</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="cursor-pointer hover:bg-wash" onClick={() => o.open(c.id)}>
              <td className={td}>
                <button type="button" className="text-left" onClick={() => o.open(c.id)}>
                  {c.id} · {c.about}
                </button>
                <small className={sub}>{c.outside ? "Booked Outside AOD" : c.booking}</small>
              </td>
              <td className={`${td} max-sm:hidden`}>
                {c.name}
                <small className={sub}>{c.role}</small>
              </td>
              <td className={td}>
                <Status tone={c.status === "new" || c.status === "escalated" ? "hot" : c.status === "resolved" ? "dim" : "ink"}>{caseStatuses.find((s) => s.id === c.status)?.label}</Status>
                {c.status === "new" && <small className={sub}>{due(c.raisedAt)}</small>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Drawer open={!!open} onClose={o.close} title={open ? `${open.id} · ${open.about}` : ""} subtitle={open ? `${open.role}, ${open.name}` : undefined}>
        {open && (
          <div className="space-y-8">
            <Rows
              rows={[
                ["Status", caseStatuses.find((s) => s.id === open.status)?.label],
                ["Booking", open.outside ? "Booked Outside AOD (AOD Mediates)" : open.booking],
                ["With", open.otherParty ?? ""],
                ["Email", open.email ?? ""],
                ["Wants", open.outcome ?? ""],
                ["Raised", ago(open.raisedAt)],
                ["Reply", open.status === "new" ? due(open.raisedAt) : "Sent"],
              ]}
            />
            {open.details && <p className="whitespace-pre-line rounded-lg bg-wash p-4">{open.details}</p>}
            {open.outside && (
              <section>
                <Head title="Mediation" />
                <ol className="list-decimal space-y-1 pl-5 text-[13px] text-muted">
                  <li>Contact the other side by phone, WhatsApp or email.</li>
                  <li>Hear both sides; taking part is up to them.</li>
                  <li>Write the settlement down for both to confirm.</li>
                  <li>If it doesn&apos;t settle, send a written summary and the next step.</li>
                </ol>
              </section>
            )}
            <CaseNotes key={open.id} id={open.id} />
            <section>
              <Head title="Mark As" />
              <div className="flex flex-wrap gap-2">
                {caseStatuses.map((s) => (
                  <button key={s.id} type="button" disabled={s.id === open.status} onClick={() => act.setCase(open.id, s.id)} className={s.id === open.status ? btnInk : btn}>
                    {s.label}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </Drawer>
    </>
  );
}


function SuggestedPayout({ booking, artist, amount, name }: { booking: string; artist: string; amount: number; name: string }) {
  const [value, setValue] = useState(String(amount));
  return (
    <li className="flex flex-wrap items-center gap-2 border-t border-line py-2 first:border-t-0">
      <span className="min-w-0 flex-1">
        {name}
        <small className={sub}>{booking}</small>
      </span>
      <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" aria-label={`Payout for ${name}`} className={`${field} h-9 w-28`} />
      <button type="button" onClick={() => act.addPayout(booking, artist, Number(value.replace(/[^\d]/g, "")) || amount)} className={btn}>
        Add Payout
      </button>
    </li>
  );
}

// The team's internal notes (never shown to the person), and the decision they see when tracking.
function CaseNotes({ id }: { id: string }) {
  const db = useDb()!;
  const c = db.cases.find((x) => x.id === id)!;
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState(c.decision ?? "");
  return (
    <>
      <section>
        <Head title="Internal Notes">Team Only</Head>
        {c.notes.length > 0 && (
          <ul className="mb-3 border-b border-line">
            {c.notes.map((n, i) => (
              <li key={i} className="border-t border-line py-2 text-[13px]">
                {n.text}
                <small className={sub}>
                  {n.by}, {ago(n.at)}
                </small>
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            act.caseNote(id, note.trim());
            setNote("");
          }}
        >
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add A Note" aria-label="Internal note" className={field} />
          <button className={btn}>Add</button>
        </form>
      </section>
      <section>
        <Head title="Decision">They See This</Head>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act.caseDecision(id, decision.trim());
          }}
        >
          <textarea value={decision} onChange={(e) => setDecision(e.target.value)} rows={4} aria-label="Decision" className={`${field} h-auto py-2`} />
          <button className={`${btn} mt-2`}>Save Decision</button>
        </form>
      </section>
    </>
  );
}
