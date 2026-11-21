"use client";

import { useState } from "react";
import { categories, cities } from "@/data/site";
import { timeRange } from "@/lib/event-time";
import { act, ago, catName, parseDay, rupees, shortDate, stageLabel, stages, useDb, type Db, type Line, type Stage } from "@/lib/app-db";
import { parseWhatsappOrder } from "@/lib/whatsapp-order";
import { BookingTable } from "./Overview";
import { Drawer, Head, Loading, Rows, Status, Tabs, Title, btn, btnInk, btnMain, btnText, field, label, stageTone, useOpen } from "../ui";

// Every order, as a table or a board (drag a card to another stage), with search. A row or card
// opens the drawer: the details, the stage, the quote, who they need (each kind with how many),
// the artists to shortlist and then assign (with clash and day-off warnings), payments, the
// delivery link, rescheduling, the history and Delete Booking. New Booking adds one by hand, and
// can fill itself from a pasted WhatsApp message. As on aod.co.in, in test mode.
export function Bookings() {
  const db = useDb();
  const o = useOpen();
  const [stage, setStage] = useState<Stage | "all">("all");
  const [view, setView] = useState<"table" | "board">("table");
  const [q, setQ] = useState("");
  if (!db) return <Loading />;

  const t = q.trim().toLowerCase();
  const matches = db.bookings
    .filter((b) => !t || [b.id, b.customer, b.needs, b.city, b.venue ?? ""].some((x) => x.toLowerCase().includes(t)))
    .sort((a, b) => a.date.localeCompare(b.date));
  const rows = matches.filter((b) => stage === "all" || b.stage === stage);
  const open = db.bookings.find((b) => b.id === o.value);

  return (
    <>
      <Title title="Bookings" text="One order per request, however many artists it needs.">
        <Tabs
          value={view}
          onChange={setView}
          options={[
            { id: "table", label: "Table" },
            { id: "board", label: "Board" },
          ]}
        />
        <button type="button" className={btnMain} onClick={() => o.open("new")}>
          New Booking
        </button>
      </Title>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-4">
        {view === "table" ? (
          <Tabs value={stage} onChange={setStage} options={[{ id: "all", label: "All", count: db.bookings.length }, ...stages.map((s) => ({ id: s.id, label: s.label, count: db.bookings.filter((b) => b.stage === s.id).length }))]} />
        ) : (
          <span className="text-[13px] text-muted">Drag a card to move it to another stage.</span>
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter By Order, Customer Or City" aria-label="Filter bookings" className={`${field} h-9 max-w-xs`} />
      </div>
      <div className="mt-5">{view === "table" ? <BookingTable db={db} rows={rows} onOpen={o.open} /> : <Board rows={matches} onOpen={o.open} />}</div>

      <Drawer open={!!open} onClose={o.close} title={open?.id ?? ""} subtitle={open ? `${open.customer} · ${open.source}` : undefined}>
        {open && <BookingDetail key={open.id} id={open.id} onDeleted={o.close} />}
      </Drawer>
      <Drawer open={o.isNew || o.value === "new"} onClose={o.close} title="New Booking" >
        <NewBooking onDone={(id) => o.open(id)} />
      </Drawer>
    </>
  );
}

// The pipeline as columns; a card dragged to another column moves the order to that stage.
function Board({ rows, onOpen }: { rows: Db["bookings"]; onOpen: (id: string) => void }) {
  const [over, setOver] = useState<Stage | null>(null);
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      <div className="grid min-w-[1080px] grid-cols-6 gap-3">
        {stages.map((s) => {
          const list = rows.filter((b) => b.stage === s.id);
          return (
            <div
              key={s.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(s.id);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) act.setStage(id, s.id);
              }}
              className={`min-h-64 rounded-lg p-2 transition-colors ${over === s.id ? "bg-ink/10" : "bg-wash"}`}
            >
              <p className="flex justify-between px-1 pb-2 text-xs text-muted">
                <Status tone={stageTone[s.id]}>{s.label}</Status>
                <span className="tabular-nums">{list.length}</span>
              </p>
              <div className="space-y-2">
                {list.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
                    onClick={() => onOpen(b.id)}
                    className="block w-full cursor-grab rounded-md border border-line bg-paper p-2.5 text-left text-[13px] active:cursor-grabbing"
                  >
                    <span className="block font-medium">{b.customer}</span>
                    <span className="mt-0.5 block text-xs text-muted">{b.needs}</span>
                    <span className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
                      <span>{shortDate(b.date)}</span>
                      <span>{b.quote ? rupees(b.quote) : "–"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingDetail({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const db = useDb()!;
  const b = db.bookings.find((x) => x.id === id);
  const [quote, setQuote] = useState(b?.quote ? String(b.quote) : "");
  const [pay, setPay] = useState({ amount: "", utr: "", kind: "Advance" as "Advance" | "Balance" });
  const [delivery, setDelivery] = useState(b?.delivery ?? "");
  const [move, setMove] = useState({ date: b?.date ?? "", start: b?.start ?? "", end: b?.end ?? "" });
  const [sure, setSure] = useState(false);
  if (!b) return null;

  const replies = db.replies[b.id] ?? {};
  const candidates = db.artists
    .filter((a) => a.active && a.cats.some((c) => b.cats.includes(c)))
    .sort((x, y) => Number(b.shortlist.includes(y.id)) - Number(b.shortlist.includes(x.id)) || Number(replies[y.id] === "accepted") - Number(replies[x.id] === "accepted"));
  const pays = db.payments.filter((p) => p.booking === b.id);
  // Clashes: the artist is on another open order that day; or it's one of their days off.
  const clash = (artist: string) => db.bookings.find((x) => x.id !== b.id && x.date === b.date && x.stage !== "cancelled" && x.assigned.includes(artist));
  const dayOff = (artist: string) => artist === "ART-201" && db.daysOff.includes(b.date);
  const byCategory = (cat: string) => ({
    needed: b.lines.filter((l) => l.category === cat).reduce((n, l) => n + l.count, 0),
    assigned: b.assigned.filter((a) => db.artists.find((x) => x.id === a)?.cats.includes(cat)).length,
  });

  return (
    <div className="space-y-9">
      <Rows
        rows={[
          ["Status", <Status key="s" tone={stageTone[b.stage]}>{b.customerCancelled ? "Cancelled By Customer" : stageLabel(b.stage)}</Status>],
          ["Occasion", b.occasion ?? ""],
          ["Date", parseDay(b.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })],
          ["Time", b.start ? timeRange(b.start, b.end) : ""],
          ["Venue", b.venue ?? ""],
          ["City", b.city],
          ["Customer", b.customer],
          ["Phone", b.phone],
          ["Email", b.email],
          ["Budget", b.budget ?? ""],
          ["Notes", b.notes],
          ["Brief For Artists", b.brief ?? ""],
          ["Review", b.review ? `${"★".repeat(b.review.stars)} ${b.review.text}` : ""],
          ["Received", ago(b.createdAt)],
        ]}
      />

      <section>
        <Head title="Move To" />
        <div className="flex flex-wrap gap-2">
          {stages.map((s) => (
            <button key={s.id} type="button" disabled={s.id === b.stage} onClick={() => act.setStage(b.id, s.id)} className={s.id === b.stage ? btnInk : btn}>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <Head title="Quote" />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            act.setQuote(b.id, Number(quote.replace(/[^\d]/g, "")) || null);
          }}
        >
          <input value={quote} onChange={(e) => setQuote(e.target.value)} inputMode="numeric" placeholder="₹ Amount" aria-label="Quote in rupees" className={field} />
          <button className={btn}>Save</button>
        </form>
      </section>

      <section>
        <Head title="Who They Need" />
        <ul className="border-b border-line">
          {b.lines.map((l, i) => (
            <li key={`${l.name}-${i}`} className="flex items-center gap-3 border-t border-line py-2.5">
              <span className="min-w-0 flex-1">
                {l.name}
                <small className="block text-xs text-muted">{catName(l.category)}</small>
              </span>
              <span className="flex items-center gap-1">
                <button type="button" aria-label={`Fewer ${l.name}`} onClick={() => act.setLineCount(b.id, i, l.count - 1)} className={`${btn} w-9 px-0`}>
                  −
                </button>
                <span className="w-7 text-center tabular-nums">{l.count}</span>
                <button type="button" aria-label={`More ${l.name}`} onClick={() => act.setLineCount(b.id, i, l.count + 1)} className={`${btn} w-9 px-0`}>
                  +
                </button>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] text-muted">
          {b.cats
            .map((c) => {
              const x = byCategory(c);
              return `${catName(c)}: ${x.assigned} of ${x.needed} assigned`;
            })
            .join(" · ")}
        </p>
      </section>

      <section>
        <Head title="Artists">
          {b.shortlist.length} Shortlisted · {b.assigned.length} Assigned
        </Head>
        {candidates.length ? (
          <ul className="border-b border-line">
            {candidates.map((a) => {
              const listed = b.shortlist.includes(a.id);
              const on = b.assigned.includes(a.id);
              const other = clash(a.id);
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-2 border-t border-line py-2.5">
                  <div className="min-w-0 flex-1">
                    {a.name}
                    <small className="block text-xs text-muted">
                      {a.craft}, {a.city}
                      {replies[a.id] && ` · ${replies[a.id] === "accepted" ? "Accepted" : "Declined"}`}
                    </small>
                    {other && <small className="block text-xs text-brand">Booked On {other.id} That Day</small>}
                    {dayOff(a.id) && <small className="block text-xs text-brand">Day Off</small>}
                  </div>
                  <button type="button" disabled={on} onClick={() => act.toggleShortlist(b.id, a.id)} className={listed ? btnInk : btn}>
                    {listed ? "Shortlisted" : "Shortlist"}
                  </button>
                  <button type="button" disabled={!listed && !on} title={!listed && !on ? "Shortlist first" : undefined} onClick={() => act.toggleAssign(b.id, a.id)} className={on ? btnInk : btn}>
                    {on ? "Remove" : "Assign"}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted">No active artists in these categories.</p>
        )}
        <p className="mt-2 text-[13px] text-muted">Shortlisted artists show in the customer&apos;s My Bookings and in the artists&apos; portal.</p>
      </section>

      <section>
        <Head title="Payments" />
        {pays.length > 0 && (
          <ul className="mb-4 border-b border-line">
            {pays.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 border-t border-line py-2.5">
                <span>
                  {p.id} · {p.kind}
                  <small className="block text-xs text-muted">{p.utr}</small>
                </span>
                <span className="text-right">
                  {rupees(p.amount)}
                  <small className="block text-xs text-muted">{p.verified ? "Verified" : "To Verify"}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
        <form
          className="grid grid-cols-[1fr_1fr] gap-2 sm:grid-cols-[110px_1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            act.recordPayment(b.id, Number(pay.amount.replace(/[^\d]/g, "")), pay.utr.trim(), pay.kind);
            setPay({ amount: "", utr: "", kind: "Balance" });
          }}
        >
          <select value={pay.kind} onChange={(e) => setPay({ ...pay, kind: e.target.value as "Advance" | "Balance" })} aria-label="Payment kind" className={field}>
            <option>Advance</option>
            <option>Balance</option>
          </select>
          <input value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} inputMode="numeric" placeholder="₹ Amount" aria-label="Amount" className={field} />
          <input value={pay.utr} onChange={(e) => setPay({ ...pay, utr: e.target.value })} placeholder="UTR" aria-label="UTR" className={field} />
          <button className={btn}>Record Payment</button>
        </form>
      </section>

      <section>
        <Head title="Delivery Link" />
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            act.setDelivery(b.id, delivery.trim());
          }}
        >
          <input value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="drive.google.com/…" aria-label="Delivery link" className={field} />
          <button className={btn}>Save</button>
        </form>
      </section>

      <section>
        <Head title="Reschedule" />
        <form
          className="grid grid-cols-3 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            act.reschedule(b.id, move.date, move.start, move.end);
          }}
        >
          <input type="date" value={move.date} onChange={(e) => setMove({ ...move, date: e.target.value })} aria-label="New date" className={field} />
          <input type="time" value={move.start} onChange={(e) => setMove({ ...move, start: e.target.value })} aria-label="Start" className={field} />
          <input type="time" value={move.end} onChange={(e) => setMove({ ...move, end: e.target.value })} aria-label="End" className={field} />
          <button className={`${btn} col-span-3`}>Save New Date</button>
        </form>
      </section>

      <section>
        <Head title="History" />
        <ol className="border-b border-line">
          {b.history
            .slice()
            .reverse()
            .map((e, i) => (
              <li key={i} className="flex justify-between gap-3 border-t border-line py-2 text-[13px]">
                <span>{e.text}</span>
                <span className="shrink-0 text-muted">
                  {e.by}, {ago(e.at)}
                </span>
              </li>
            ))}
        </ol>
      </section>

      <section className="border-t border-line pt-6">
        {sure ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2">Delete {b.id} for good?</span>
            <button type="button" onClick={() => setSure(false)} className={btn}>
              Keep It
            </button>
            <button
              type="button"
              onClick={() => {
                act.deleteBooking(b.id);
                onDeleted();
              }}
              className={btnMain}
            >
              Delete Booking
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setSure(true)} className={btnText}>
            Delete Booking
          </button>
        )}
      </section>
    </div>
  );
}

const blankNew = { customer: "", phone: "", email: "", date: "", start: "", end: "", city: "", venue: "", budget: "", occasion: "", notes: "" };

function NewBooking({ onDone }: { onDone: (id: string) => void }) {
  const [f, setF] = useState(blankNew);
  const [lines, setLines] = useState<Line[]>([]);
  const [paste, setPaste] = useState("");
  const set = (k: keyof typeof blankNew) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const kinds = categories.flatMap((c) => (c.types.length > 1 ? c.types : [c.name]).map((name) => ({ category: c.slug, name })));
  const countOf = (name: string) => lines.find((l) => l.name === name)?.count ?? 0;
  const setCount = (k: { category: string; name: string }, n: number) =>
    setLines((ls) => (n <= 0 ? ls.filter((l) => l.name !== k.name) : ls.some((l) => l.name === k.name) ? ls.map((l) => (l.name === k.name ? { ...l, count: Math.min(20, n) } : l)) : [...ls, { ...k, count: n }]));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onDone(act.addBooking({ ...f, cats: [...new Set(lines.map((l) => l.category))], lines }));
      }}
    >
      <div className="rounded-lg bg-wash p-4">
        <span className={label}>Paste A WhatsApp Message</span>
        <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} placeholder={"Name: …\nPhone: …\nWho: Photographers × 2, Live Band\nDate: 21 Nov 2026\nTime: 6 PM – 11 PM\nCity: Ahmedabad"} className={`${field} h-auto py-2`} />
        <button
          type="button"
          onClick={() => {
            const o = parseWhatsappOrder(paste, categories);
            setF({ customer: o.customer, phone: o.phone, email: o.email, date: o.date, start: o.start, end: o.end, city: o.city, venue: o.venue, budget: o.budget, occasion: o.occasion, notes: [o.notes, "Came from WhatsApp."].filter(Boolean).join("\n") });
            setLines(o.lines);
          }}
          className={`${btn} mt-2`}
        >
          Fill From Message
        </button>
      </div>

      <div>
        <span className={label}>Who They Need</span>
        <ul className="border-b border-line">
          {kinds.map((k) => (
            <li key={k.name} className="flex items-center justify-between gap-3 border-t border-line py-1.5">
              <span>
                {k.name}
                <small className="ml-2 text-xs text-muted">{catName(k.category)}</small>
              </span>
              <span className="flex items-center gap-1">
                <button type="button" aria-label={`Fewer ${k.name}`} onClick={() => setCount(k, countOf(k.name) - 1)} className={`${btn} h-8 w-8 px-0`}>
                  −
                </button>
                <span className="w-6 text-center tabular-nums">{countOf(k.name)}</span>
                <button type="button" aria-label={`More ${k.name}`} onClick={() => setCount(k, countOf(k.name) + 1)} className={`${btn} h-8 w-8 px-0`}>
                  +
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <label className="block">
        <span className={label}>Customer</span>
        <input value={f.customer} onChange={set("customer")} className={field} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={label}>Phone</span>
          <input value={f.phone} onChange={set("phone")} inputMode="tel" className={field} />
        </label>
        <label className="block">
          <span className={label}>Email</span>
          <input value={f.email} onChange={set("email")} type="email" className={field} />
        </label>
        <label className="block">
          <span className={label}>Occasion</span>
          <input value={f.occasion} onChange={set("occasion")} className={field} />
        </label>
        <label className="block">
          <span className={label}>City</span>
          <select value={f.city} onChange={set("city")} className={field}>
            <option value="">Choose</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Venue (Optional)</span>
          <input value={f.venue} onChange={set("venue")} className={field} />
        </label>
        <label className="block">
          <span className={label}>Budget (Optional)</span>
          <input value={f.budget} onChange={set("budget")} className={field} />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="block">
          <span className={label}>Date</span>
          <input value={f.date} onChange={set("date")} type="date" className={field} />
        </label>
        <label className="block">
          <span className={label}>Start</span>
          <input value={f.start} onChange={set("start")} type="time" className={field} />
        </label>
        <label className="block">
          <span className={label}>End</span>
          <input value={f.end} onChange={set("end")} type="time" className={field} />
        </label>
      </div>
      <label className="block">
        <span className={label}>Notes</span>
        <textarea value={f.notes} onChange={set("notes")} rows={3} className={`${field} h-auto py-2`} />
      </label>
      <button className={`${btnMain} w-full`}>Create Booking</button>
    </form>
  );
}
