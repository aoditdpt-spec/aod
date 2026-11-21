"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cities } from "@/data/site";
import { business, businessLive, blankCompany, companyTypes, useCompany, type Company } from "@/lib/business";
import { CustomerData, CustomerReloader, parseDay, shortDate, useDb, type Booking, type Db } from "@/lib/app-db";
import { endAfter, time12, timeRange } from "@/lib/event-time";
import { backendEnabled } from "@/lib/backend";
import { requestCode, verifyCode } from "@/server/actions/auth";
import { BookForm, type PresetEvent } from "@/components/book/BookForm";
import { DurationField, TimeField } from "@/components/ui/TimePicker";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { MonthGrid, MonthSwitch } from "@/components/dash/MonthGrid";
import { ArtistCards, Payments, Timeline, bookAgain } from "@/components/bookings/OrderParts";

// aod.co.in/business, as on the main site: signed out, the page's introduction (rendered on the
// server) and a Sign In / Create Account card; a signed-in company sees its portal instead:
// Calendar, Book Artists (the booking questions as a business), Orders and Company. Live: the
// account is a row in `companies` (an emailed code confirms the email first) and the orders are
// the bookings made with its email (src/lib/app-db.tsx, CustomerData). Test mode: no email is
// sent, any code works, and the account and orders stay in this browser.

const input = "h-12 w-full rounded-lg border border-line bg-paper px-4 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";
const fieldLabel = "mb-2 block text-sm text-muted";

// Signed out: the heading, then Sign In / Create Account, then the three points under it.
export function BusinessPortal({ header, after }: { header: ReactNode; after: ReactNode }) {
  const company = useCompany();
  if (company === "unknown")
    return (
      <>
        {header}
        {after}
      </>
    );
  if (!company)
    return (
      <>
        {header}
        <Container className="pb-20 lg:pb-28">
          <BusinessAuth />
        </Container>
        {after}
      </>
    );
  return (
    <Container className="pb-20 pt-8 sm:pt-10 lg:pt-14">
      <CustomerData>
        {backendEnabled && <CustomerReloader />}
        <BusinessApp company={company} />
      </CustomerData>
    </Container>
  );
}

