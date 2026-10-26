"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CalendarDays, Columns3, List, MapPin, Plus, Star, Trash2, Users } from "lucide-react";
import { useState, type DragEvent } from "react";
import { activeBookingStages, bookingStages, paymentStatuses, templates, type TemplateId } from "@/content/admin";
import { briefCommonRows, briefLines, briefRows } from "@/content/artist-brief";
import { categories, cities } from "@/content/site";
import { currentUser, newId, newOrderId, update, useDb, type Artist, type Booking, type BookingStatus, type Db } from "@/lib/admin-store";
import { assignedArtists, itemFor, itemsLabel, MAX_ARTISTS, totalNeeded, withCount, worksIn, type BookingItem } from "@/lib/booking-needs";
import { durationText, endsNextDay, eventMinutes, timeRange } from "@/lib/event-time";
import { lineId } from "@/lib/order-id";
import { parseOrderMessage, pickService } from "@/lib/whatsapp-order";
import { ArtistPhoto } from "@/components/ui/ArtistPhoto";
import { CountPicker } from "@/components/ui/CountPicker";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { DataTable, type Column } from "../DataTable";
import {
  ActionButton,
  addDays,
  ago,
  artistList,
  artistNames,
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

// "2 of 4 · Aarav Joshi, Dev Solanki" when an order needs several artists; the names otherwise.
const assignedText = (db: Db, b: Booking) => {
  const ids = assignedArtists(b.items);
  const need = totalNeeded(b.items);
  return need > 1 ? `${ids.length} of ${need}${ids.length ? ` · ${artistNames(db, ids)}` : ""}` : artistNames(db, ids);
};

// "Photographers · Wedding photography × 2": one line of an order. Website requests name the
// category as the service, so it shows once.
const itemText = (i: BookingItem) =>
  withCount(!i.service || i.service === categoryName(i.category) ? categoryName(i.category) : `${categoryName(i.category)} · ${i.service}`, i.count);

// Change a booking's status and record it in its history and the activity log.
function moveTo(b: Booking, status: BookingStatus, extra?: (x: Booking) => void, text?: string) {
  update(
    "Bookings",
    text ?? `Moved ${b.id} to ${label(status)}`,
    (db) => {
      const x = db.bookings.find((y) => y.id === b.id)!;
      // History lists status changes (and every reschedule), not every edit made in a stage.
      if (x.status !== status || status === "rescheduled") x.history.push({ at: new Date().toISOString(), by: currentUser(), status });
      x.status = status;
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
    { key: "service", label: "Needs", render: (b) => itemsLabel(b.items), value: (b) => itemsLabel(b.items) },
    { key: "date", label: "Event date", render: (b) => fmtDate(b.date), value: (b) => b.date },
    { key: "city", label: "City", render: (b) => b.city, value: (b) => b.city, hideOnMobile: true },
    { key: "artist", label: "Artists", render: (b) => assignedText(db, b), value: (b) => assignedText(db, b), hideOnMobile: true },
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
            { label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })), test: (b, v) => b.items.some((i) => i.category === v) },
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
              <h2 className="flex items-center justify-between px-2 py-1.5 text-sm font-bold text-ink">
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
                      <span className="block text-body">{itemsLabel(b.items)}</span>
                      <span className="mt-2 flex items-center gap-3 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {fmtDate(b.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden /> {b.city}
                        </span>
                      </span>
                      {(assignedArtists(b.items).length > 0 || b.quote) && (
                        <span className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2 text-xs">
                          <span className="truncate text-ink">{assignedText(db, b)}</span>
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
  const [quote, setQuote] = useState(b.quote ? String(b.quote) : "");
  const [advance, setAdvance] = useState(b.advance ? String(b.advance) : "");
  const [delivery, setDelivery] = useState(b.delivery?.link ?? "");
  const [utr, setUtr] = useState("");
  const [paid, setPaid] = useState("");
  const [rating, setRating] = useState(b.review?.rating ?? 5);
  const [review, setReview] = useState(b.review?.text ?? "");
  const [newDate, setNewDate] = useState(b.date);
  const [reason, setReason] = useState("");

  // Everyone assigned, across the order's lines.
  const assigned = assignedArtists(b.items).map((id) => db.artists.find((a) => a.id === id)).filter((a): a is Artist => a !== undefined);
  const artist = assigned.length === 1 ? assigned[0] : undefined;
  const need = totalNeeded(b.items);
  // Shortlisted artists are offered to the customer; a couple more than needed for each category.
  const shortlistMax = Math.max(3, need + 2 * b.items.length);
  const payments = db.payments.filter((p) => p.bookingId === b.id);
  const verified = payments.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
  const due = (b.advance ?? b.quote ?? 0) - verified;
  const expiry = addDays(todayKey(), db.settings.deliveryLinkDays);

  const vars: Record<string, string> = {
    customer: b.customer.name.split(" ")[0],
    service: itemsLabel(b.items),
    event: b.event.toLowerCase(),
    date: fmtDate(b.date),
    city: b.city,
    ref: b.id,
    amount: inr(due > 0 ? due : b.quote),
    quote: inr(b.quote),
    budget: b.budget,
    artist: artistList(db, assignedArtists(b.items), need > 1 ? "your artists" : "your artist"),
    delivery: b.delivery?.link ?? delivery,
    expiry: fmtDate(b.delivery?.expires ?? expiry),
  };
  // A message to the customer, or to one artist (named in it, about their own line of the order,
  // under that line's ID: AOD-DR-102602 of order AOD-MIX-102602).
  const send = (id: TemplateId, to: "customer" | Artist) =>
    to === "customer"
      ? whatsappTo(b.customer.phone, fillTemplate(id, vars))
      : whatsappTo(to.phone, artistMessage(id, to));
  // To an artist: the template, and with a new request their part of the customer's brief (the
  // questions for their category, and the answers for everyone).
  function artistMessage(id: TemplateId, to: Artist) {
    const line = itemFor(b.items, to.id, to);
    const text = fillTemplate(id, { ...vars, ref: line ? lineId(b.id, line.category) : vars.ref, service: line?.service ?? vars.service, artist: to.name });
    const brief = id === "artist_request" && line ? briefLines(b.brief, categoryName, [line.category]) : [];
    return brief.length ? `${text}\n\nBrief from the customer:\n${brief.map((l) => `- ${l}`).join("\n")}` : text;
  }
  const edit = (text: string, fn: (x: Booking) => void) => update("Bookings", text, (d) => fn(d.bookings.find((x) => x.id === b.id)!), b.id);
  const waBtn = "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink hover:border-ink";
  const first = (a: Artist) => a.name.split(" ")[0];
  const artistRef = (a: Artist) => {
    const line = itemFor(b.items, a.id, a);
    return line ? lineId(b.id, line.category) : b.id;
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${b.id} · ${b.customer.name}`}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {itemsLabel(b.items)} · {fmtDate(b.date)} · {b.city} <StageBadge stages={bookingStages} id={b.status} />
        </span>
      }
      footer={
        <>
          <a href={whatsappTo(b.customer.phone, `Hi ${vars.customer}, `)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover">
            <WhatsAppIcon className="h-4 w-4" /> Customer
          </a>
          {artist && (
            <a href={whatsappTo(artist.phone, `Hi ${first(artist)}, about ${artistRef(artist)}: `)} target="_blank" rel="noopener noreferrer" className={waBtn}>
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
            ["Venue", [b.venue, b.city].filter(Boolean).join(", ")],
            ["Needs", b.items.map(itemText).join(", ")],
            ["Budget", b.budget],
            ["Notes", b.notes || "—"],
            ["Requested", fmtDate(b.createdAt, true)],
          ]}
        />
      </DrawerSection>

      {b.brief && (
        <DrawerSection title="Brief for the artists">
          <div className="space-y-3 text-sm">
            {b.items
              .filter((item) => briefRows(b.brief, item.category).length)
              .map((item) => (
                <div key={item.category} className="rounded-lg bg-wash/70 p-3">
                  <p className="font-medium text-ink">{categoryName(item.category)}</p>
                  <Details rows={briefRows(b.brief, item.category).map((r) => [r.label, r.value])} />
                </div>
              ))}
            {briefCommonRows(b.brief).length > 0 && <Details rows={briefCommonRows(b.brief).map((r) => [r.label, <span key={r.label} className="whitespace-pre-line">{r.value}</span>])} />}
          </div>
          <p className="mt-2 text-xs text-muted">Each artist&apos;s &ldquo;new request&rdquo; WhatsApp message includes their part of it.</p>
        </DrawerSection>
      )}

      <DrawerSection title={b.items.length > 1 ? `Who they need · ${b.items.length} categories` : "Who they need"}>
        <p className="mb-3 text-sm text-muted">
          {assignedArtists(b.items).length} of {need} assigned. Shortlist up to {shortlistMax} in all to offer the customer.
        </p>
        <div className="space-y-4">
          {b.items.map((item, i) => (
            <OrderLine key={`${item.category}-${i}`} b={b} i={i} db={db} editable={editable} shortlistMax={shortlistMax} send={send} />
          ))}
        </div>
        {editable && <AddLine b={b} />}
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
              // A rescheduled booking re-enters the flow here, like a matched one.
              moveTo(b, ["new", "matched", "rescheduled"].includes(b.status) ? "quoted" : b.status, (x) => {
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
                onClick={() => b.status === "quoted" && editable && moveTo(b, "payment_pending", undefined, `Asked the customer to pay for ${b.id}`)}
                className={waBtn}
              >
                <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Ask for payment
              </a>
              {b.status === "payment_pending" && (
                <a href={send("payment_reminder", "customer")} target="_blank" rel="noopener noreferrer" className={waBtn}>
                  <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Reminder
                </a>
              )}
            </div>
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
                {assigned.map((a) => (
                  <a key={a.id} href={send("artist_confirmed", a)} target="_blank" rel="noopener noreferrer" className={waBtn}>
                    <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> {assigned.length > 1 ? `Tell ${first(a)}` : "Tell the artist"}
                  </a>
                ))}
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
          {/* Customer messages once; artist messages once for each assigned artist. */}
          {templates
            .filter((t) => t.to !== "applicant")
            .flatMap((t): { t: (typeof templates)[number]; a?: Artist }[] => (t.to === "artist" ? assigned.map((a) => ({ t, a })) : [{ t }]))
            .map(({ t, a }) => (
              <a
                key={`${t.id}-${a?.id ?? "customer"}`}
                href={send(t.id, a ?? "customer")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-line px-2 py-1 text-xs text-ink hover:border-whatsapp hover:text-whatsapp"
              >
                {a && assigned.length > 1 ? `${t.name} · ${first(a)}` : t.name}
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

      {editable && (
        <DrawerSection title="Delete">
          <p className="text-xs text-muted">
            Removes this booking for good, with the payments and payouts recorded for it and the artists&apos; replies. The activity log keeps a line saying
            who deleted it. To keep a record of the booking, cancel it instead.
          </p>
          <ActionButton
            permission="bookings.edit"
            variant="danger"
            className="mt-2"
            onClick={() => {
              if (!window.confirm(`Delete ${b.id} (${b.customer.name || "no name"}, ${itemsLabel(b.items)}) for good? Its payments and payouts go too. This can't be undone.`)) return;
              update(
                "Bookings",
                `Deleted booking ${b.id} (${b.customer.name || "no name"}, ${itemsLabel(b.items)})`,
                (d) => {
                  d.bookings = d.bookings.filter((x) => x.id !== b.id);
                  d.payments = d.payments.filter((p) => p.bookingId !== b.id);
                  d.payouts = d.payouts.filter((p) => p.bookingId !== b.id);
                },
                b.id,
              );
              onClose();
            }}
          >
            Delete booking
          </ActionButton>
        </DrawerSection>
      )}
    </Drawer>
  );
}

