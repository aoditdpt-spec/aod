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
import { durationText, endAfter, time12, timeRange } from "@/lib/event-time";
import { orderId } from "@/lib/order-id";
import { takeRebook } from "@/lib/rebook";
import { requestCode, signedInEmail, verifyCode } from "@/server/actions/auth";
import { createBookingRequest, type SaveResult } from "@/server/actions/public";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { Dots } from "@/components/ui/Dots";
import { DurationField, TimeField } from "@/components/ui/TimePicker";
import { withCount } from "@/components/ui/CountPicker";
import { VenueField, blankVenue, type Venue } from "@/components/ui/VenueField";

// The booking request, with as few clicks as possible (on request, 2026-11-19): each pick moves on
// by itself, with no Next button.
//   01 Who Are You Looking For?  tap one category (each with the homepage's picture)
//   02 Which Kind Of Artist?     tap one kind, then How Many? below it on the same question: 1, 2, 3
//                                or More (a box for 4 to 20); nothing picked to start with. A category
//                                with only one kind asks How Many? alone. Tapping a number moves on.
//   03 When, Where And Your Details   date, start time, how many hours, where, the brief for an artist, then
//                                name, phone and email; Send OTP, then Confirm
//      Request saves it straight away (no review page) and says "Request Received." with the ref.
// The answers so far show as chips that jump back; Back and Clear All sit by the progress (Undo
// removed on request, 2026-11-21).
// Business events are booked from the company's account (/business), as on aod.co.in: there the
// portal's Book Artists tab shows these questions with `forceAudience="business"` and the company's
// contact details filled in; anywhere else a visitor who chose Business Events goes to /business
// (on a category page, a line points there instead). Mock mode (backendEnabled off): no email goes
// out, nothing is required, any code or none passes, and the request is kept in this browser.

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
const blank = { date: "", time: "", hours: 0, venue: blankVenue as Venue, details: "", name: "", phone: "", email: "" };
const LAST = p.steps.length - 1;
const COUNTS = [1, 2, 3]; // then More, a box for 4 to 20
// The last question's quick picks; "Other" opens the scroll wheels (TimePicker.tsx).
const TIMES = ["10:00", "12:00", "15:00", "17:00", "19:00", "20:00"];
const HOURS = [2, 3, 4, 5, 6, 8];
const DAYS = 15; // day tiles from tomorrow; "Other" opens the calendar for any later day
const sectionTitle = "text-xl font-medium sm:text-2xl";
const subLabel = "text-sm text-muted";

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