function BusinessAuth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [step, setStep] = useState<"details" | "code">("details");
  const [f, setF] = useState<Company>(blankCompany);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Company) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <section className="max-w-xl border-t border-ink pt-10">
      <div role="tablist" aria-label="Sign in or create an account" className="flex gap-6 text-lg">
        {(
          [
            ["in", "Sign In"],
            ["up", "Create Account"],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setStep("details");
            }}
            className={`border-b-2 pb-1 transition-colors ${mode === id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {text}
          </button>
        ))}
      </div>

      {step === "details" ? (
        <form
          className="mt-10 space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setError(null);
            if (backendEnabled) {
              setBusy(true);
              const res = await requestCode(f.email, mode === "up" ? "business-new" : "business").catch(() => ({ ok: false as const, error: "Couldn't send the code just now. Please try again in a minute." }));
              setBusy(false);
              if (!res.ok) return setError(res.error);
            }
            setStep("code");
          }}
        >
          {mode === "up" && (
            <>
              <label className="block">
                <span className={fieldLabel}>Company Name</span>
                <input value={f.name} onChange={set("name")} autoComplete="organization" className={input} />
              </label>
              <div>
                <span className={fieldLabel}>We Are A</span>
                <div className="flex flex-wrap gap-2">
                  {companyTypes.map((t) => (
                    <button key={t} type="button" aria-pressed={f.type === t} onClick={() => setF({ ...f, type: t })} className={`h-11 rounded-lg border px-4 text-[15px] transition-colors ${f.type === t ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {f.type === "Other" && <input value={f.typeOther} onChange={set("typeOther")} placeholder="Please Specify" aria-label="What kind of company you are" className={`${input} mt-3`} />}
              </div>
              <label className="block">
                <span className={fieldLabel}>Contact Person</span>
                <input value={f.contactName} onChange={set("contactName")} autoComplete="name" className={input} />
              </label>
            </>
          )}
          <label className="block">
            <span className={fieldLabel}>Company Email</span>
            <input value={f.email} onChange={set("email")} type="email" autoComplete="email" className={input} />
          </label>
          {mode === "up" && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Phone</span>
                  <input value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" className={input} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>City</span>
                  <select value={f.city} onChange={set("city")} className={input}>
                    <option value="">Choose</option>
                    {cities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className={fieldLabel}>Website, LinkedIn Or Linktree</span>
                <input value={f.website} onChange={set("website")} inputMode="url" placeholder="yourcompany.in" className={input} />
              </label>
            </>
          )}
          <button disabled={busy} className={`${primaryButton} w-full disabled:opacity-50`}>
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form
          className="mt-10 space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!backendEnabled) {
              if (mode === "up") business.create({ ...f, email: f.email.trim().toLowerCase() });
              else business.signIn(f.email);
              return;
            }
            if (busy) return;
            setBusy(true);
            setError(null);
            const res = await verifyCode(f.email, code).catch(() => ({ ok: false as const, error: "Couldn't check the code just now. Please try again." }));
            if (!res.ok) {
              setBusy(false);
              return setError(res.error);
            }
            const err = mode === "up" ? await businessLive.create({ ...f, email: f.email.trim().toLowerCase() }) : (await businessLive.reload(), null);
            setBusy(false);
            if (err) setError(err);
          }}
        >
          <label className="block">
            <span className={fieldLabel}>Enter The OTP</span>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className={`${input} max-w-48 tracking-[0.3em]`} />
          </label>
          {backendEnabled ? (
            <p className="text-sm text-muted">
              We&apos;ve sent a 6-digit code to <span className="text-ink">{f.email}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 max-sm:*:flex-1">
            <button type="button" onClick={() => setStep("details")} className={secondaryButton}>
              Back
            </button>
            <button disabled={busy || (backendEnabled && code.length !== 6)} className={`${primaryButton} disabled:opacity-50`}>
              {busy ? "Checking…" : mode === "up" ? "Create Account" : "Sign In"}
            </button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}

type Tab = "calendar" | "book" | "orders" | "company";
const tabs: { id: Tab; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "book", label: "Book Artists" },
  { id: "orders", label: "Orders" },
  { id: "company", label: "Company" },
];

// The calendar's three stages (and Cancelled, shown quietly), and an order's four-step track,
// both worked out from the admin's one pipeline, as on aod.co.in.
type BizStage = "inquired" | "assigned" | "done" | "cancelled";
const stageOf = (b: Booking): BizStage => (b.stage === "cancelled" ? "cancelled" : b.stage === "completed" ? "done" : b.stage !== "new" || b.assigned.length ? "assigned" : "inquired");
const stageText: Record<BizStage, string> = { inquired: "Inquired", assigned: "Artist Assigned", done: "Done", cancelled: "Cancelled" };
const stageDot: Record<BizStage, string> = { inquired: "bg-brand", assigned: "bg-ink", done: "bg-ink/30", cancelled: "bg-ink/15" };
const track = ["Inquiry", "Accepted", "Fulfilled", "Payment Received"];
function trackDone(b: Booking, db: Db) {
  if (b.stage === "cancelled") return 0;
  const paid = db.payments.filter((p) => p.booking === b.id && p.verified).reduce((n, p) => n + p.amount, 0);
  const fulfilled = b.stage === "completed";
  return fulfilled && b.quote && paid >= b.quote ? 4 : fulfilled ? 3 : b.stage === "advance" || b.stage === "confirmed" ? 2 : 1;
}

// The company's orders: its business requests from this browser (by its email), then labelled
// samples. The admin's changes to them show here too (src/lib/mock-db.ts).
function ordersOf(db: Db, c: Company) {
  // Live: the server returns this company's own orders (made with its email).
  if (backendEnabled) return db.bookings.map((b) => ({ b, sample: false }));
  const mine = db.bookings.filter((b) => b.source === "Test Booking" && b.id.includes("-B2B-") && (!c.email || !b.email || b.email.toLowerCase() === c.email.toLowerCase()));
  const samples = db.bookings.filter((b) => b.source === "Business");
  return [...mine.map((b) => ({ b, sample: false })), ...samples.map((b) => ({ b, sample: true }))];
}

