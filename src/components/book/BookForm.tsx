"use client";

import Image from "next/image";
import Link from "@/components/ui/AppLink";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { audiencePrompt as ap, bookPage as p } from "@/data/pages";
import { categoryIcons } from "@/data/home";
import { categories } from "@/data/site";
import { setAudience, useAudience, type Audience } from "@/lib/audience";
import { backendEnabled } from "@/lib/backend";
import { endAfter, timeRange } from "@/lib/event-time";
import { orderId } from "@/lib/order-id";
import { takeRebook } from "@/lib/rebook";
import { requestCode, signedInEmail, verifyCode } from "@/server/actions/auth";
import { createBookingRequest, type SaveResult } from "@/server/actions/public";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { Dots } from "@/components/ui/Dots";
import { DatePickerDialog } from "@/components/ui/DatePicker";
import { DurationField, TimeField } from "@/components/ui/TimePicker";
import { withCount } from "@/components/ui/CountPicker";
import { VenueField, blankVenue, type Venue } from "@/components/ui/VenueField";

// The booking request, one question at a time, sliding from one to the next (on request,
// 2026-11-21). Taps move on by themselves; only the two questions with typing have a button.
//   01 Who Are You Looking For?   tap a category
//   02 Which Kind Of Artist?      tap a kind, then How Many? (1, 2, 3 or More, a box up to 20);
//                                 a category with one kind asks How Many? alone. The number adds
//                                 the artists to the order (the cart).
//   03 Need Anyone Else?          the cart so far; Add Another Artist (back to 01) or No, That's
//                                 Everyone. So an order can hold several kinds of artist, each
//                                 picked with single taps.
//   04 When Is The Event?         the next 15 days from tomorrow as tiles, then Other Date, which
//                                 opens the calendar popup (DatePicker.tsx)
//   05 What Time?                 Start Time and How Many Hours?, fields that open scroll wheels;
//                                 once both are set it moves on
//   06 Where Is The Event?        the event's name (optional), the venue, and the brief for an artist
//                                 (optional) under it; Continue
//   07 Your Details               name, phone and email; Send OTP, then Confirm Request
//      Confirm saves it straight away (no review page) and says "Request Received." with the ref.
// The answers so far show as chips that jump back, and a cart button (the number of kinds of artist
// picked) opens 03. Back, Next (after going back) and Clear All sit by the progress.
// Business events are booked from the company's account (/business): there the portal's Book
// Artists tab shows these questions with `forceAudience="business"` and the company's contact
// details filled in; anywhere else a visitor who chose Business Events goes to /business (on a
// category page, a line points there instead). Mock mode (backendEnabled off): no email goes out,
// nothing is required, any code or none passes, and the request is kept in this browser.

export const MOCK_ORDERS_EVENT = "aod-mock-orders";

const noop = () => () => {};
// "?for=photo-video" picks that category to start with.
function usePreset() {
  return useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).get("for") ?? "",
    () => "",
  );
}

