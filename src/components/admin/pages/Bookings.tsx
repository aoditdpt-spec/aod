"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CalendarDays, Columns3, ExternalLink, List, MapPin, Plus, Star, Users } from "lucide-react";
import { useState, type DragEvent } from "react";
import { activeBookingStages, bookingStages, paymentStatuses, templates, type TemplateId } from "@/content/admin";
import { categories, cities } from "@/content/site";
import { currentUser, newId, update, useDb, type Booking, type BookingStatus, type Db } from "@/lib/admin-store";
import { durationText, endsNextDay, eventMinutes, timeRange } from "@/lib/event-time";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { CopyButton } from "@/components/pay/CopyButton";
import { payLink, usePayBase } from "@/components/pay/PayLinkBuilder";
import { DataTable, type Column } from "../DataTable";
import {
  ActionButton,
  addDays,
  artistName,
  categoryName,
  daysUntil,
  Details,
  Drawer,
  DrawerSection,
  fieldBase,
  fieldClass,
  fillTemplate,
  fmtDate,
  inr,
  Labelled,
  NotesBox,
  PageHeader,
  StageBadge,
  todayKey,
  useCan,
  whatsappTo,
} from "../ui";
import { useOpen } from "../useOpen";

const label = (id: string) => bookingStages.find((s) => s.id === id)?.label ?? id;

// Change a booking's status and record it in its history and the activity log.
function moveTo(b: Booking, status: BookingStatus, extra?: (x: Booking) => void, text?: string) {
  update(
    "Bookings",
    text ?? `Moved ${b.id} to ${label(status)}`,
    (db) => {
      const x = db.bookings.find((y) => y.id === b.id)!;
      x.status = status;
      x.history.push({ at: new Date().toISOString(), by: currentUser(), status });
      extra?.(x);
    },
    b.id,
  );
}

export function Bookings() {
  const db = useDb();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [openId, setOpen] = useOpen();
  const view = params.get("view") === "table" ? "table" : "board";
  const adding = params.get("new") === "1";
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (v) next.set(k, v);
    else next.delete(k);
    router.push(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  };
  if (!db) return null;
  const open = db.bookings.find((b) => b.id === openId) ?? null;

  const columns: Column<Booking>[] = [
    { key: "id", label: "Booking", render: (b) => `${b.id} · ${b.customer.name}`, value: (b) => `${b.id} ${b.customer.name}` },
    { key: "service", label: "Service", render: (b) => b.service, value: (b) => b.service },
    { key: "date", label: "Event date", render: (b) => fmtDate(b.date), value: (b) => b.date },
    { key: "city", label: "City", render: (b) => b.city, value: (b) => b.city, hideOnMobile: true },
    { key: "artist", label: "Artist", render: (b) => artistName(db, b.artistId), value: (b) => artistName(db, b.artistId), hideOnMobile: true },
    { key: "quote", label: "Quote", render: (b) => inr(b.quote), value: (b) => b.quote ?? 0, hideOnMobile: true },
    { key: "type", label: "Type", render: (b) => b.audience, value: (b) => b.audience, hideOnMobile: true },
    { key: "status", label: "Status", render: (b) => <StageBadge stages={bookingStages} id={b.status} />, value: (b) => label(b.status) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        text="Every request from New to Reviewed. Drag cards between columns, or open one to match an artist, send the quote and payment link, and track delivery."
        actions={
          <>
            <div className="flex rounded-lg border border-line bg-white p-0.5" role="group" aria-label="View">
              <button type="button" onClick={() => setParam("view", null)} aria-pressed={view === "board"} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm ${view === "board" ? "bg-night text-white" : "text-body"}`}>
                <Columns3 className="h-4 w-4" aria-hidden /> Board
              </button>
              <button type="button" onClick={() => setParam("view", "table")} aria-pressed={view === "table"} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm ${view === "table" ? "bg-night text-white" : "text-body"}`}>
                <List className="h-4 w-4" aria-hidden /> Table
              </button>
            </div>
            <ActionButton permission="bookings.edit" onClick={() => setParam("new", "1")}>
              <Plus className="h-4 w-4" aria-hidden /> New booking
            </ActionButton>
          </>
        }
      />

      {view === "board" ? (
        <Board db={db} onOpen={(id) => setOpen(id)} />
      ) : (
        <DataTable
          rows={db.bookings}
          columns={columns}
          getId={(b) => b.id}
          onOpen={(b) => setOpen(b.id)}
          exportName="bookings"
          initialSort={{ key: "date", dir: "asc" }}
          filters={[
            { label: "Status", options: bookingStages.map((s) => ({ value: s.id, label: s.label })), test: (b, v) => b.status === v },
            { label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })), test: (b, v) => b.category === v },
            { label: "City", options: cities.map((c) => ({ value: c, label: c })), test: (b, v) => b.city === v },
            { label: "Type", options: [{ value: "Personal", label: "Personal" }, { value: "Business", label: "Business" }], test: (b, v) => b.audience === v },
          ]}
        />
      )}
      {open && <BookingDrawer key={open.id} booking={open} db={db} onClose={() => setOpen(null)} />}
      {adding && <NewBooking onClose={() => setParam("new", null)} onCreated={(id) => router.push(`${pathname}?open=${id}`, { scroll: false })} />}
    </div>
  );
}