function BusinessApp({ company }: { company: Company }) {
  const db = useDb();
  const [tab, setTab] = useState<Tab>("calendar");
  const [open, setOpen] = useState<string | null>(null); // an order in the popup
  const [adding, setAdding] = useState<string | null>(null); // a day in the "add event" popup
  // What the calendar's "add event" popup filled in, for the booking questions.
  const [book, setBook] = useState<{ date?: string; event?: PresetEvent }>({});
  const orders = db ? ordersOf(db, company) : [];
  const openOrder = open ? orders.find((o) => o.b.id === open) : undefined;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm text-muted">AOD For Business</p>
          <h1 className="mt-3 text-4xl sm:text-6xl">
            <Dots>{`${company.name || "Your Company"}.`}</Dots>
          </h1>
        </div>
        <button type="button" onClick={() => (backendEnabled ? void businessLive.signOut() : business.signOut())} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          Sign Out
        </button>
      </div>

      {/* The tabs: a thin line under them (an inset shadow, so the row has no scrollbar or
          arrows); on a narrow phone it slides sideways with no scrollbar showing. */}
      <div role="tablist" aria-label="Business portal" className="mt-10 flex gap-5 overflow-x-auto overflow-y-hidden text-base shadow-[inset_0_-1px_0_var(--color-line)] [scrollbar-width:none] sm:mt-12 sm:gap-6 sm:text-lg [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setOpen(null);
              setBook({});
            }}
            className={`shrink-0 border-b-2 pb-3 transition-colors ${tab === t.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-12">
        {!db ? (
          <p className="text-muted">Loading…</p>
        ) : tab === "book" ? (
          <BookForm
            key={JSON.stringify(book)}
            forceAudience="business"
            presetDate={book.date}
            presetEvent={book.event}
            contact={{ name: company.contactName, phone: company.phone, email: company.email }}
            onOrders={() => {
              setBook({});
              setTab("orders");
            }}
          />
        ) : tab === "company" ? (
          <CompanyDetails key={company.email} company={company} />
        ) : tab === "calendar" ? (
          <CompanyCalendar db={db} orders={orders} onOpen={setOpen} onAdd={setAdding} />
        ) : (
          <OrderList orders={orders} onOpen={setOpen} />
        )}
      </div>

      {/* An order, Google Calendar style: everything about it in a popup over the page. */}
      <Popup open={!!(db && openOrder)} onClose={() => setOpen(null)} label={openOrder?.b.needs ?? "Order"} scroll>
        {db && openOrder && (
          <OrderPopup
            db={db}
            order={openOrder}
            onBookAgain={() => {
              bookAgain(openOrder.b);
              setOpen(null);
              setBook({});
              setTab("book");
            }}
          />
        )}
      </Popup>

      {/* A day from tomorrow on: a new event, as Google Calendar's quick add. */}
      <Popup open={!!adding} onClose={() => setAdding(null)} label="New event">
        {adding && (
          <AddEvent
            day={adding}
            onBook={(event) => {
              setBook({ date: adding, event });
              setAdding(null);
              setTab("book");
            }}
          />
        )}
      </Popup>
    </>
  );
}

type Order = { b: Booking; sample: boolean };

// The calendar, Google Calendar style: a month of days, each order on its day (phones: a small
// month with dots under the day numbers, and the picked day's orders under it; from 640px a full
// grid with each order by name). Days before today are greyed out and struck through, and can't be
// picked for a new event, but their orders show as on any other day and open their popup. An order opens in a popup (OrderPopup); a day
// from tomorrow on opens "add event" (AddEvent), whose Book Artists button carries the event's
// name, date, time and length into the booking questions (on request, 2026-11-21).
function CompanyCalendar({ db, orders, onOpen, onAdd }: { db: Db; orders: Order[]; onOpen: (id: string) => void; onAdd: (day: string) => void }) {
  const [month, setMonth] = useState(() => new Date(db.today.getFullYear(), db.today.getMonth(), 1));
  const [picked, setPicked] = useState(db.todayKey);
  const on = (k: string) => orders.filter((o) => o.b.date === k);
  const past = (k: string) => k < db.todayKey;
  const canBook = (k: string) => k > db.todayKey;
  const dayOrders = on(picked);
  const pickedDate = new Date(`${picked}T00:00:00`);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          {(["inquired", "assigned", "done"] as BizStage[]).map((s) => (
            <span key={s} className="flex items-center gap-2">
              <i className={`h-2 w-2 rounded-full ${stageDot[s]}`} />
              {stageText[s]}
            </span>
          ))}
        </div>
        <MonthSwitch month={month} onChange={setMonth} />
      </div>

      {/* Phones: the small month, dots under the days with orders; a day's orders show under it. */}
      <div className="mt-6 sm:hidden">
        <MonthGrid
          month={month}
          compact
          cell={(k, d) => {
            const list = on(k);
            const isPicked = k === picked;
            const off = past(k) && !list.length;
            return (
              <button
                type="button"
                disabled={off}
                onClick={() => setPicked(k)}
                aria-pressed={isPicked}
                aria-label={`${shortDate(k)}, ${list.length} order${list.length === 1 ? "" : "s"}`}
                className="relative flex h-12 w-full flex-col items-center justify-start pt-1 disabled:cursor-default"
              >
                {past(k) && <i aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-0.75px),var(--color-line)_50%,transparent_calc(50%+0.75px))]" />}
                <span className={`relative grid h-8 w-8 place-items-center rounded-full text-[15px] tabular-nums transition-colors ${isPicked ? "bg-ink text-paper" : k === db.todayKey ? "bg-brand text-white" : past(k) ? "text-muted/50" : "text-ink"}`}>{d}</span>
                <span className="mt-0.5 flex h-1.5 gap-0.5">
                  {list.slice(0, 3).map((o) => (
                    <i key={o.b.id} className={`h-1.5 w-1.5 rounded-full ${stageDot[stageOf(o.b)]}`} />
                  ))}
                </span>
              </button>
            );
          }}
        />
        <section aria-live="polite" className="mt-6 border-t border-ink pt-5">
          <h3 className="text-xl">{pickedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h3>
          {dayOrders.length > 0 ? (
            <ul className="mt-3">
              {dayOrders.map((o) => (
                <li key={o.b.id} className="border-b border-line">
                  <button type="button" onClick={() => onOpen(o.b.id)} className="flex w-full items-center gap-3 py-3.5 text-left">
                    <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${stageDot[stageOf(o.b)]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{o.b.occasion || o.b.needs}</span>
                      <span className="block truncate text-sm text-muted">
                        {o.b.start ? `${timeRange(o.b.start, o.b.end)} · ` : ""}
                        {stageText[stageOf(o.b)]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-muted">No orders on this day.</p>
          )}
          {canBook(picked) && (
            <button type="button" onClick={() => onAdd(picked)} className={`${primaryButton} mt-5 w-full`}>
              Add An Event On {shortDate(picked)}
            </button>
          )}
        </section>
      </div>

      {/* From 640px: the full month. A past day is greyed out; a day from tomorrow on opens "add
          event" when its empty space is clicked; an order opens its popup. */}
      <div className="mt-6 hidden sm:block">
        <MonthGrid
          month={month}
          cell={(k, d) => {
            const isPast = past(k);
            const bookable = canBook(k);
            return (
              <div
                onClick={bookable ? () => onAdd(k) : undefined}
                className={`relative -m-1.5 min-h-24 p-1.5 transition-colors ${isPast ? "bg-wash" : bookable ? "cursor-pointer hover:bg-wash/60" : ""}`}
                title={bookable ? `Add an event on ${shortDate(k)}` : undefined}
              >
                {/* A past day is struck through with a line corner to corner across the whole day,
                    not through its number (on request, 2026-11-21). Its orders sit above the line
                    and still open. */}
                {isPast && <i aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top_right,transparent_calc(50%-0.75px),var(--color-line)_50%,transparent_calc(50%+0.75px))]" />}
                <span className={`relative grid h-7 w-7 place-items-center rounded-full text-xs tabular-nums ${k === db.todayKey ? "bg-brand font-medium text-white" : isPast ? "text-muted/50" : "text-ink"}`}>{d}</span>
                <div className="relative mt-1 space-y-1">
                  {on(k).map((o) => (
                    <button
                      key={o.b.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(o.b.id);
                      }}
                      className="flex w-full items-center gap-1.5 truncate rounded bg-paper px-1.5 py-1 text-left text-xs shadow-[0_0_0_1px_var(--color-line)] transition-shadow hover:shadow-[0_0_0_1px_var(--color-ink)]"
                    >
                      <i className={`h-1.5 w-1.5 shrink-0 rounded-full ${stageDot[stageOf(o.b)]}`} />
                      <span className="truncate">
                        {o.b.start && <span className="text-muted">{time12(o.b.start).replace(":00", "")} </span>}
                        {o.b.occasion || o.b.needs}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          }}
        />
      </div>
    </>
  );
}

// A popup over the page, as Google Calendar's: a card in the middle (a sheet from the bottom on
// phones) with a close button at its top right; a click outside it or Escape closes it.
// `scroll`: the card scrolls inside itself (a long order); without it, nothing clips the scroll
// wheels that open from the "add event" fields.
function Popup({ open, onClose, label, scroll = false, children }: { open: boolean; onClose: () => void; label: string; scroll?: boolean; children: ReactNode }) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, [open]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="popup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 sm:items-center sm:p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ y: 12, opacity: 0, transition: { duration: 0.15 } }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full rounded-t-2xl bg-paper shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] sm:max-w-[480px] sm:rounded-2xl ${scroll ? "max-h-[88dvh] overflow-y-auto overscroll-contain" : ""}`}
          >
            <div className="sticky top-0 z-10 flex justify-end bg-paper/95 px-3 pt-3 backdrop-blur">
              <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-wash hover:text-ink">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="h-5 w-5">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// A small line with an icon in front, as in Google Calendar's event popup.