// The booking in progress, shared by /book (Get Your Artist) and the category pages, kept for this
// tab (sessionStorage) (on request, 2026-11-21). Get Your Artist carries on from it; a category
// page carries on only if it's the same category, otherwise it starts over with that category
// (keeping the name, phone and email). Sending the request clears it. The business portal keeps
// its own.
type Draft = { cat: string | null; kind: string | null; count: number | null; step: number; reached: number; form: typeof blank };
const DRAFT_KEY = "aod-book-draft";
function readDraft(): Draft | null {
  try {
    const v = sessionStorage.getItem(DRAFT_KEY);
    return v ? (JSON.parse(v) as Draft) : null;
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

export function BookForm({ forceAudience, contact, presetCategory, presetDate }: { forceAudience?: Audience; contact?: Contact; presetCategory?: string; presetDate?: string }) {
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
  return <Questions audience={forceAudience ?? chosenAudience} forced={!!forceAudience} contact={contact} presetCategory={presetCategory} presetDate={presetDate} />;
}

// `presetDate` ("YYYY-MM-DD"): the event date already filled in (a day picked on the business calendar).
function Questions({ audience, forced, contact, presetCategory, presetDate }: { audience: Audience | null | "unknown"; forced: boolean; contact?: Contact; presetCategory?: string; presetDate?: string }) {
  const queryPreset = usePreset();
  const preset = categories.some((c) => c.slug === (presetCategory ?? queryPreset)) ? (presetCategory ?? queryPreset) : "";
  const minDate = useTomorrow();
  const [picked, setPicked] = useState<string | null | undefined>(undefined); // undefined: the preset
  const cat = picked === undefined ? preset || null : picked;
  const category = categories.find((c) => c.slug === cat);
  const single = category ? category.types.length <= 1 : false;
  // A preset category opens at its next question.
  const [stepState, setStep] = useState<number | null>(null);
  const step = stepState ?? (preset ? 1 : 0);
  const [dir, setDir] = useState(1);
  const [reached, setReached] = useState(0); // the furthest question reached, for Next after Back
  const [kindState, setKind] = useState<string | null>(null);
  const kind = single ? (category?.types[0] ?? category?.name ?? null) : kindState;
  const [count, setCount] = useState<number | null>(null); // nothing picked to start with
  const [more, setMore] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [otherTime, setOtherTime] = useState(false);
  const [otherHours, setOtherHours] = useState(false);
  const [form, setForm] = useState(() => ({ ...blank, date: presetDate ?? "", ...contact }));
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
  const timeIsOther = otherTime || (Boolean(form.time) && !TIMES.includes(form.time));
  const hoursIsOther = otherHours || (form.hours > 0 && !HOURS.some((h) => h * 60 === form.hours));
  const kindName = kind ?? category?.name ?? "";
  const needsText = kindName ? withCount(kindName, count ?? 1) : "";

  // Each time the page is shown (Next.js keeps a page around and runs this again when you come
  // back): Book Again's answers if there are some (My Bookings, the business portal), opened at the
  // details; otherwise the booking in progress (see Draft above).
  const shared = !forced;
  const ready = useRef(false);
  useEffect(() => {
    const again = takeRebook();
    const draft = shared ? readDraft() : null;
    void Promise.resolve().then(() => {
      if (again) {
        const c = again.categories[0] ?? null;
        const k = (c && again.kinds[c]?.[0]) || categories.find((x) => x.slug === c)?.types[0] || null;
        setPicked(c);
        setKind(k);
        setCount((k && again.counts[k]) || 1);
        setForm((f) => ({ ...f, venue: { ...blankVenue, text: again.venue }, time: again.time, hours: again.hours, details: again.details }));
        moved.current = true;
        setStep(LAST);
        setReached(LAST);
        setView("form");
      } else if (shared) {
        setShowMore(false);
        setMissing([]);
        setView("form");
        if (draft && (!preset || draft.cat === preset)) {
          setPicked(draft.cat);
          setKind(draft.kind);
          setCount(draft.count);
          setForm(draft.form);
          setStep(draft.step);
          setReached(draft.reached);
        } else {
          // A different category (or nothing yet): start over with this one.
          const fresh = { ...blank, name: draft?.form.name ?? "", phone: draft?.form.phone ?? "", email: draft?.form.email ?? "" };
          setPicked(undefined);
          setKind(null);
          setCount(null);
          setForm(fresh);
          setStep(null);
          setReached(0);
          writeDraft({ cat: preset || null, kind: null, count: null, step: preset ? 1 : 0, reached: 0, form: fresh });
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
    writeDraft(view === "done" ? null : { cat, kind: kindState, count, step, reached, form });
  }, [shared, view, cat, kindState, count, step, reached, form]);

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
    setPicked(null);
    setKind(null);
    setCount(null);
    setShowMore(false);
    setForm({ ...blank, ...contact });
    setMissing([]);
    setReached(0);
    goStep(0);
  }
  const back = () => goStep(step - 1);
  // Next shows after Back, while the question on screen is still answered.
  const canNext = step < reached && (step === 0 ? Boolean(cat) : step === 1 ? Boolean(kind && count) : false);
  const next = () => goStep(step + 1);

  const pickCategory = (slug: string) => {
    if (slug !== cat) {
      setKind(null);
      setCount(null);
      setShowMore(false);
      setReached(1);
    }
    setPicked(slug);
    goStep(1);
  };
  // Picking a kind stays on question 02, where How Many? appears under the kinds.
  const pickKind = (k: string) => {
    if (k !== kindState) {
      setCount(null);
      setShowMore(false);
      setReached((r) => Math.min(r, 1));
    }
    setKind(k);
  };
  const pickCount = (n: number) => {
    setCount(Math.max(1, Math.min(20, n)));
    goStep(LAST);
  };
  const set = (key: "details" | "name" | "phone" | "email") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const change = (patch: Partial<typeof blank>) => setForm((f) => ({ ...f, ...patch }));

  function stillNeeded() {
    const f = p.fields;
    return [
      !cat && p.rows.who,
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
    const lines = cat ? [{ category: cat, name: kindName, count: count ?? 1 }] : [];
    if (!backendEnabled) {
      const n = saveMock({
        audience,
        categories: cat ? [cat] : [],
        kinds: kind ? [kind] : [],
        counts: kind ? { [kind]: count ?? 1 } : {},
        lines,
        needs: needsText,
        ...form,
        endTime,
        email,
      });
      setRef(orderId(cat ? [cat] : [], n, new Date(), audience === "business"));
      moved.current = true;
      return setView("done");
    }
    setBusy("save");
    const res = await createBookingRequest({
      audience: audience === "business" ? "business" : "personal",
      categories: cat ? [cat] : [],
      kinds: kind ? [kind] : [],
      lines,
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
    setPicked(null);
    setKind(null);
    setCount(null);
    setShowMore(false);
    setForm((f) => ({ ...blank, name: f.name, phone: f.phone, email: f.email }));
    setMissing([]);
    setSaveError(null);
    setDir(-1);
    setStep(0);
    setReached(0);
    moved.current = true;
    setView("form");
  }

  // The answers so far, as chips that jump back to their question.
  const chips = [
    { text: category?.name ?? "", step: 0 },
    { text: count ? needsText : single ? "" : (kind ?? ""), step: 1 },
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
          <Link href="/my-bookings" className={secondaryButton}>
            {p.myBookings}
          </Link>
        </div>
        {!backendEnabled && <p className="mt-6 text-sm text-muted">{p.previewNote}</p>}
      </div>
    );

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

      {/* Progress, with Back, Next (after going back) and Clear All. */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink pt-5">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>{p.question(step + 1, p.steps.length)}</span>
          <span className="flex gap-1" aria-hidden>
            {p.steps.map((_, i) => (
              <i key={i} className={`h-1 w-6 rounded-full transition-colors ${i <= step ? "bg-ink" : "bg-line"}`} />
            ))}
          </span>
        </div>
        <div className="flex gap-5">
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
          <button type="button" onClick={clearAll} disabled={!cat && JSON.stringify(form) === JSON.stringify({ ...blank, ...contact })} className={textButton}>
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
                {step === 1 && single && kindName ? p.howMany(kindName) : p.steps[step]}
              </h2>
              <div className="mt-6">
                {step === 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {categories.map((c) => (
                      <button key={c.slug} type="button" aria-pressed={cat === c.slug} onClick={() => pickCategory(c.slug)} className={`flex flex-col items-start rounded-xl border p-4 text-left text-base font-medium leading-tight text-ink transition-colors ${cat === c.slug ? "border-ink bg-wash ring-1 ring-ink" : "border-line bg-paper hover:border-ink"}`}>
                        {/* The homepage's picture for the category (categoryIcons), a transparent cut-out. A picked
                            tile is outlined, not black, so the dark clothes stay visible. */}
                        <Image src={categoryIcons[c.slug]} alt="" width={512} height={512} className="h-14 w-14 sm:h-16 sm:w-16" />
                        <span className="mt-3">{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && category && !single && (
                  <div className="flex flex-wrap gap-2">
                    {category.types.map((t) => (
                      <button key={t} type="button" aria-pressed={kindState === t} onClick={() => pickKind(t)} className={`h-12 px-5 text-base ${tile(kindState === t)}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                {step === 1 && !category && <p className="text-lg text-muted">{p.pickFirst}</p>}

                {/* How Many?, on the same question once a kind is picked (or straight away for a
                    category with only one kind): 1, 2, 3, or More for a box up to 20. */}
                {step === 1 && category && kind && (
                  <div className={single ? "" : "mt-10"}>
                    {!single && <h3 className="text-xl sm:text-2xl">{p.howMany(kindName)}</h3>}
                    <div className={`flex flex-wrap gap-2 ${single ? "" : "mt-4"}`}>
                      {COUNTS.map((n) => (
                        <button key={n} type="button" aria-pressed={count === n} onClick={() => pickCount(n)} className={`h-12 min-w-14 px-4 text-base tabular-nums ${tile(count === n)} justify-center text-center`}>
                          {n}
                        </button>
                      ))}
                      <button type="button" aria-pressed={showMore} onClick={() => setShowMore(true)} className={`h-12 px-5 text-base ${tile(showMore || (count ?? 0) > COUNTS.length)}`}>
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

                {step === LAST && (
                  <>
                    {/* Tap-to-pick, like the first two questions, so it doesn't read as a form
                        (on request, 2026-11-21): When (a day, a start time, how long; "Other"
                        opens the calendar or the scroll wheels), Where, the brief, then the
                        contact details in a card. */}
                    <h3 className={sectionTitle}>{p.sections.when}</h3>
                    <p className={`${subLabel} mt-4`}>{p.fields.date}</p>
                    <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-8 sm:overflow-visible sm:px-0">
                      {days.map((d) => (
                        <button key={d.value} type="button" aria-pressed={form.date === d.value} aria-label={d.long} onClick={() => change({ date: d.value })} className={`flex w-[4.5rem] shrink-0 flex-col items-center py-3 text-center sm:w-auto ${tile(form.date === d.value)}`}>
                          <span className="text-xs opacity-70">{d.weekday}</span>
                          <span className="mt-1 text-2xl tabular-nums">{d.day}</span>
                          <span className="text-xs opacity-70">{d.month}</span>
                        </button>
                      ))}
                      {/* Any other day: the browser's own calendar, opened by a tap anywhere on the tile. */}
                      <label className={`relative flex w-[4.5rem] shrink-0 cursor-pointer flex-col items-center justify-center py-3 text-center sm:w-auto ${tile(otherDate)}`}>
                        <span className="text-xs opacity-70">{otherDate ? pickedDay?.weekday : p.otherDate[0]}</span>
                        <span className={`mt-1 tabular-nums ${otherDate ? "text-2xl" : "text-base"}`}>{otherDate ? pickedDay?.day : p.otherDate[1]}</span>
                        <span className="text-xs opacity-70">{otherDate ? pickedDay?.month : "\u00a0"}</span>
                        <input
                          type="date"
                          min={minDate || undefined}
                          value={form.date}
                          onChange={(e) => change({ date: e.target.value })}
                          onClick={(e) => {
                            try {
                              e.currentTarget.showPicker?.();
                            } catch {
                              // Older browsers open it themselves.
                            }
                          }}
                          aria-label={p.fields.date}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </label>
                    </div>

                    <p className={`${subLabel} mt-8`}>{p.fields.time}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TIMES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-pressed={form.time === t && !otherTime}
                          onClick={() => {
                            setOtherTime(false);
                            change({ time: t });
                          }}
                          className={`h-12 px-4 text-base tabular-nums ${tile(form.time === t && !otherTime)}`}
                        >
                          {time12(t).replace(":00", "")}
                        </button>
                      ))}
                      <button type="button" aria-pressed={timeIsOther} onClick={() => setOtherTime(true)} className={`h-12 px-5 text-base ${tile(timeIsOther)}`}>
                        {form.time && !TIMES.includes(form.time) ? time12(form.time) : p.other}
                      </button>
                    </div>
                    {timeIsOther && (
                      <div className="mt-3 max-w-xs">
                        <TimeField label={p.pickTime} value={form.time} onChange={(time) => change({ time })} />
                      </div>
                    )}

                    <p className={`${subLabel} mt-8`}>{p.fields.hours}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          aria-pressed={form.hours === h * 60 && !otherHours}
                          onClick={() => {
                            setOtherHours(false);
                            change({ hours: h * 60 });
                          }}
                          className={`h-12 px-4 text-base tabular-nums ${tile(form.hours === h * 60 && !otherHours)}`}
                        >
                          {p.hoursShort(h)}
                        </button>
                      ))}
                      <button type="button" aria-pressed={hoursIsOther} onClick={() => setOtherHours(true)} className={`h-12 px-5 text-base ${tile(hoursIsOther)}`}>
                        {form.hours > 0 && !HOURS.some((h) => h * 60 === form.hours) ? durationText(form.hours) : p.other}
                      </button>
                    </div>
                    {hoursIsOther && (
                      <div className="mt-3 max-w-xs">
                        <DurationField label={p.pickHours} value={form.hours} onChange={(hours) => change({ hours })} />
                      </div>
                    )}

                    {/* The answer in one line, once there's a start time and a length. */}
                    {form.time && form.hours > 0 && (
                      <p className="mt-6 rounded-xl bg-wash px-4 py-3 text-base text-ink" aria-live="polite">
                        {pickedDay && <span className="font-medium">{pickedDay.long} · </span>}
                        {timeRange(form.time, endTime)}
                      </p>
                    )}

                    <h3 className={`${sectionTitle} mt-14`}>{p.fields.venue}</h3>
                    <div className="mt-4">
                      <VenueField label={p.fields.venue} hideLabel placeholder={p.venuePlaceholder} value={form.venue} onChange={(venue) => change({ venue })} inputClass={input} testNote={!backendEnabled} />
                    </div>

                    <h3 className={`${sectionTitle} mt-14`}>{p.fields.details}</h3>
                    <textarea value={form.details} onChange={set("details")} rows={3} aria-label={p.fields.details} placeholder={p.detailsPlaceholder} className={`${input} mt-4 h-auto py-3 placeholder:text-muted/70`} />

                    {/* Name and phone side by side, half the width each; email on its own line. */}
                    <div className="mt-14 rounded-2xl bg-wash p-5 sm:p-6">
                      <h3 className={sectionTitle}>{p.detailsTitle}</h3>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
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
                        {!backendEnabled && <p className="mt-3 text-sm text-muted">{p.codePreview}</p>}
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

        {/* Only the last question has a button: Send OTP, then Confirm Request. */}
        {step === LAST && (
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
    </div>
  );
}