// The earliest date to offer (tomorrow), worked out in the browser only.
const tomorrow = () => {
  const d = new Date(Date.now() + 864e5);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
function useTomorrow() {
  return useSyncExternalStore(noop, tomorrow, () => "");
}

// Mock mode's "database": requests kept in this browser (localStorage). Returns the order's number.
function saveMock(order: Record<string, unknown>) {
  try {
    const list = JSON.parse(localStorage.getItem("aod-mock-orders") ?? "[]") as unknown[];
    list.push({ ...order, at: new Date().toISOString() });
    localStorage.setItem("aod-mock-orders", JSON.stringify(list));
    // Tells this tab's other readers (the admin's data, the business portal's orders).
    window.dispatchEvent(new Event(MOCK_ORDERS_EVENT));
    return list.length;
  } catch {
    return 1;
  }
}

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const input = "mt-2 h-12 w-full rounded-lg border border-line bg-paper px-4 text-base text-ink outline-none transition-colors focus:border-ink";
const tile = (on: boolean) => `rounded-xl border font-medium leading-tight transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink"}`;
const textButton = "text-sm font-medium text-ink underline underline-offset-4 hover:text-brand disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40";
const blank = { date: "", time: "", hours: 0, occasion: "", venue: blankVenue as Venue, details: "", name: "", phone: "", email: "" };
// The questions, in order (their titles are p.steps).
const S = { who: 0, kind: 1, more: 2, date: 3, time: 4, where: 5, you: 6 } as const;
const LAST = S.you;
const COUNTS = [1, 2, 3]; // then More, a box for 4 to 20
const DAYS = 15; // day tiles from tomorrow; "Other Date" opens the calendar for any other day

// A YYYY-MM-DD day as the tiles show it.
function dayParts(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    value,
    weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
    day: String(d),
    month: date.toLocaleDateString("en-IN", { month: "short" }),
    long: date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
  };
}
function nextDays(from: string, n: number) {
  if (!from) return [];
  const [y, m, d] = from.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const t = new Date(y, m - 1, d + i);
    return dayParts(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`);
  });
}

type Contact = { name: string; phone: string; email: string };
// One kind of artist in the order: the category, the kind ("Photographers") and how many.
type Line = { category: string; kind: string; count: number };

// The booking in progress, shared by /book (Get Your Artist) and the category pages, kept for this
// tab (sessionStorage). Get Your Artist carries on from it; a category page carries on only if
// that category is already in it, otherwise it starts over with that category (keeping the name,
// phone and email). Sending the request clears it. The business portal keeps its own.
type Draft = { lines: Line[]; cat: string | null; kind: string | null; step: number; reached: number; form: typeof blank };
const DRAFT_KEY = "aod-book-draft";
function readDraft(): Draft | null {
  try {
    const v = sessionStorage.getItem(DRAFT_KEY);
    const d = v ? (JSON.parse(v) as Partial<Draft>) : null;
    return d && Array.isArray(d.lines) && d.form ? (d as Draft) : null; // an older draft (one artist, no cart) starts over
  } catch {
    return null;
  }
}
function writeDraft(d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage blocked: the answers stay on this page only.
  }
}

// What the business calendar's "add event" popup already asked: its event name, start time and
// length (the date comes as `presetDate`). Those questions are then skipped.
export type PresetEvent = { occasion?: string; time?: string; hours?: number };

// `onOrders`: the business portal's Orders tab, which the confirmation's second button opens
// instead of My Bookings (a company's orders live there, on request 2026-11-21).
export function BookForm({ forceAudience, contact, presetCategory, presetDate, presetEvent, onOrders }: { forceAudience?: Audience; contact?: Contact; presetCategory?: string; presetDate?: string; presetEvent?: PresetEvent; onOrders?: () => void }) {
  const chosenAudience = useAudience();
  const router = useRouter();
  const toBusiness = !forceAudience && chosenAudience === "business";
  const redirect = toBusiness && !presetCategory;
  useEffect(() => {
    if (redirect) router.replace("/business");
  }, [redirect, router]);
  if (redirect) return <p className="text-muted">Opening AOD For Business…</p>;
  if (toBusiness)
    return (
      <p className="text-lg text-muted">
        Business events are booked from your company account.{" "}
        <Link href="/business" className="font-medium text-ink underline underline-offset-4">
          Open AOD For Business
        </Link>
      </p>
    );
  return <Questions audience={forceAudience ?? chosenAudience} forced={!!forceAudience} contact={contact} presetCategory={presetCategory} presetDate={presetDate} presetEvent={presetEvent} onOrders={onOrders} />;
}

// `presetDate` ("YYYY-MM-DD"): the event date already filled in (a day picked on the business calendar).
function Questions({ audience, forced, contact, presetCategory, presetDate, presetEvent, onOrders }: { audience: Audience | null | "unknown"; forced: boolean; contact?: Contact; presetCategory?: string; presetDate?: string; presetEvent?: PresetEvent; onOrders?: () => void }) {
  const queryPreset = usePreset();
  const preset = categories.some((c) => c.slug === (presetCategory ?? queryPreset)) ? (presetCategory ?? queryPreset) : "";
  const minDate = useTomorrow();
  const [lines, setLines] = useState<Line[]>([]);
  // The artist being picked now (questions 01 and 02), before it joins the cart.
  const [picked, setPicked] = useState<string | null | undefined>(undefined); // undefined: the preset
  const cat = picked === undefined ? preset || null : picked;
  const category = categories.find((c) => c.slug === cat);
  const single = category ? category.types.length <= 1 : false;
  const [kindState, setKind] = useState<string | null>(null);
  const kind = single ? (category?.types[0] ?? category?.name ?? null) : kindState;
  const [stepState, setStep] = useState<number | null>(null);
  const step = stepState ?? (preset ? S.kind : S.who); // a preset category opens at its next question
  const [dir, setDir] = useState(1);
  const [reached, setReached] = useState(0); // the furthest question reached, for Next after Back
  const [more, setMore] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [calendar, setCalendar] = useState(false);
  const [form, setForm] = useState(() => ({ ...blank, date: presetDate ?? "", occasion: presetEvent?.occasion ?? "", time: presetEvent?.time ?? "", hours: presetEvent?.hours ?? 0, ...contact }));
  const [missing, setMissing] = useState<string[]>([]);
  const [view, setView] = useState<"form" | "done">("form");
  const [ref, setRef] = useState("");
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "code" | "verify" | "save">(null);
  const [website, setWebsite] = useState(""); // the hidden spam-trap field
  const top = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const codeBox = useRef<HTMLInputElement>(null);
  const moved = useRef(false);

  const email = form.email.trim().toLowerCase();
  const confirmed = verified === email;
  const codeSent = !confirmed && codeFor === email;
  const endTime = endAfter(form.time, form.hours);
  const days = nextDays(minDate, DAYS);
  const pickedDay = form.date ? dayParts(form.date) : null;
  const otherDate = Boolean(form.date) && !days.some((d) => d.value === form.date);
  const kindName = kind ?? category?.name ?? "";
  const lineCount = (k: string) => lines.find((l) => l.category === cat && l.kind === k)?.count ?? null;
  const needsText = lines.map((l) => withCount(l.kind, l.count)).join(", ");
  const cats = [...new Set(lines.map((l) => l.category))];

  // Each time the page is shown (Next.js keeps a page around and runs this again when you come
  // back): Book Again's answers if there are some (My Bookings, the business portal), opened at the
  // date; otherwise the booking in progress (see Draft above).
  const shared = !forced;
  const ready = useRef(false);
  useEffect(() => {
    const again = takeRebook();
    const draft = shared ? readDraft() : null;
    void Promise.resolve().then(() => {
      setShowMore(false);
      setMissing([]);
      setView("form");
      if (again) {
        const fromAgain: Line[] = again.categories.flatMap((c) => {
          const types = categories.find((x) => x.slug === c)?.types ?? [];
          const ks = again.kinds[c]?.length ? again.kinds[c] : types.slice(0, 1);
          return ks.map((k) => ({ category: c, kind: k, count: again.counts[k] || 1 }));
        });
        setLines(fromAgain);
        setPicked(null);
        setKind(null);
        setForm((f) => ({ ...f, date: "", venue: { ...blankVenue, text: again.venue }, time: again.time, hours: again.hours, details: again.details }));
        moved.current = true;
        setStep(S.date);
        setReached(S.date);
      } else if (shared) {
        if (draft && (!preset || draft.cat === preset || draft.lines.some((l) => l.category === preset))) {
          setLines(draft.lines);
          setPicked(draft.cat);
          setKind(draft.kind);
          setForm(draft.form);
          setStep(draft.step);
          setReached(draft.reached);
        } else {
          // A different category (or nothing yet): start over with this one.
          const fresh = { ...blank, name: draft?.form.name ?? "", phone: draft?.form.phone ?? "", email: draft?.form.email ?? "" };
          setLines([]);
          setPicked(undefined);
          setKind(null);
          setForm(fresh);
          setStep(null);
          setReached(0);
          writeDraft({ lines: [], cat: preset || null, kind: null, step: preset ? S.kind : S.who, reached: 0, form: fresh });
        }
      }
      ready.current = true;
    });
    return () => {
      ready.current = false;
    };
  }, [shared, preset]);

  // Keep the booking in progress as it changes; a sent request clears it.
  useEffect(() => {
    if (!shared || !ready.current) return;
    writeDraft(view === "done" ? null : { lines, cat, kind: kindState, step, reached, form });
  }, [shared, view, lines, cat, kindState, step, reached, form]);

  // Already signed in with this email? Typing it skips the code.
  useEffect(() => {
    if (!backendEnabled) return;
    signedInEmail()
      .then((e) => e && setVerified(e))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const box = top.current;
    if (box && box.getBoundingClientRect().top < 64) box.scrollIntoView({ block: "start" });
    if (view === "form") window.setTimeout(() => heading.current?.focus({ preventScroll: true }), 50);
  }, [step, view]);

  const goStep = (n: number) => {
    const to = Math.max(0, Math.min(LAST, n));
    moved.current = true;
    setDir(to >= step ? 1 : -1);
    setStep(to);
    setReached((r) => Math.max(r, to));
  };
  function clearAll() {
    setLines([]);
    setPicked(null);
    setKind(null);
    setShowMore(false);
    setForm({ ...blank, ...contact });
    setMissing([]);
    setReached(0);
    goStep(S.who);
  }
  const back = () => goStep(step === S.who && lines.length ? S.more : step - 1);
  // Next shows after Back, while the question on screen is still answered.
  const answered = [Boolean(cat), Boolean(kind && lineCount(kind)), lines.length > 0, Boolean(form.date), Boolean(form.time && form.hours), true, false];
  const canNext = step < reached && answered[step];
  const next = () => goStep(step + 1);

  const pickCategory = (slug: string) => {
    if (slug !== cat) {
      setKind(null);
      setShowMore(false);
    }
    setPicked(slug);
    goStep(S.kind);
  };
  // Picking a kind stays on question 02, where How Many? appears under the kinds.
  const pickKind = (k: string) => {
    if (k !== kindState) setShowMore(false);
    setKind(k);
  };
  // How many: the artists join the cart (a kind already in it gets the new number), then 03.
  const pickCount = (n: number) => {
    if (!cat || !kind) return;
    const c = Math.max(1, Math.min(20, n));
    setLines((ls) => (ls.some((l) => l.category === cat && l.kind === kind) ? ls.map((l) => (l.category === cat && l.kind === kind ? { ...l, count: c } : l)) : [...ls, { category: cat, kind, count: c }]));
    setShowMore(false);
    setMore("");
    goStep(S.more);
  };
  const removeLine = (l: Line) => setLines((ls) => ls.filter((x) => !(x.category === l.category && x.kind === l.kind)));
  // Add Another Artist: question 01 again, with nothing picked.
  const addAnother = () => {
    setPicked(null);
    setKind(null);
    setShowMore(false);
    goStep(S.who);
  };
  // No, That's Everyone: on to the first question not answered yet (a date and time from the
  // business calendar, or Book Again's time, are already there).
  const afterCart = () => goStep(!form.date ? S.date : !(form.time && form.hours) ? S.time : S.where);
  const pickDate = (date: string) => {
    change({ date });
    setCalendar(false);
    goStep(form.time && form.hours ? S.where : S.time);
  };
  // Start time and how many hours: once both are set, on to where.
  const pickTime = (patch: Partial<typeof blank>) => {
    const f = { ...form, ...patch };
    change(patch);
    if (f.time && f.hours > 0) goStep(S.where);
  };
  const set = (key: "occasion" | "details" | "name" | "phone" | "email") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const change = (patch: Partial<typeof blank>) => setForm((f) => ({ ...f, ...patch }));

  function stillNeeded() {
    const f = p.fields;
    return [
      !lines.length && p.rows.who,
      !form.date && f.date,
      !form.time && f.time,
      !form.hours && f.hours.replace("?", ""),
      !form.venue.text.trim() && f.venue,
      !form.name.trim() && f.name,
      form.phone.replace(/\D/g, "").length < 10 && f.phone,
      !isEmail(email) && f.email,
    ].filter((x): x is string => Boolean(x));
  }

  // The last question's button: Send OTP, then Confirm Request (saves it straight away).
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (step === S.where) return goStep(S.you); // Continue
    const need = backendEnabled ? stillNeeded() : [];
    setMissing(need);
    if (need.length > 0) return;
    if (!confirmed && !codeSent) return sendCode();
    if (!confirmed && backendEnabled) {
      if (!/^\d{6}$/.test(code)) return codeBox.current?.focus();
      setBusy("verify");
      setCodeError(null);
      const res = await verifyCode(email, code).catch(() => ({ ok: false as const, error: "Couldn't check the code just now. Please try again." }));
      setBusy(null);
      if (!res.ok) return setCodeError(res.error);
      setVerified(email);
    }
    return confirm();
  }

  async function sendCode() {
    setBusy("code");
    setCodeError(null);
    setCode("");
    const res = backendEnabled
      ? await requestCode(email).catch(() => ({ ok: false as const, error: "Couldn't send the code just now. Please try again in a minute." }))
      : await new Promise<{ ok: true }>((done) => window.setTimeout(() => done({ ok: true }), 500));
    setBusy(null);
    if (!res.ok) {
      setCodeFor(null);
      return setCodeError(res.error);
    }
    setCodeFor(email);
    window.setTimeout(() => codeBox.current?.focus(), 0);
  }

  async function confirm() {
    setSaveError(null);
    const sent = lines.map((l) => ({ category: l.category, name: l.kind, count: l.count }));
    const kinds = lines.map((l) => l.kind);
    if (!backendEnabled) {
      const n = saveMock({
        audience,
        categories: cats,
        kinds,
        counts: Object.fromEntries(lines.map((l) => [l.kind, l.count])),
        lines: sent,
        needs: needsText,
        ...form,
        endTime,
        email,
      });
      setRef(orderId(cats, n, new Date(), audience === "business"));
      moved.current = true;
      return setView("done");
    }
    setBusy("save");
    const res = await createBookingRequest({
      audience: audience === "business" ? "business" : "personal",
      categories: cats,
      kinds,
      lines: sent,
      occasion: form.occasion,
      date: form.date,
      startTime: form.time,
      endTime,
      venue: form.venue.text,
      city: form.venue.city,
      details: form.details,
      name: form.name,
      phone: form.phone,
      email,
      website,
    }).catch((): SaveResult<{ ref: string }> => ({ ok: false, error: "Couldn't save your request just now. Please try again in a minute." }));
    setBusy(null);
    if (res.ok) {
      setRef(res.ref);
      moved.current = true;
      return setView("done");
    }
    if (res.verify) {
      setVerified(null);
      setCodeFor(null);
      setCodeError(res.error);
      return;
    }
    setSaveError(res.error);
  }

  // Book Another Event: the questions again from the start, keeping the contact details.
  function another() {
    setLines([]);
    setPicked(null);
    setKind(null);
    setShowMore(false);
    setForm((f) => ({ ...blank, name: f.name, phone: f.phone, email: f.email }));
    setMissing([]);
    setSaveError(null);
    setDir(-1);
    setStep(S.who);
    setReached(0);
    moved.current = true;
    setView("form");
  }

  // The answers so far, as chips that jump back to their question.
  const chips = [
    { text: needsText, step: S.more },
    { text: pickedDay?.long ?? "", step: S.date },
    { text: form.time && form.hours > 0 ? timeRange(form.time, endTime) : "", step: S.time },
    { text: form.occasion || form.venue.text, step: S.where },
  ].filter((c) => c.text && c.step < step);

  if (view === "done")
    return (
      <div ref={top} className="max-w-3xl scroll-mt-24" role="status">
        <h2 className="text-4xl sm:text-5xl">
          <Dots>{p.confirmedTitle}</Dots>
        </h2>
        <p className="mt-6 text-2xl font-medium tabular-nums">
          <span className="text-muted">{p.orderLabel}</span> {ref}
        </p>
        <p className="mt-4 max-w-xl text-lg text-muted">
          {p.confirmedNote}
          {backendEnabled && (
            <>
              {" "}
              {p.copySent} <span className="text-ink">{email}</span>.
            </>
          )}
        </p>
        <div className="mt-10 flex flex-wrap gap-3 max-sm:*:flex-1">
          <button type="button" onClick={another} className={primaryButton}>
            {p.another}
          </button>
          {onOrders ? (
            <button type="button" onClick={onOrders} className={secondaryButton}>
              {p.yourOrders}
            </button>
          ) : (
            <Link href="/my-bookings" className={secondaryButton}>
              {p.myBookings}
            </Link>
          )}
        </div>
      </div>
    );

  const title = step === S.kind && single && kindName ? p.howMany(kindName) : p.steps[step];

  return (
    <div ref={top} className="max-w-3xl scroll-mt-24">
      {/* The first-visit choice (AudiencePrompt); "Change" asks the question again. */}
      {!forced && ap.choices.some((c) => c.value === audience) && (
        <p className="mb-8 text-muted">
          {ap.bookingFor}: <span className="font-medium text-ink">{ap.choices.find((c) => c.value === audience)?.title}</span>{" "}
          <button type="button" onClick={() => setAudience(null)} className={`ml-2 ${textButton}`}>
            {ap.change}
          </button>
        </p>
      )}

      {/* Progress, the cart, then Back, Next (after going back) and Clear All. */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-5">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{p.question(step + 1, p.steps.length)}</span>
          <span className="flex gap-1" aria-hidden>
            {p.steps.map((_, i) => (
              <i key={i} className={`h-1 w-5 rounded-full transition-colors ${i <= step ? "bg-ink" : "bg-line"}`} />
            ))}
          </span>
        </div>
        <div className="flex items-center gap-5">
          {lines.length > 0 && step !== S.more && (
            <button type="button" onClick={() => goStep(S.more)} aria-label={`${p.cart}: ${needsText}`} className="relative grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition-colors hover:border-ink">
              <CartIcon />
              <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-medium text-white tabular-nums">{lines.length}</span>
            </button>
          )}
          {step > 0 && (
            <button type="button" onClick={back} className={textButton}>
              {p.back}
            </button>
          )}
          {canNext && (
            <button type="button" onClick={next} className={textButton}>
              {p.next}
            </button>
          )}
          <button type="button" onClick={clearAll} disabled={!lines.length && !cat && JSON.stringify(form) === JSON.stringify({ ...blank, ...contact })} className={textButton}>
            {p.clear}
          </button>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Your answers so far">
          {chips.map((c) => (
            <li key={c.step}>
              <button type="button" onClick={() => goStep(c.step)} className="max-w-[18rem] truncate rounded-full bg-wash px-3.5 py-1.5 text-sm text-ink hover:bg-line">
                {c.text}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-10">
        <div className="overflow-x-clip">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.section
              key={step}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d * 48, opacity: 0 }),
                shown: { x: 0, opacity: 1, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
                leave: (d: number) => ({ x: d * -48, opacity: 0, transition: { duration: 0.18 } }),
              }}
              initial="enter"
              animate="shown"
              exit="leave"
              aria-labelledby="book-question"
            >
              <p className="text-sm text-muted">{String(step + 1).padStart(2, "0")}</p>
              <h2 id="book-question" ref={heading} tabIndex={-1} className="mt-2 text-2xl outline-none sm:text-3xl">
                {title}
              </h2>
              <div className="mt-6">
                {step === S.who && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {categories.map((c) => {
                      const inCart = lines.some((l) => l.category === c.slug);
                      return (
                        <button key={c.slug} type="button" aria-pressed={cat === c.slug} onClick={() => pickCategory(c.slug)} className={`relative flex flex-col items-start rounded-xl border p-4 text-left text-base font-medium leading-tight text-ink transition-colors ${cat === c.slug ? "border-ink bg-wash ring-1 ring-ink" : "border-line bg-paper hover:border-ink"}`}>
                          {/* The homepage's picture for the category (categoryIcons), a transparent cut-out. A picked
                              tile is outlined, not black, so the dark clothes stay visible. */}
                          <Image src={categoryIcons[c.slug]} alt="" width={512} height={512} className="h-14 w-14 sm:h-16 sm:w-16" />
                          <span className="mt-3">{c.name}</span>
                          {inCart && <span className="absolute right-3 top-3 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">{p.added}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === S.kind && category && !single && (
                  <div className="flex flex-wrap gap-2">
                    {category.types.map((t) => (
                      <button key={t} type="button" aria-pressed={kindState === t} onClick={() => pickKind(t)} className={`h-12 px-5 text-base ${tile(kindState === t)}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                {step === S.kind && !category && <p className="text-lg text-muted">{p.pickFirst}</p>}

                {/* How Many?, on the same question once a kind is picked (or straight away for a
                    category with only one kind): 1, 2, 3, or More for a box up to 20. */}
                {step === S.kind && category && kind && (
                  <div className={single ? "" : "mt-10"}>
                    {!single && <h3 className="text-xl sm:text-2xl">{p.howMany(kindName)}</h3>}
                    <div className={`flex flex-wrap gap-2 ${single ? "" : "mt-4"}`}>
                      {COUNTS.map((n) => (
                        <button key={n} type="button" aria-pressed={lineCount(kind) === n} onClick={() => pickCount(n)} className={`h-12 min-w-14 justify-center px-4 text-center text-base tabular-nums ${tile(lineCount(kind) === n)}`}>
                          {n}
                        </button>
                      ))}
                      <button type="button" aria-pressed={showMore} onClick={() => setShowMore(true)} className={`h-12 px-5 text-base ${tile(showMore || (lineCount(kind) ?? 0) > COUNTS.length)}`}>
                        {p.more}
                      </button>
                    </div>
                    {showMore && (
                      <div className="mt-5 flex max-w-sm gap-2">
                        <input
                          type="number"
                          min={COUNTS.length + 1}
                          max={20}
                          value={more}
                          onChange={(e) => setMore(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              pickCount(Number(more) || COUNTS.length + 1);
                            }
                          }}
                          placeholder={`${COUNTS.length + 1} to 20`}
                          aria-label={`How many ${kindName}, up to 20`}
                          autoFocus
                          className={`${input} mt-0`}
                        />
                        <button type="button" onClick={() => pickCount(Number(more) || COUNTS.length + 1)} className={primaryButton}>
                          {p.continue}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* The cart: who's in the order so far, then add another or carry on. */}
                {step === S.more && (
                  <>
                    {lines.length > 0 && (
                      <ul className="mb-8 border-t border-line">
                        {lines.map((l) => (
                          <li key={`${l.category}-${l.kind}`} className="flex items-center gap-4 border-b border-line py-3.5">
                            <Image src={categoryIcons[l.category]} alt="" width={512} height={512} className="h-10 w-10 shrink-0" />
                            <span className="min-w-0 flex-1 text-lg">{withCount(l.kind, l.count)}</span>
                            <button type="button" onClick={() => removeLine(l)} className={textButton}>
                              {p.remove}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button type="button" onClick={addAnother} className={`flex min-h-20 items-center gap-3 p-5 text-left text-lg ${tile(false)}`}>
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wash text-xl leading-none" aria-hidden>
                          +
                        </span>
                        {lines.length ? p.addAnother : p.addFirst}
                      </button>
                      {lines.length > 0 && (
                        <button type="button" onClick={afterCart} className={`flex min-h-20 items-center p-5 text-left text-lg ${tile(true)}`}>
                          {p.thatsEveryone}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* The next 15 days from tomorrow, then Other Date (the calendar popup). */}
                {step === S.date && (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {days.map((d) => (
                      <button key={d.value} type="button" aria-pressed={form.date === d.value} aria-label={d.long} onClick={() => pickDate(d.value)} className={`flex flex-col items-center py-3 text-center ${tile(form.date === d.value)}`}>
                        <span className="text-xs opacity-70">{d.weekday}</span>
                        <span className="mt-1 text-2xl tabular-nums">{d.day}</span>
                        <span className="text-xs opacity-70">{d.month}</span>
                      </button>
                    ))}
                    <button type="button" aria-pressed={otherDate} onClick={() => setCalendar(true)} className={`flex flex-col items-center justify-center py-3 text-center ${tile(otherDate)}`}>
                      <span className="text-xs opacity-70">{otherDate ? pickedDay?.weekday : p.otherDate[0]}</span>
                      <span className={`mt-1 tabular-nums ${otherDate ? "text-2xl" : "text-base"}`}>{otherDate ? pickedDay?.day : p.otherDate[1]}</span>
                      <span className="text-xs opacity-70">{otherDate ? pickedDay?.month : " "}</span>
                    </button>
                  </div>
                )}

                {/* Start time and how many hours: fields that open the scroll wheels. */}
                {step === S.time && (
                  <>
                    <div className="grid max-w-xl gap-4 sm:grid-cols-2">
                      <TimeField label={p.fields.time} value={form.time} onChange={(time) => pickTime({ time })} />
                      <DurationField label={p.fields.hours} value={form.hours} onChange={(hours) => pickTime({ hours })} align="right" />
                    </div>
                    {form.time && form.hours > 0 && (
                      <p className="mt-6 rounded-xl bg-wash px-4 py-3 text-base text-ink" aria-live="polite">
                        {pickedDay && <span className="font-medium">{pickedDay.long} · </span>}
                        {timeRange(form.time, endTime)}
                      </p>
                    )}
                  </>
                )}

                {/* Where, and the brief for an artist (optional) right under it. */}
                {step === S.where && (
                  <>
                    <label className="mb-8 block text-sm text-muted">
                      {p.fields.occasion}
                      <input value={form.occasion} onChange={set("occasion")} placeholder={p.occasionPlaceholder} className={`${input} placeholder:text-muted/70`} />
                    </label>
                    <VenueField label={p.fields.venue} hideLabel placeholder={p.venuePlaceholder} value={form.venue} onChange={(venue) => change({ venue })} inputClass={input} />
                    <label className="mt-8 block text-sm text-muted">
                      {p.fields.details}
                      <textarea value={form.details} onChange={set("details")} rows={4} placeholder={p.detailsPlaceholder} className={`${input} h-auto py-3 placeholder:text-muted/70`} />
                    </label>
                  </>
                )}

                {step === S.you && (
                  <>
                    {/* Name and phone side by side, half the width each; email on its own line. */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <label className="text-sm text-muted">
                        {p.fields.name}
                        <input value={form.name} onChange={set("name")} autoComplete="name" className={input} />
                      </label>
                      <label className="text-sm text-muted">
                        {p.fields.phone}
                        <input value={form.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" className={input} />
                      </label>
                      <label className="col-span-2 text-sm text-muted">
                        {p.fields.email}
                        <input type="email" inputMode="email" value={form.email} onChange={set("email")} autoComplete="email" className={input} />
                      </label>
                    </div>
                    {/* The spam trap: hidden, so autofill and people never reach it. */}
                    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <input tabIndex={-1} autoComplete="off" name="aod-hp" value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </div>

                    {codeSent && (
                      <div className="mt-8 rounded-xl bg-wash p-5 sm:p-6">
                        <p className="text-xl font-medium text-ink">{p.codeTitle}</p>
                        <p className="mt-1 text-muted">
                          {p.codeSent} <span className="text-ink">{email || "your email"}</span>
                        </p>
                        <label className="mt-4 block max-w-56 text-sm text-muted">
                          {p.codeLabel}
                          <input
                            ref={codeBox}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            className={`${input} text-xl tracking-[0.3em] tabular-nums`}
                          />
                        </label>
                        {codeError && (
                          <p role="alert" className="mt-3 text-red-600">
                            {codeError}
                          </p>
                        )}
                        <button type="button" onClick={sendCode} disabled={Boolean(busy)} className={`mt-3 ${textButton}`}>
                          {p.newCode}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        {/* Only the questions with typing have a button: Continue, then Send OTP / Confirm Request. */}
        {step === S.where && (
          <div className="mt-10 flex flex-wrap gap-3 max-sm:*:flex-1">
            <button type="submit" className={primaryButton}>
              {p.continue}
            </button>
          </div>
        )}
        {step === S.you && (
          <div className="mt-12 flex flex-wrap items-center gap-3 max-sm:*:flex-1">
            <button type="submit" disabled={Boolean(busy) || (backendEnabled && codeSent && code.length !== 6)} className={`${primaryButton} disabled:opacity-40`}>
              {busy === "code" ? p.sending : busy === "verify" ? p.checking : busy === "save" ? p.saving : confirmed || codeSent ? p.confirm : p.sendCode}
            </button>
          </div>
        )}
        {missing.length > 0 && (
          <p role="alert" className="mt-4 text-red-600">
            Still needed: {missing.join(", ")}
          </p>
        )}
        {codeError && !codeSent && (
          <p role="alert" className="mt-4 text-red-600">
            {codeError}
          </p>
        )}
        {saveError && (
          <p role="alert" className="mt-4 text-red-600">
            {saveError}
          </p>
        )}
      </form>

      <DatePickerDialog open={calendar} value={form.date} min={minDate} onApply={pickDate} onClose={() => setCalendar(false)} />
    </div>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-[18px] w-[18px]">
      <path d="M6 7h12l-1 13H7L6 7z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