function InfoRow({ icon, children }: { icon: "clock" | "pin" | "note" | "tag"; children: ReactNode }) {
  const paths = {
    clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
    pin: "M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    note: "M5 4h14v16H5zM8 9h8M8 13h8M8 17h5",
    tag: "M4 4h7l9 9-7 7-9-9V4zM8.5 8.5h.01",
  };
  return (
    <div className="flex gap-4 py-2">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted">
        <path d={paths[icon]} />
      </svg>
      <div className="min-w-0 flex-1 whitespace-pre-line break-words">{children}</div>
    </div>
  );
}

// An order in the popup: its name and stage, when and where, its progress, the artists, payments,
// files and the timeline, then Book Again. Everything is here, so there's no separate page.
function OrderPopup({ db, order: { b, sample }, onBookAgain }: { db: Db; order: Order; onBookAgain: () => void }) {
  const done = trackDone(b, db);
  const stage = stageOf(b);
  return (
    <>
      <div className="flex gap-4">
        <i className={`mt-2.5 h-3.5 w-3.5 shrink-0 rounded ${stageDot[stage]}`} />
        <div className="min-w-0">
          <h2 className="text-2xl leading-tight">{b.occasion || b.needs}</h2>
          <p className="mt-1 text-muted">
            {parseDay(b.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            {b.start && ` · ${timeRange(b.start, b.end)}`}
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-line pt-3">
        <InfoRow icon="tag">
          {b.needs}
          <span className="block text-sm text-muted">
            {b.id} · {stageText[stage]}
            {sample && " · Sample"}
          </span>
        </InfoRow>
        <InfoRow icon="pin">{b.venue || b.city || "—"}</InfoRow>
        {(b.notes || b.brief) && <InfoRow icon="note">{[b.notes, b.brief].filter(Boolean).join("\n\n")}</InfoRow>}
      </div>

      <ol className="mt-5 grid grid-cols-4 gap-2">
        {track.map((t, i) => (
          <li key={t}>
            <i className={`block h-1 rounded-full ${i < done ? "bg-ink" : "bg-line"}`} />
            <span className={`mt-2 block text-xs ${i < done ? "text-ink" : "text-muted"}`}>{t}</span>
          </li>
        ))}
      </ol>

      <h3 className="mb-3 mt-8 text-lg">Shortlisted For You</h3>
      <ArtistCards db={db} b={b} />
      <h3 className="mb-3 mt-8 text-lg">Payments</h3>
      <Payments db={db} b={b} />
      {b.delivery && (
        <>
          <h3 className="mb-2 mt-8 text-lg">Your Files</h3>
          <a href={b.delivery} target="_blank" rel="noopener noreferrer" className="break-all font-medium underline underline-offset-4">
            {b.delivery}
          </a>
        </>
      )}
      <h3 className="mb-3 mt-8 text-lg">Timeline</h3>
      <Timeline b={b} />
      <div className="mt-8">
        <button type="button" onClick={onBookAgain} className={`${primaryButton} w-full`}>
          Book Again
        </button>
      </div>
    </>
  );
}

// A new event on a day, as Google Calendar's quick add: its name, the date, the start time and
// how long it runs; Book Artists opens the booking questions with those filled in, and asks the
// rest (who, where, the brief, the contact details).
function AddEvent({ day, onBook }: { day: string; onBook: (event: PresetEvent) => void }) {
  const [occasion, setOccasion] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(0);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onBook({ occasion: occasion.trim(), time, hours });
      }}
    >
      <input
        value={occasion}
        onChange={(e) => setOccasion(e.target.value)}
        placeholder="Add Event Name"
        aria-label="Event name"
        autoFocus
        className="w-full border-b-2 border-line bg-transparent pb-2 text-2xl outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
      />
      <div className="mt-5">
        <InfoRow icon="clock">{parseDay(day).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</InfoRow>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <TimeField label="Start Time" value={time} onChange={setTime} />
        <DurationField label="How Many Hours?" value={hours} onChange={setHours} align="right" />
      </div>
      {time && hours > 0 && <p className="mt-3 text-sm text-muted">{timeRange(time, endAfter(time, hours))}</p>}
      <div className="mt-8 flex justify-end">
        <button type="submit" className={primaryButton}>
          Book Artists
        </button>
      </div>
    </form>
  );
}