// Kanban board: one column per stage, cards can be dragged to another column.
function Board({ db, onOpen }: { db: Db; onOpen: (id: string) => void }) {
  const editable = useCan()("bookings.edit");
  const [over, setOver] = useState<string | null>(null);
  const stages = [...activeBookingStages, "rescheduled", "cancelled"] as BookingStatus[];

  function drop(e: DragEvent, status: BookingStatus) {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const b = db.bookings.find((x) => x.id === id);
    if (b && b.status !== status && editable) moveTo(b, status);
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex gap-3">
        {stages.map((s) => {
          const cards = db.bookings.filter((b) => b.status === s).sort((a, b) => a.date.localeCompare(b.date));
          return (
            <section
              key={s}
              aria-label={label(s)}
              onDragOver={(e) => {
                if (!editable) return;
                e.preventDefault();
                setOver(s);
              }}
              onDragLeave={() => setOver((o) => (o === s ? null : o))}
              onDrop={(e) => drop(e, s)}
              className={`flex w-64 shrink-0 flex-col rounded-2xl p-2 transition-colors ${over === s ? "bg-peach/60" : "bg-white/60"}`}
            >
              <h2 className="flex items-center justify-between px-2 py-1.5 text-sm font-medium text-ink">
                {label(s)} <span className="rounded-full bg-wash px-2 text-xs text-muted">{cards.length}</span>
              </h2>
              <ul className="mt-1 space-y-2">
                {cards.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      draggable={editable}
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", b.id)}
                      onClick={() => onOpen(b.id)}
                      className="w-full rounded-xl border border-line bg-white p-3 text-left text-sm shadow-sm transition hover:border-brand/50 hover:shadow-md"
                    >
                      <span className="flex items-center justify-between text-xs text-muted">
                        {b.id}
                        <span className={b.audience === "Business" ? "rounded bg-night px-1.5 text-white" : ""}>{b.audience === "Business" ? "B2B" : ""}</span>
                      </span>
                      <span className="mt-1 block font-medium text-ink">{b.customer.name}</span>
                      <span className="block text-body">{b.service}</span>
                      <span className="mt-2 flex items-center gap-3 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {fmtDate(b.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden /> {b.city}
                        </span>
                      </span>
                      {(b.artistId || b.quote) && (
                        <span className="mt-2 flex items-center justify-between border-t border-line pt-2 text-xs">
                          <span className="truncate text-ink">{artistName(db, b.artistId)}</span>
                          <span className="font-medium text-ink">{inr(b.quote)}</span>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BookingDrawer({ booking: b, db, onClose }: { booking: Booking; db: Db; onClose: () => void }) {
  const allowed = useCan();
  const editable = allowed("bookings.edit");
  const base = usePayBase();
  const [quote, setQuote] = useState(b.quote ? String(b.quote) : "");
  const [advance, setAdvance] = useState(b.advance ? String(b.advance) : "");
  const [delivery, setDelivery] = useState(b.delivery?.link ?? "");
  const [utr, setUtr] = useState("");
  const [paid, setPaid] = useState("");
  const [rating, setRating] = useState(b.review?.rating ?? 5);
  const [review, setReview] = useState(b.review?.text ?? "");
  const [newDate, setNewDate] = useState(b.date);
  const [reason, setReason] = useState("");

  const artist = db.artists.find((a) => a.id === b.artistId);
  const payments = db.payments.filter((p) => p.bookingId === b.id);
  const verified = payments.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
  const due = (b.advance ?? b.quote ?? 0) - verified;
  const link = base ? payLink(base, { amount: due > 0 ? due : b.quote, forText: `${b.service}, ${fmtDate(b.date)}`, ref: b.id, name: b.customer.name }) : "";
  const expiry = addDays(todayKey(), db.settings.deliveryLinkDays);

  // Artists who could take this: same category, active, free that day. Same city first.
  const candidates = db.artists
    .filter((a) => a.category === b.category && a.status === "active")
    .map((a) => {
      const clash = db.bookings.some((x) => x.id !== b.id && x.artistId === a.id && x.date === b.date && !["cancelled", "rescheduled"].includes(x.status));
      const off = a.blockedDates.includes(b.date);
      return { a, free: !clash && !off, why: off ? "Day off" : clash ? "Booked that day" : a.city === b.city ? "Free · same city" : `Free · ${a.city}` };
    })
    .sort((x, y) => Number(y.free) - Number(x.free) || Number(y.a.city === b.city) - Number(x.a.city === b.city));

  const vars: Record<string, string> = {
    customer: b.customer.name.split(" ")[0],
    service: b.service,
    event: b.event.toLowerCase(),
    date: fmtDate(b.date),
    city: b.city,
    ref: b.id,
    amount: inr(due > 0 ? due : b.quote),
    quote: inr(b.quote),
    budget: b.budget,
    paylink: link,
    artist: artist?.name ?? "your artist",
    delivery: b.delivery?.link ?? delivery,
    expiry: fmtDate(b.delivery?.expires ?? expiry),
  };
  const send = (id: TemplateId, to: "customer" | "artist") => whatsappTo(to === "customer" ? b.customer.phone : artist?.phone ?? "", fillTemplate(id, vars));
  const edit = (text: string, fn: (x: Booking) => void) => update("Bookings", text, (d) => fn(d.bookings.find((x) => x.id === b.id)!), b.id);
  const waBtn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:border-ink";

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${b.id} · ${b.customer.name}`}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {b.service} · {fmtDate(b.date)} · {b.city} <StageBadge stages={bookingStages} id={b.status} />
        </span>
      }
      footer={
        <>
          <a href={whatsappTo(b.customer.phone, `Hi ${vars.customer}, `)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover">
            <WhatsAppIcon className="h-4 w-4" /> Customer
          </a>
          {artist && (
            <a href={whatsappTo(artist.phone, `Hi ${artist.name.split(" ")[0]}, about ${b.id}: `)} target="_blank" rel="noopener noreferrer" className={waBtn}>
              <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Artist
            </a>
          )}
          <label className="ml-auto flex items-center gap-2 whitespace-nowrap text-sm text-muted">
            Move to
            <select
              value={b.status}
              disabled={!editable}
              onChange={(e) => moveTo(b, e.target.value as BookingStatus)}
              className={`${fieldBase} w-auto py-1.5`}
            >
              {bookingStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </>
      }
    >
      <DrawerSection title="Request">
        <Details
          rows={[
            ["Customer", `${b.customer.name} (${b.audience})`],
            ["Phone", b.customer.phone],
            ["Email", b.customer.email],
            ["Event", `${b.event} · ${fmtDate(b.date)}, ${timeRange(b.time, b.endTime)}`],
            ["Venue", `${b.venue}, ${b.city}`],
            ["Service", `${categoryName(b.category)} · ${b.service}`],
            ["Budget", b.budget],
            ["Notes", b.notes || "—"],
            ["Requested", fmtDate(b.createdAt, true)],
          ]}
        />
      </DrawerSection>

      <DrawerSection title="Artist">
        {artist ? (
          <p className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-peach/40 p-3 text-sm">
            <span>
              Assigned: <strong className="font-medium">{artist.name}</strong> · {artist.city}
            </span>
            <a href={send("artist_request", "artist")} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand underline underline-offset-2">
              Ask availability
            </a>
          </p>
        ) : (
          <p className="mb-3 text-sm text-muted">No artist assigned yet. Pick one, or shortlist up to three to offer the customer.</p>
        )}
        <ul className="divide-y divide-line rounded-lg border border-line">
          {candidates.length === 0 && <li className="p-3 text-sm text-muted">No active {categoryName(b.category).toLowerCase()} yet.</li>}
          {candidates.map(({ a, free, why }) => {
            const listed = b.shortlist.includes(a.id);
            return (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{a.name}</span>
                  <span className={`block text-xs ${free ? "text-emerald-700" : "text-red-700"}`}>{why}</span>
                </span>
                <button
                  type="button"
                  disabled={!editable || (!listed && b.shortlist.length >= 3)}
                  onClick={() => edit(`${listed ? "Removed" : "Shortlisted"} ${a.name} for ${b.id}`, (x) => void (x.shortlist = listed ? x.shortlist.filter((i) => i !== a.id) : [...x.shortlist, a.id]))}
                  className={`rounded-md px-2 py-1 text-xs font-medium disabled:opacity-40 ${listed ? "bg-night text-white" : "border border-line text-ink"}`}
                >
                  <Users className="mr-1 inline h-3 w-3" aria-hidden />
                  {listed ? "Shortlisted" : "Shortlist"}
                </button>
                <button
                  type="button"
                  disabled={!editable || b.artistId === a.id}
                  onClick={() =>
                    moveTo(b, b.status === "new" ? "matched" : b.status, (x) => void (x.artistId = a.id), `Assigned ${a.name} to ${b.id}`)
                  }
                  className="rounded-md bg-brand px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                >
                  {b.artistId === a.id ? "Assigned" : "Assign"}
                </button>
              </li>
            );
          })}
        </ul>
      </DrawerSection>

      <DrawerSection title="Quote and payment">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Labelled label="Quote (₹)">
            <input value={quote} onChange={(e) => setQuote(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={fieldClass} disabled={!editable} />
          </Labelled>
          <Labelled label={`Advance (₹) · default ${db.settings.advancePct}%`}>
            <input
              value={advance}
              onChange={(e) => setAdvance(e.target.value.replace(/\D/g, ""))}
              placeholder={quote ? String(Math.round((Number(quote) * db.settings.advancePct) / 100)) : ""}
              inputMode="numeric"
              className={fieldClass}
              disabled={!editable}
            />
          </Labelled>
          <ActionButton
            permission="bookings.edit"
            className="self-end"
            disabled={!quote}
            onClick={() => {
              const q = Number(quote);
              const adv = advance ? Number(advance) : Math.round((q * db.settings.advancePct) / 100);
              setAdvance(String(adv));
              moveTo(b, ["new", "matched"].includes(b.status) ? "quoted" : b.status, (x) => {
                x.quote = q;
                x.advance = adv;
              }, `Set the quote for ${b.id} to ${inr(q)} (advance ${inr(adv)})`);
            }}
          >
            Save quote
          </ActionButton>
        </div>
        {b.quote && (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={send("quote", "customer")} target="_blank" rel="noopener noreferrer" className={waBtn}>
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Send quote
              </a>
              <a
                href={send("payment_link", "customer")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => b.status === "quoted" && editable && moveTo(b, "payment_pending", undefined, `Sent the payment link for ${b.id}`)}
                className={waBtn}
              >
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Send payment link
              </a>
              {b.status === "payment_pending" && (
                <a href={send("payment_reminder", "customer")} target="_blank" rel="noopener noreferrer" className={waBtn}>
                  <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Reminder
                </a>
              )}
            </div>
            {link && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-wash p-2.5 text-xs">
                <span className="min-w-0 flex-1 truncate font-mono text-muted">{link}</span>
                <CopyButton text={link} label="Copy" className="py-1" />
                <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Open payment page" className="rounded p-1 text-muted hover:text-ink">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </div>
            )}
          </>
        )}
        <div className="mt-4 rounded-lg border border-line p-3">
          <p className="text-sm text-ink">
            Paid and verified: <strong className="font-medium">{inr(verified)}</strong>
            {b.quote ? ` of ${inr(b.quote)}` : ""}
          </p>
          {payments.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-muted">
                    {p.id} · UTR {p.utr} · {fmtDate(p.reportedAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink">{inr(p.amount)}</span>
                    <StageBadge stages={paymentStatuses} id={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {editable && (
            <form
              className="mt-3 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\d{12}$/.test(utr.replace(/\s/g, "")) || !Number(paid)) return;
                update("Payments", `Recorded a payment of ${inr(Number(paid))} for ${b.id} (to verify)`, (d) => void d.payments.unshift({ id: newId("PAY"), bookingId: b.id, amount: Number(paid), utr: utr.replace(/\s/g, ""), payer: b.customer.name, reportedAt: new Date().toISOString(), status: "pending" }), b.id);
                setUtr("");
                setPaid("");
              }}
            >
              <input value={paid} onChange={(e) => setPaid(e.target.value.replace(/\D/g, ""))} placeholder="Amount" aria-label="Amount paid" inputMode="numeric" className={`${fieldBase} w-28 shrink-0`} />
              <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/[^\d ]/g, ""))} placeholder="12-digit UTR" aria-label="UTR" inputMode="numeric" className={`${fieldBase} min-w-0 flex-1`} />
              <button type="submit" className="rounded-lg border border-line px-3 text-sm font-medium text-ink hover:border-ink">
                Record payment
              </button>
            </form>
          )}
          <p className="mt-2 text-xs text-muted">Customer-reported payments appear in Payments to verify. Verifying confirms the booking.</p>
        </div>
      </DrawerSection>

      {["confirmed", "completed", "delivered", "reviewed"].includes(b.status) && (
        <DrawerSection title="Event, delivery and review">
          <div className="flex flex-wrap gap-2">
            {b.status === "confirmed" && (
              <>
                <a href={send("event_reminder", "customer")} target="_blank" rel="noopener noreferrer" className={waBtn}>
                  <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Event reminder
                </a>
                {artist && (
                  <a href={send("artist_confirmed", "artist")} target="_blank" rel="noopener noreferrer" className={waBtn}>
                    <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Tell the artist
                  </a>
                )}
                <ActionButton permission="bookings.edit" variant="secondary" disabled={daysUntil(b.date) > 0} title={daysUntil(b.date) > 0 ? "After the event date" : undefined} onClick={() => moveTo(b, "completed")}>
                  Mark event done
                </ActionButton>
              </>
            )}
          </div>
          {(b.status === "completed" || b.status === "delivered" || b.status === "reviewed") && (
            <div className="mt-3 space-y-2">
              <Labelled label={`Delivery link (AOD-owned Drive) · expires after ${db.settings.deliveryLinkDays} days`}>
                <input value={delivery} onChange={(e) => setDelivery(e.target.value)} placeholder="https://drive.google.com/…" className={fieldClass} disabled={!editable} />
              </Labelled>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  permission="bookings.edit"
                  disabled={!/^https?:\/\/\S+\.\S+/.test(delivery)}
                  onClick={() =>
                    moveTo(b, b.status === "completed" ? "delivered" : b.status, (x) => void (x.delivery = { link: delivery.trim(), expires: x.delivery?.expires ?? expiry }), `Added the delivery link for ${b.id}`)
                  }
                >
                  Save delivery link
                </ActionButton>
                {b.delivery && (
                  <a href={send("delivery", "customer")} target="_blank" rel="noopener noreferrer" className={waBtn}>
                    <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Send link
                  </a>
                )}
                {b.delivery && <span className="self-center text-xs text-muted">Expires {fmtDate(b.delivery.expires)}</span>}
              </div>
            </div>
          )}
          {(b.status === "delivered" || b.status === "reviewed") && (
            <div className="mt-4 rounded-lg border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Customer review</p>
                <a href={send("review", "customer")} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand underline underline-offset-2">
                  Ask for a review
                </a>
              </div>
              <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} disabled={!editable} onClick={() => setRating(n)}>
                    <Star className={`h-5 w-5 ${n <= rating ? "fill-brand-bright text-brand-bright" : "text-line"}`} aria-hidden />
                  </button>
                ))}
              </div>
              <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={2} placeholder="What the customer said" className={`${fieldClass} mt-2`} disabled={!editable} />
              <ActionButton permission="bookings.edit" variant="secondary" className="mt-2" disabled={!review.trim()} onClick={() => moveTo(b, "reviewed", (x) => void (x.review = { rating, text: review.trim() }), `Saved a ${rating}-star review for ${b.id}`)}>
                Save review
              </ActionButton>
            </div>
          )}
        </DrawerSection>
      )}

      {!["cancelled", "reviewed"].includes(b.status) && editable && (
        <DrawerSection title="Reschedule or cancel">
          <div className="flex flex-wrap gap-2">
            <input type="date" value={newDate} min={todayKey()} onChange={(e) => setNewDate(e.target.value)} aria-label="New date" className={`${fieldBase} w-auto`} />
            <ActionButton
              permission="bookings.edit"
              variant="secondary"
              disabled={newDate === b.date}
              onClick={() => moveTo(b, "rescheduled", (x) => void (x.date = newDate), `Rescheduled ${b.id} from ${fmtDate(b.date)} to ${fmtDate(newDate)}`)}
            >
              Reschedule
            </ActionButton>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for cancelling" className={`${fieldBase} min-w-0 flex-1`} />
            <ActionButton
              permission="bookings.edit"
              variant="danger"
              onClick={() => {
                if (window.confirm(`Cancel ${b.id}? Refunds follow the published refund policy.`)) {
                  moveTo(b, "cancelled", (x) => void (reason && x.notesLog.unshift({ at: new Date().toISOString(), by: currentUser(), text: `Cancelled: ${reason}` })), `Cancelled ${b.id}${reason ? `: ${reason}` : ""}`);
                }
              }}
            >
              Cancel booking
            </ActionButton>
          </div>
        </DrawerSection>
      )}

      <DrawerSection title="Messages">
        <div className="flex flex-wrap gap-1.5">
          {templates
            .filter((t) => t.to !== "applicant" && (t.to === "customer" || artist))
            .map((t) => (
              <a key={t.id} href={send(t.id, t.to === "artist" ? "artist" : "customer")} target="_blank" rel="noopener noreferrer" className="rounded-md border border-line px-2 py-1 text-xs text-ink hover:border-whatsapp hover:text-whatsapp">
                {t.name}
              </a>
            ))}
        </div>
      </DrawerSection>

      <DrawerSection title="History">
        <ol className="space-y-2 border-l-2 border-line pl-4">
          {[...b.history].reverse().map((h, i) => (
            <li key={i} className="text-sm">
              <StageBadge stages={bookingStages} id={h.status} />
              <span className="ml-2 text-xs text-muted">
                {fmtDate(h.at, true)} · {h.by}
              </span>
            </li>
          ))}
        </ol>
      </DrawerSection>

      <DrawerSection title="Team notes">
        <NotesBox notes={b.notesLog} permission="bookings.edit" onAdd={(text) => edit(`Added a note to ${b.id}`, (x) => void x.notesLog.unshift({ at: new Date().toISOString(), by: currentUser(), text }))} />
      </DrawerSection>
    </Drawer>
  );
}

export function NewBooking({ onClose, onCreated, from }: { onClose: () => void; onCreated: (id: string) => void; from?: { name: string; phone: string; need: string; city: string; type: "Personal" | "Business"; leadId: string } }) {
  const [f, setF] = useState({
    name: from?.name ?? "",
    phone: from?.phone ?? "",
    email: "",
    audience: from?.type ?? ("Personal" as "Personal" | "Business"),
    category: categories[0].slug,
    service: categories[0].services[0].name,
    event: "",
    date: "",
    time: "",
    endTime: "",
    city: from?.city && (cities as string[]).includes(from.city) ? from.city : cities[0],
    venue: "",
    budget: "",
    notes: from?.need ?? "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const cat = categories.find((c) => c.slug === f.category)!;
  // Every detail is required, including the event's start and end time.
  const length = eventMinutes(f.time, f.endTime);
  const ok =
    f.name.trim().length >= 2 &&
    f.phone.replace(/\D/g, "").length >= 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) &&
    f.event.trim() &&
    f.date &&
    length !== null &&
    f.venue.trim() &&
    f.budget.trim() &&
    f.notes.trim();

  return (
    <Drawer
      open
      onClose={onClose}
      title={from ? `New booking from lead ${from.leadId}` : "New booking"}
      subtitle="For requests that came by phone, WhatsApp or in person. Every field is required. Website requests arrive here by themselves."
      footer={
        <ActionButton
          permission="bookings.edit"
          disabled={!ok}
          onClick={() => {
            const id = newId("B");
            const now = new Date().toISOString();
            update(
              "Bookings",
              `Created booking ${id} for ${f.name}`,
              (db) => {
                db.bookings.unshift({
                  id,
                  createdAt: now,
                  audience: f.audience,
                  customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() },
                  category: f.category,
                  service: f.service,
                  event: f.event.trim(),
                  date: f.date,
                  time: f.time,
                  endTime: f.endTime,
                  city: f.city,
                  venue: f.venue.trim(),
                  budget: f.budget.trim(),
                  notes: f.notes.trim(),
                  status: "new",
                  shortlist: [],
                  history: [{ at: now, by: currentUser(), status: "new" }],
                  notesLog: [],
                });
                if (from) {
                  const lead = db.leads.find((l) => l.id === from.leadId);
                  if (lead) {
                    lead.status = "converted";
                    lead.bookingId = id;
                  }
                }
              },
              id,
            );
            onClose();
            onCreated(id);
          }}
        >
          Create booking
        </ActionButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Labelled label="Customer name">
          <input value={f.name} onChange={set("name")} className={fieldClass} />
        </Labelled>
        <Labelled label="Phone">
          <input value={f.phone} onChange={set("phone")} inputMode="tel" className={fieldClass} />
        </Labelled>
        <Labelled label="Email">
          <input value={f.email} onChange={set("email")} type="email" className={fieldClass} />
        </Labelled>
        <Labelled label="Type">
          <select value={f.audience} onChange={set("audience")} className={fieldClass}>
            <option>Personal</option>
            <option>Business</option>
          </select>
        </Labelled>
        <Labelled label="Category">
          <select
            value={f.category}
            onChange={(e) => {
              const c = categories.find((x) => x.slug === e.target.value)!;
              setF((x) => ({ ...x, category: c.slug, service: c.services[0].name }));
            }}
            className={fieldClass}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Labelled>
        <Labelled label="Service">
          <select value={f.service} onChange={set("service")} className={fieldClass}>
            {cat.services.map((s) => (
              <option key={s.name}>{s.name}</option>
            ))}
          </select>
        </Labelled>
        <Labelled label="Event">
          <input value={f.event} onChange={set("event")} placeholder="Wedding, launch, birthday…" className={fieldClass} />
        </Labelled>
        <Labelled label="Date">
          <input type="date" value={f.date} min={todayKey()} onChange={set("date")} className={fieldClass} />
        </Labelled>
        <Labelled label="Start time">
          <input type="time" step={900} value={f.time} onChange={set("time")} className={fieldClass} />
        </Labelled>
        <Labelled label="End time">
          <input type="time" step={900} value={f.endTime} onChange={set("endTime")} className={fieldClass} />
        </Labelled>
        <p className="-mt-2 text-xs text-muted sm:col-span-2" aria-live="polite">
          {length !== null
            ? `${timeRange(f.time, f.endTime).replace(/ \(.*\)$/, "")} · ${durationText(length)}${endsNextDay(f.time, f.endTime) ? ", ends next day" : ""}`
            : f.time && f.endTime
              ? "Start and end can't be the same time."
              : "When the artist is needed, from start to end."}
        </p>
        <Labelled label="City">
          <select value={f.city} onChange={set("city")} className={fieldClass}>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Labelled>
        <Labelled label="Venue / area" className="sm:col-span-2">
          <input value={f.venue} onChange={set("venue")} className={fieldClass} />
        </Labelled>
        <Labelled label="Budget">
          <input value={f.budget} onChange={set("budget")} placeholder="₹20,000–30,000" className={fieldClass} />
        </Labelled>
        <Labelled label="Notes" className="sm:col-span-2">
          <textarea value={f.notes} onChange={set("notes")} rows={3} className={fieldClass} />
        </Labelled>
      </div>
    </Drawer>
  );
}