// One line of an order ("Photographers × 2"): its service, how many, who's assigned, and the
// artists who could take it, working in its category (as their main one or another), active and
// free that day, same city first.
function OrderLine({
  b,
  i,
  db,
  editable,
  shortlistMax,
  send,
}: {
  b: Booking;
  i: number;
  db: Db;
  editable: boolean;
  shortlistMax: number;
  send: (id: TemplateId, to: Artist) => string;
}) {
  const item = b.items[i];
  const name = categoryName(item.category);
  const cat = categories.find((c) => c.slug === item.category);
  const services = [...new Set([item.service, ...(cat?.services.map((s) => s.name) ?? [])].filter(Boolean))];
  const assigned = item.artistIds.map((id) => db.artists.find((a) => a.id === id)).filter((a): a is Artist => a !== undefined);
  const full = item.artistIds.length >= item.count;
  const editLine = (text: string, fn: (line: BookingItem) => void) =>
    update("Bookings", text, (d) => fn(d.bookings.find((x) => x.id === b.id)!.items[i]), b.id);

  const candidates = db.artists
    .filter((a) => worksIn(a, item.category) && a.status === "active")
    .map((a) => {
      // A rescheduled booking sits on its new date, so it counts; only cancelled ones free the day.
      const clash = db.bookings.some((x) => x.id !== b.id && assignedArtists(x.items).includes(a.id) && x.date === b.date && x.status !== "cancelled");
      const elsewhere = b.items.find((o, j) => j !== i && o.artistIds.includes(a.id));
      const off = a.blockedDates.includes(b.date);
      const where = off
        ? "Day off"
        : clash
          ? "Booked that day"
          : elsewhere
            ? `On this order as ${categoryName(elsewhere.category).toLowerCase()}`
            : a.city === b.city
              ? "Free · same city"
              : `Free · ${a.city}`;
      return { a, free: !clash && !off && !elsewhere, why: a.category === item.category ? where : `${where} · mainly ${categoryName(a.category).toLowerCase()}` };
    })
    .sort((x, y) => Number(y.free) - Number(x.free) || Number(y.a.city === b.city) - Number(x.a.city === b.city));

  function assign(a: Artist) {
    // Needing one artist, Assign swaps them; needing more, it adds one until the line is full.
    const swap = item.count === 1 && full;
    moveTo(
      b,
      b.status === "new" || (b.status === "rescheduled" && assignedArtists(b.items).length === 0) ? "matched" : b.status,
      (x) => {
        const line = x.items[i];
        line.artistIds = swap ? [a.id] : [...line.artistIds.filter((id) => id !== a.id), a.id];
      },
      `Assigned ${a.name} to ${b.id} (${name})${swap ? ` instead of ${artistNames(db, item.artistIds)}` : ""}`,
    );
  }
  const unassign = (a: Artist) => editLine(`Removed ${a.name} from ${b.id} (${name})`, (line) => void (line.artistIds = line.artistIds.filter((id) => id !== a.id)));

  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-ink">
          {name}
          {/* Each line of an order for several categories has its own ID: the order's number with its category's code. */}
          {b.items.length > 1 && lineId(b.id, item.category) !== b.id && <span className="ml-2 text-xs font-normal text-muted">{lineId(b.id, item.category)}</span>}
        </p>
        <span className={`text-xs ${full ? "text-emerald-700" : "text-muted"}`}>
          {item.artistIds.length} of {item.count} assigned
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={item.service}
          disabled={!editable}
          onChange={(e) => editLine(`Changed ${b.id}'s ${name.toLowerCase()} service to ${e.target.value}`, (line) => void (line.service = e.target.value))}
          aria-label={`${name}: service`}
          className={`${fieldBase} w-auto min-w-0 flex-1 py-1`}
        >
          {services.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-ink">
          Needed
          <select
            value={item.count}
            disabled={!editable}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n < item.artistIds.length) {
                window.alert(`${item.artistIds.length} ${name.toLowerCase()} are assigned to ${b.id}. Remove ${item.artistIds.length - n} of them first.`);
                return;
              }
              editLine(`Changed ${b.id} to need ${n} ${name.toLowerCase()} (was ${item.count})`, (line) => void (line.count = n));
            }}
            className={`${fieldBase} w-auto py-1`}
          >
            {Array.from({ length: MAX_ARTISTS }, (_, k) => k + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        {editable && b.items.length > 1 && item.artistIds.length === 0 && (
          <button
            type="button"
            onClick={() => update("Bookings", `Removed ${name} from ${b.id}`, (d) => void d.bookings.find((x) => x.id === b.id)!.items.splice(i, 1), b.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
          </button>
        )}
      </div>

      {assigned.length > 0 && (
        <ul className="mt-3 space-y-2">
          {assigned.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-peach/40 p-3 text-sm">
              <span className="flex items-center gap-2.5">
                <ArtistPhoto name={a.name} photo={a.photo} className="h-8 w-8 text-xs" width={96} />
                <span>
                  Assigned: <strong className="font-medium">{a.name}</strong> · {a.city}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <a href={send("artist_request", a)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand underline underline-offset-2">
                  Ask availability
                </a>
                {editable && (
                  <button type="button" onClick={() => unassign(a)} className="text-xs font-medium text-muted underline underline-offset-2 hover:text-ink">
                    Remove
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
        {candidates.length === 0 && <li className="p-3 text-sm text-muted">No active {name.toLowerCase()} yet.</li>}
        {candidates.map(({ a, free, why }) => {
          const listed = b.shortlist.includes(a.id);
          const isAssigned = item.artistIds.includes(a.id);
          // The artist's answer from the portal, once shortlisted.
          const reply = b.replies?.find((r) => r.artistId === a.id);
          return (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <ArtistPhoto name={a.name} photo={a.photo} className="h-8 w-8 text-xs" width={96} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{a.name}</span>
                <span className={`block text-xs ${free || isAssigned ? "text-emerald-700" : "text-red-700"}`}>{why}</span>
                {reply && (
                  <span className={`mt-0.5 block text-xs font-medium ${reply.status === "quoted" ? "text-brand" : "text-muted"}`}>
                    {reply.status === "quoted" ? `Quoted ${inr(reply.quote)}` : "Declined"} in the portal · {ago(reply.at)}
                    {reply.note && <span className="block font-normal text-muted">&ldquo;{reply.note}&rdquo;</span>}
                  </span>
                )}
              </span>
              <a
                href={send("artist_request", a)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Ask ${a.name} on WhatsApp if they're free`}
                title="Ask on WhatsApp if they're free"
                className="rounded-md border border-line p-1 hover:border-whatsapp"
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-whatsapp" />
              </a>
              <button
                type="button"
                disabled={!editable || (!listed && b.shortlist.length >= shortlistMax)}
                onClick={() =>
                  update(
                    "Bookings",
                    `${listed ? "Removed" : "Shortlisted"} ${a.name} for ${b.id}`,
                    (d) => {
                      const x = d.bookings.find((y) => y.id === b.id)!;
                      x.shortlist = listed ? x.shortlist.filter((id) => id !== a.id) : [...x.shortlist, a.id];
                    },
                    b.id,
                  )
                }
                className={`rounded-md px-2 py-1 text-xs font-medium disabled:opacity-40 ${listed ? "bg-night text-white" : "border border-line text-ink"}`}
              >
                <Users className="mr-1 inline h-3 w-3" aria-hidden />
                {listed ? "Shortlisted" : "Shortlist"}
              </button>
              {isAssigned ? (
                <button
                  type="button"
                  disabled={!editable}
                  onClick={() => unassign(a)}
                  title="Remove from this booking"
                  className="rounded-md border border-brand px-2 py-1 text-xs font-medium text-brand disabled:opacity-40"
                >
                  Assigned ✓
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!editable || (full && item.count > 1)}
                  title={full && item.count > 1 ? `All ${item.count} are assigned. Remove one, or raise the number needed.` : undefined}
                  onClick={() => assign(a)}
                  className="rounded-md bg-brand px-2 py-1 text-xs font-medium text-white disabled:opacity-40"
                >
                  Assign
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Adds a category to an existing order (the customer asked for more on WhatsApp, say).
function AddLine({ b }: { b: Booking }) {
  const options = categories.filter((c) => !b.items.some((i) => i.category === c.slug));
  const [slug, setSlug] = useState(options[0]?.slug ?? "");
  if (!options.length) return null;
  const chosen = options.find((c) => c.slug === slug) ?? options[0];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select value={chosen.slug} onChange={(e) => setSlug(e.target.value)} aria-label="Category to add" className={`${fieldBase} w-auto py-1.5`}>
        {options.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>
      <ActionButton
        permission="bookings.edit"
        variant="secondary"
        onClick={() =>
          update(
            "Bookings",
            `Added ${chosen.name} to ${b.id}`,
            (d) => void d.bookings.find((x) => x.id === b.id)!.items.push({ category: chosen.slug, service: chosen.services[0].name, count: 1, artistIds: [] }),
            b.id,
          )
        }
      >
        <Plus className="h-4 w-4" aria-hidden /> Add to this order
      </ActionButton>
    </div>
  );
}

// One category a new booking needs: its service and how many artists.
type Line = { category: string; service: string; count: number };
const firstLine = (slug = categories[0].slug): Line => {
  const c = categories.find((x) => x.slug === slug) ?? categories[0];
  return { category: c.slug, service: c.services[0].name, count: 1 };
};

export function NewBooking({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  // A pasted WhatsApp message from the website's booking form fills the fields in
  // (src/lib/whatsapp-order.ts). Like a website request, it's one booking (one order) with a
  // line for each category and how many artists of it.
  const [pasted, setPasted] = useState("");
  const [lines, setLines] = useState<Line[]>([firstLine()]);
  const [fromMessage, setFromMessage] = useState<{ ref?: string; filled: string[] } | null>(null);
  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    audience: "Personal" as "Personal" | "Business",
    event: "",
    date: "",
    time: "",
    endTime: "",
    city: cities[0],
    venue: "",
    budget: "",
    notes: "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  // The same details the website asks for are required, including the start and end time;
  // venue and budget are optional (the website doesn't ask for them).
  const length = eventMinutes(f.time, f.endTime);
  const ok =
    f.name.trim().length >= 2 &&
    f.phone.replace(/\D/g, "").length >= 10 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) &&
    f.event.trim() &&
    f.date &&
    length !== null &&
    f.notes.trim();

  function fillFrom(text: string) {
    setPasted(text);
    const order = parseOrderMessage(text);
    const about = `${order.occasion ?? ""} ${order.details ?? ""}`;
    const found = order.needs.flatMap((n) => {
      const c = categories.find((x) => x.name.toLowerCase() === n.name.toLowerCase());
      return c ? [{ category: c.slug, service: pickService(c.services.map((s) => s.name), about), count: n.count }] : [];
    });
    const filled = [
      order.name && "name",
      order.phone && "phone",
      order.email && "email",
      order.audience && "type",
      found.length > 0 && "category",
      order.occasion && "event",
      order.date && "date",
      order.startTime && "time",
      order.city && cities.includes(order.city) && "city",
      order.details && "notes",
    ].filter((x): x is string => Boolean(x));
    setF((x) => ({
      ...x,
      name: order.name ?? x.name,
      phone: order.phone ?? x.phone,
      email: order.email ?? x.email,
      audience: order.audience ?? x.audience,
      event: order.occasion ?? x.event,
      date: order.date ?? x.date,
      time: order.startTime ?? x.time,
      endTime: order.endTime ?? x.endTime,
      city: order.city && cities.includes(order.city) ? order.city : x.city,
      notes: order.details ?? x.notes,
    }));
    if (found.length) setLines(found);
    setFromMessage(filled.length > 0 ? { ref: order.ref, filled } : null);
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title="New booking"
      subtitle="For requests that came by phone, WhatsApp or in person. Website requests arrive here by themselves; if one only reached WhatsApp, paste the message below."
      footer={
        <ActionButton
          permission="bookings.edit"
          disabled={!ok}
          onClick={() => {
            const id = newOrderId(lines.map((l) => l.category));
            const now = new Date().toISOString();
            const unsaved = fromMessage && (!fromMessage.ref || fromMessage.ref === "AOD-0");
            const note = fromMessage
              ? [{ at: now, by: currentUser(), text: `Added from a WhatsApp message${unsaved ? " (the website hadn't saved it)" : ` (website reference ${fromMessage.ref})`}.` }]
              : [];
            update(
              "Bookings",
              `Created booking ${id} for ${f.name.trim()} (${itemsLabel(lines)})${fromMessage ? " from a WhatsApp message" : ""}`,
              (db) =>
                void db.bookings.unshift({
                  id,
                  // The order ID is also the customer's reference, as for a website request.
                  requestRef: id,
                  createdAt: now,
                  audience: f.audience,
                  customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim().toLowerCase() },
                  items: lines.map((l) => ({ category: l.category, service: l.service, count: l.count, artistIds: [] })),
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
                  notesLog: note,
                }),
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
        <Labelled label="Paste a WhatsApp message (optional)" className="sm:col-span-2">
          <textarea
            value={pasted}
            onChange={(e) => fillFrom(e.target.value)}
            rows={4}
            placeholder={"Paste the message the customer sent from the website's booking form\n(\"Hi Artists on Demand! I'd like curated matches. …\"). The fields below fill in by themselves."}
            className={fieldClass}
          />
        </Labelled>
        {fromMessage && (
          <p className="-mt-2 rounded-lg bg-wash px-3 py-2 text-xs text-body sm:col-span-2" aria-live="polite">
            Filled in: {fromMessage.filled.join(", ")}.
            {!fromMessage.filled.includes("phone") && " Add the phone number from the WhatsApp chat."}
            {lines.length > 1 && ` It needs ${lines.map((l) => withCount(categoryName(l.category), l.count)).join(", ")}: one booking with a line for each.`}
            {(!fromMessage.ref || fromMessage.ref === "AOD-0") && " The website hadn't saved this request, so creating it here is the only copy."}
          </p>
        )}
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
        <div className="space-y-3 sm:col-span-2">
          <p className="text-sm font-medium text-ink">Who they need</p>
          {lines.map((l, i) => {
            const cat = categories.find((c) => c.slug === l.category) ?? categories[0];
            return (
              <div key={i} className="rounded-lg border border-line p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Labelled label="Category">
                    <select value={l.category} onChange={(e) => setLine(i, firstLine(e.target.value))} className={fieldClass}>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Labelled>
                  <Labelled label="Service">
                    <select value={l.service} onChange={(e) => setLine(i, { service: e.target.value })} className={fieldClass}>
                      {cat.services.map((s) => (
                        <option key={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </Labelled>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-2 text-sm text-ink">
                    How many
                    <CountPicker size="sm" value={l.count} onChange={(count) => setLine(i, { count })} label={cat.name.toLowerCase()} />
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                      className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setLines((ls) => [...ls, firstLine(categories.find((c) => !ls.some((l) => l.category === c.slug))?.slug)])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add another category
          </button>
        </div>
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
        <Labelled label="Venue / area (optional)" className="sm:col-span-2">
          <input value={f.venue} onChange={set("venue")} className={fieldClass} />
        </Labelled>
        <Labelled label="Budget (optional)">
          <input value={f.budget} onChange={set("budget")} placeholder="₹20,000–30,000" className={fieldClass} />
        </Labelled>
        <Labelled label="Notes" className="sm:col-span-2">
          <textarea value={f.notes} onChange={set("notes")} rows={3} className={fieldClass} />
        </Labelled>
      </div>
    </Drawer>
  );
}