function OrderList({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  if (!orders.length) return <p className="text-lg text-muted">No orders yet.</p>;
  return (
    <ul className="border-t border-ink">
      {orders.map(({ b, sample }) => (
        <li key={b.id} className="border-b border-line">
          <button type="button" onClick={() => onOpen(b.id)} className="grid w-full gap-1 py-6 text-left transition-colors hover:bg-wash sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8">
            <span>
              <span className="block text-2xl font-medium tracking-tight">{b.needs}</span>
              <span className="mt-1 block text-muted">
                {shortDate(b.date)} · {b.city} · {b.id}
                {sample && " · Sample"}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <i className={`h-2 w-2 rounded-full ${stageDot[stageOf(b)]}`} />
              {stageText[stageOf(b)]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function CompanyDetails({ company }: { company: Company }) {
  const [f, setF] = useState(company);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof Company) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setF({ ...f, [k]: e.target.value });
    setSaved(false);
  };
  return (
    <form
      className="max-w-xl space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (!backendEnabled) {
          business.update(f);
          return setSaved(true);
        }
        const err = await businessLive.update(f);
        if (err) setError(err);
        else setSaved(true);
      }}
    >
      <label className="block">
        <span className={fieldLabel}>Company Name</span>
        <input value={f.name} onChange={set("name")} className={input} />
      </label>
      <label className="block">
        <span className={fieldLabel}>Company Email</span>
        <input value={f.email} readOnly className={`${input} bg-wash text-muted`} />
      </label>
      <label className="block">
        <span className={fieldLabel}>Contact Person</span>
        <input value={f.contactName} onChange={set("contactName")} className={input} />
      </label>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className={fieldLabel}>Phone</span>
          <input value={f.phone} onChange={set("phone")} inputMode="tel" className={input} />
        </label>
        <label className="block">
          <span className={fieldLabel}>City</span>
          <select value={f.city} onChange={set("city")} className={input}>
            <option value="">Choose</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={fieldLabel}>Website, LinkedIn Or Linktree</span>
        <input value={f.website} onChange={set("website")} inputMode="url" className={input} />
      </label>
      <div className="flex items-center gap-4">
        <button className={primaryButton}>Save Changes</button>
        {saved && <span className="text-sm text-muted">Saved.</span>}
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
