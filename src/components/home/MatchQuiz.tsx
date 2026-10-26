"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eraser, Mail, MapPin, RotateCcw, Undo2, X } from "lucide-react";
import { categories, cities, occasions, type Audience } from "@/content/site";
import { CountPicker } from "@/components/ui/CountPicker";
import { Spinner } from "@/components/ui/Spinner";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { setCity, useCity } from "@/lib/city";
import { backendEnabled } from "@/lib/backend";
import { needsText, withCount } from "@/lib/booking-needs";
import { durationText, endAfter, eventMinutes, timeRange, timeSpan } from "@/lib/event-time";
import { addSentRequest, newRequestRef } from "@/lib/customer-store";
import { takeRebook } from "@/lib/rebook";
import { briefLines, cleanBrief, type Brief } from "@/content/artist-brief";
import { ArtistBrief } from "./ArtistBrief";
import { whatsappUrl } from "@/lib/whatsapp";
import { requestCode, signedInEmail, verifyCode, type Result } from "@/server/actions/auth";
import { createBookingRequest } from "@/server/actions/public";

const audienceLabel: Record<Audience, string> = {
  personal: "Personal event",
  business: "Business",
};

// Artists first (what's being booked), then the occasion, then when and where.
const titles = ["Who do you need?", "What's the occasion?", "When and where?"];

// "How many hours?": half hours up to 12, then whole hours up to 24 (as minutes).
const hourChoices = [...Array.from({ length: 24 }, (_, i) => (i + 1) * 30), ...Array.from({ length: 12 }, (_, i) => (13 + i) * 60)];

const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

// The occasion that asks the customer to write their own (a box opens under the choices).
const OTHER = "Something else";

// A service's "Request a quote" on a category page (QuoteButton) sends this, and MatchQuiz starts
// again from fresh: that category picked, and "Something else" with the service's name.
export const QUOTE_EVENT = "aod:quote";
export type QuoteDetail = { category: string; service: string };

// One category the customer needs, and how many artists of it.
type Need = { slug: string; count: number };

// The answers Undo can step back through (typed text has the browser's own undo).
type Snapshot = { step: number; needs: Need[]; occasion: string; otherOccasion: string; date: string; city: string | null; hours: number; startTime: string };

// Earliest bookable date: tomorrow, in the visitor's local time, as YYYY-MM-DD.
// (Today and earlier can't be picked.)
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const EASE = [0.22, 1, 0.36, 1] as const;
// Questions slide in from the side you're heading to (right when going on, left when going back).
const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40, transition: { duration: 0.2, ease: EASE } }),
};

// Three quick questions, one at a time, then a pre-filled WhatsApp message to the AOD team: who
// they need (and how many), the occasion, then when and where. Picking the occasion moves straight
// on; the answers so far show as chips that jump back to edit. The time is a start time and how
// many hours; the end time is worked out from them (`endAfter`, src/lib/event-time.ts).
// `audience` picks the occasion list (personal or business); without it a mixed list is shown.
// The city comes from the navbar picker (src/lib/city.ts); if it's already chosen, it isn't asked again.
// "Who do you need?" takes any number of categories and how many artists of each (1 to 4, or "More"
// for up to 20). A category page passes its own category in `initialNeeds`, already picked.
// Before a request is sent, its email is confirmed with a 6-digit code emailed to it (requestCode /
// verifyCode, the same sign-in as My bookings, which it also signs them in to), so bots can't order;
// the server refuses a request whose email isn't confirmed. Someone already signed in with that
// email skips the code. If the code can't be sent, the request can still go to WhatsApp, marked
// as not saved.
// With the backend set up, "Send" saves the request first (createBookingRequest) and only then
// says "received" and opens WhatsApp with its reference. Without it (preview) any 6 digits pass,
// the request is kept in this browser for My bookings and WhatsApp opens straight away.
export function MatchQuiz({ audience, initialNeeds = [] }: { audience?: Audience; initialNeeds?: string[] }) {
  const occasionList = occasions[audience ?? "any"];
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [otherOccasion, setOtherOccasion] = useState(""); // written in the box under "Something else"
  const [history, setHistory] = useState<Snapshot[]>([]); // for Undo
  // What's saved and sent as the occasion: the choice, or what they wrote for "Something else".
  const occasionText = occasion === OTHER ? otherOccasion.trim() : occasion;
  const occasionOk = occasion !== "" && (occasion !== OTHER || occasionText.length >= 2);
  const [needs, setNeeds] = useState<Need[]>(() => initialNeeds.map((slug) => ({ slug, count: 1 })));
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [hours, setHours] = useState(0); // the event's length in minutes; 0 until picked
  const endTime = endAfter(startTime, hours);
  const city = useCity();
  const minDate = tomorrowISO();
  // YYYY-MM-DD strings compare correctly as text. Every detail is required.
  const dateOk = date !== "" && date >= minDate;
  const length = eventMinutes(startTime, endTime);
  const [changingCity, setChangingCity] = useState(false);
  const [details, setDetails] = useState("");
  // The optional "Brief for the artists" (src/content/artist-brief.ts): only the kinds of artist still picked count.
  const [brief, setBrief] = useState<Brief>({});
  const cleanedBrief = cleanBrief(brief, needs.map((n) => n.slug));
  const briefText = briefLines(cleanedBrief, categoryName);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: hidden, only bots fill it in
  const [opened, setOpened] = useState(false);
  // What the send button is waiting on: emailing the code, checking it, or saving the request.
  const [busy, setBusy] = useState<null | "code" | "verify" | "save">(null);
  // The email signed in on this browser (confirmed before), the email a code was sent to, and the code typed.
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeFailed, setCodeFailed] = useState(false); // the code couldn't be sent: offer WhatsApp instead
  const sendButton = useRef<HTMLButtonElement>(null);
  const [saved, setSaved] = useState<string | null>(null); // the request reference, once saved
  const [saveError, setSaveError] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const nameOk = name.trim().length >= 2;
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const detailsOk = details.trim().length >= 3;
  const cleanEmail = email.trim().toLowerCase();
  const verified = backendEnabled && verifiedEmail === cleanEmail;
  const codeSent = !verified && codeFor === cleanEmail;
  const codeOk = /^\d{6}$/.test(code);
  const canSend =
    occasionOk && needs.length > 0 && Boolean(city) && dateOk && length !== null && detailsOk && nameOk && phoneOk && emailOk && !busy;
  const ready = canSend && (!codeSent || codeOk);
  const missing = !dateOk
    ? date
      ? "Choose a date from tomorrow onwards."
      : "Choose the event date."
    : !city
      ? "Choose your city."
      : !startTime || !hours
        ? "Add the start time and how many hours."
        : length === null
          ? "Add the start time and how many hours."
          : !detailsOk
            ? "Add a few event details."
            : !nameOk
              ? "Add your name."
              : !phoneOk
                ? "Add your phone number."
                : !emailOk
                  ? "Add your email address."
                  : null;

  // Already signed in (My bookings, or an earlier request) with the email they type? Then no code.
  useEffect(() => {
    if (backendEnabled) signedInEmail().then(setVerifiedEmail, () => {});
  }, []);

  // "Book again" from My bookings (src/lib/rebook.ts): that order's answers, filled in once. With
  // its occasion and artists known, the questions open on the event details, where only the new
  // date is left to pick.
  const [rebooked, setRebooked] = useState(false);
  useEffect(() => {
    const draft = takeRebook(audience);
    if (!draft) return;
    const known = draft.needs.filter((n) => categories.some((c) => c.slug === n.slug) && n.count >= 1);
    const knownOccasion = Boolean(draft.occasion);
    /* eslint-disable react-hooks/set-state-in-effect -- a one-time fill from this tab's storage, which the server can't read */
    if (occasionList.some((o) => o.label === draft.occasion && o.label !== OTHER)) setOccasion(draft.occasion);
    else if (draft.occasion) {
      setOccasion(OTHER);
      setOtherOccasion(draft.occasion.replace(/^Something else:?\s*/i, ""));
    }
    if (known.length) setNeeds(known);
    if (draft.city) setCity(draft.city);
    if (draft.time && draft.endTime) {
      setStartTime(draft.time);
      setHours(eventMinutes(draft.time, draft.endTime) ?? 0);
    }
    if (draft.details) setDetails(draft.details);
    if (knownOccasion && known.length) setStep(2);
    setRebooked(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [audience, occasionList]);

  // Once the request has gone (saved, or sent on WhatsApp), the questions make way for a
  // confirmation; "Book another event" starts them again, keeping the contact details.
  const sent = saved !== null || opened || saveError !== null;
  const quizTop = useRef<HTMLDivElement>(null);
  // Every answer back to the start (the contact details stay), optionally with a service's quote
  // filled in: its category picked, and "Something else" with the service's name.
  function fresh(quote?: QuoteDetail, scroll = true) {
    setSaved(null);
    setSaveError(null);
    setOpened(false);
    setRebooked(false);
    setOccasion(quote ? OTHER : "");
    setOtherOccasion(quote?.service ?? "");
    setNeeds(quote ? [{ slug: quote.category, count: 1 }] : initialNeeds.map((slug) => ({ slug, count: 1 })));
    setDate("");
    setStartTime("");
    setHours(0);
    setDetails("");
    setBrief({});
    setDir(-1);
    setStep(0);
    if (scroll) quizTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const startOver = () => fresh();

  // A service's "Request a quote" (QuoteButton) starts again with that service. A link from
  // elsewhere (Most booked) can do the same with ?service= on the category page.
  useEffect(() => {
    const own = (detail: QuoteDetail) => categories.find((c) => c.slug === detail.category)?.services.some((s) => s.name === detail.service);
    const onQuote = (e: Event) => {
      const detail = (e as CustomEvent<QuoteDetail>).detail;
      if (detail && own(detail)) {
        setHistory([]);
        fresh(detail, false);
      }
    };
    window.addEventListener(QUOTE_EVENT, onQuote);
    const service = new URLSearchParams(window.location.search).get("service");
    if (service && initialNeeds[0] && own({ category: initialNeeds[0], service })) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- a one-time fill from the address, which the prerendered page can't read */
      fresh({ category: initialNeeds[0], service }, false);
    }
    return () => window.removeEventListener(QUOTE_EVENT, onQuote);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on load
  }, []);

  // Undo steps back through the selections (artists, counts, occasion, date, city, hours, start
  // time), taking the questions back to where the change was made; Clear all starts again (and
  // can be undone too).
  function remember() {
    const snap: Snapshot = { step, needs, occasion, otherOccasion, date, city, hours, startTime };
    setHistory((h) => [...h.slice(-29), snap]);
  }
  function undo() {
    const snap = history[history.length - 1];
    if (!snap) return;
    setHistory((h) => h.slice(0, -1));
    setNeeds(snap.needs);
    setOccasion(snap.occasion);
    setOtherOccasion(snap.otherOccasion);
    setDate(snap.date);
    if (snap.city) setCity(snap.city);
    setHours(snap.hours);
    setStartTime(snap.startTime);
    if (snap.step !== step) go(snap.step);
  }
  // Nothing to clear: still as the questions start (a category page's own category, one of it).
  const untouchedNeeds = needs.length === initialNeeds.length && needs.every((n) => n.count === 1 && initialNeeds.includes(n.slug));
  const blank = untouchedNeeds && !occasion && !date && !hours && !startTime && !details && !brief.note;
  function clearAll() {
    remember();
    setRebooked(false);
    setOccasion("");
    setOtherOccasion("");
    setNeeds(initialNeeds.map((slug) => ({ slug, count: 1 })));
    setDate("");
    setStartTime("");
    setHours(0);
    setDetails("");
    setBrief({});
    if (step !== 0) go(0);
  }

  // When the question changes (not on first load), keyboard focus moves to the new question
  // once it has slid in (it only mounts after the old one has slid out).
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  function go(to: number) {
    moved.current = true;
    setDir(to > step ? 1 : -1);
    setStep(to);
  }

  const message = [
    "Hi Artists on Demand! I'd like curated matches.",
    audience && `Booking for: ${audienceLabel[audience]}`,
    `Looking for: ${needsText(needs.map((n) => ({ name: categoryName(n.slug), count: n.count })))}`,
    `Occasion: ${occasionText}`,
    `Date: ${date || "Not fixed yet"}`,
    startTime && endTime && `Time: ${timeRange(startTime, endTime)}`,
    `City: ${city ?? "Not selected"}`,
    details && `Details: ${details}`,
    // After the details, so pasting the message into the admin's New booking keeps it with them.
    ...(briefText.length ? ["Brief for the artists:", ...briefText.map((l) => `- ${l}`)] : []),
    name.trim() && `Name: ${name.trim()}`,
    phone.trim() && `Phone: ${phone.trim()}`,
    email.trim() && `Email: ${email.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  function toggleNeed(slug: string) {
    remember();
    setNeeds((list) => (list.some((n) => n.slug === slug) ? list.filter((n) => n.slug !== slug) : [...list, { slug, count: 1 }]));
  }
  function setCount(slug: string, count: number) {
    remember();
    setNeeds((list) => list.map((n) => (n.slug === slug ? { ...n, count } : n)));
  }
  // "Photographers × 3, Musicians & DJs": for the answer chip and this browser's request list.
  const needLabels = needs.map((n) => withCount(categoryName(n.slug), n.count));

  // Answers given so far, shown above the current question.
  const summary = [
    step > 0 && needs.length ? { label: needLabels.join(", "), to: 0 } : null,
    step > 1 && occasionOk ? { label: occasionText, to: 1 } : null,
  ].filter((x): x is { label: string; to: number } => x !== null);

  // Emails the 6-digit code (preview: nothing is sent, any 6 digits pass).
  async function sendCode() {
    setBusy("code");
    setCodeError(null);
    setCodeFailed(false);
    if (backendEnabled) {
      let res: Result;
      try {
        res = await requestCode(cleanEmail, "customer");
      } catch {
        res = { ok: false, error: "Couldn't reach AOD just now." };
      }
      if (!res.ok) {
        setBusy(null);
        setCodeError(res.error);
        setCodeFailed(true);
        return;
      }
    }
    setBusy(null);
    setCode("");
    setCodeFor(cleanEmail);
  }

  // Preview: remember the request in this browser so it shows under My bookings, with a
  // reference the team can quote back.
  function sendPreview() {
    const ref = newRequestRef();
    addSentRequest({ id: ref, sentAt: new Date().toISOString(), audience, occasion: occasionText, needs: needLabels, needSlugs: needs, time: startTime, endTime, date, city: city ?? "", details });
    window.open(whatsappUrl([message, `Ref: ${ref}`].join("\n")), "_blank", "noopener,noreferrer");
    setOpened(true);
  }

  // The code couldn't be sent: the request still reaches AOD on WhatsApp, marked as not saved,
  // so the team adds it with the admin's New booking.
  function sendUnsaved() {
    window.open(whatsappUrl([message, "Ref: not saved on the website"].join("\n")), "_blank", "noopener,noreferrer");
    setCodeError(null);
    setSaveError("Your request wasn't saved on the website.");
    setOpened(true);
  }

  // Live: `tab` was opened inside the click (so it isn't blocked as a pop-up); save the request,
  // then point the tab at WhatsApp with the saved reference.
  async function save(tab: Window | null) {
    setBusy("save");
    setSaveError(null);
    const input = { audience, occasion: occasionText, needs: needs.map((n) => ({ category: n.slug, count: n.count })), date, startTime, endTime, city: city ?? "", details, brief: cleanedBrief, name, phone, email, website };
    // A dropped connection throws instead of answering: try a second time before giving up,
    // so the visitor is never left on "Saving your request…".
    let res: Awaited<ReturnType<typeof createBookingRequest>>;
    try {
      res = await createBookingRequest(input);
    } catch {
      try {
        await new Promise((r) => setTimeout(r, 1500));
        res = await createBookingRequest(input);
      } catch {
        res = { ok: false, error: "Couldn't reach AOD just now, so your request goes to WhatsApp instead. The team will add it for you." };
      }
    }
    setBusy(null);
    // The sign-in ran out between confirming and saving: ask for a new code instead of sending.
    if (!res.ok && res.verify) {
      tab?.close();
      setVerifiedEmail(null);
      setCodeFor(null);
      setCodeError(res.error);
      return;
    }
    // When it wasn't saved, the message says so: the team then pastes it into the admin's New booking.
    const url = whatsappUrl([message, res.ok ? `Ref: ${res.ref}` : "Ref: not saved on the website"].join("\n"));
    if (res.ok) setSaved(res.ref);
    else setSaveError(res.error);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else window.open(url, "_blank", "noopener,noreferrer");
    setOpened(true);
  }

  async function onSend() {
    if (!ready) return;
    if (!verified && !codeSent) return sendCode();
    if (!backendEnabled) return sendPreview();
    const tab = window.open("", "_blank");
    if (codeSent) {
      setBusy("verify");
      setCodeError(null);
      let res: Result;
      try {
        res = await verifyCode(cleanEmail, code);
      } catch {
        res = { ok: false, error: "Couldn't reach AOD just now. Please try again." };
      }
      if (!res.ok) {
        tab?.close();
        setBusy(null);
        setCodeError(res.error);
        return;
      }
      setVerifiedEmail(cleanEmail);
    }
    await save(tab);
  }

  const card = "overflow-hidden rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_6%,transparent)] sm:p-10";

  if (sent) {
    const ref = saved ?? undefined;
    const again = whatsappUrl([message, ref ? `Ref: ${ref}` : backendEnabled ? "Ref: not saved on the website" : ""].filter(Boolean).join("\n"));
    return (
      <div ref={quizTop} className={`${card} scroll-mt-28 text-center`} role="status">
        <CheckCircle2 className={`mx-auto h-12 w-12 ${saved || !backendEnabled ? "text-emerald-600" : "text-amber-600"}`} aria-hidden />
        <h3 className="mt-4 text-2xl font-bold text-ink">{saved ? "Request received" : backendEnabled ? "Sent on WhatsApp" : "Request sent on WhatsApp"}</h3>
        {saved && <p className="mt-1 text-sm font-medium text-muted">Ref {saved}</p>}
        <p className="mx-auto mt-3 max-w-md text-body">
          {saved ? (
            <>
              WhatsApp opened with it pre-filled; tap <strong>send</strong> to chat with the AOD team. AOD replies with curated matches. You&apos;re signed in to My bookings as {cleanEmail}.
            </>
          ) : backendEnabled ? (
            <>
              {saveError} WhatsApp opened with your request; tap <strong>send</strong> so the AOD team gets it and adds it for you.
            </>
          ) : (
            <>
              WhatsApp opened with your request pre-filled; tap <strong>send</strong> to reach our team. You&apos;ll find it under My bookings.
            </>
          )}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {(saved || !backendEnabled) && (
            <Link href="/my-bookings" className="inline-flex h-12 items-center rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover">
              View in My bookings
            </Link>
          )}
          <a href={again} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-lg border border-line px-6 font-medium text-ink hover:border-ink">
            <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Open WhatsApp again
          </a>
          <button type="button" onClick={startOver} className="inline-flex h-12 items-center gap-2 rounded-lg border border-line px-6 font-medium text-ink hover:border-ink">
            <RotateCcw className="h-4 w-4" aria-hidden /> Book another event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={quizTop} className={`${card} scroll-mt-28`}>
      {rebooked && (
        <p className="mb-5 rounded-xl bg-wash px-4 py-3 text-sm text-ink" role="status">
          Booking again: your last order&apos;s answers are filled in. Pick the new date and check the rest.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">Three quick questions</p>
        <div className="flex items-center gap-2 text-xs text-ink" aria-label={`Question ${step + 1} of 3`}>
          <span>Question {step + 1} of 3</span>
          {titles.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all duration-500 ${i <= step ? "w-10 bg-brand" : "w-6 bg-line"}`} />
          ))}
        </div>
      </div>

      {(history.length > 0 || !blank) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={blank}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eraser className="h-3.5 w-3.5" aria-hidden /> Clear all
          </button>
        </div>
      )}

      {summary.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Your answers so far">
          {summary.map((s) => (
            <li key={s.to}>
              <button
                type="button"
                onClick={() => go(s.to)}
                className="max-w-[18rem] truncate rounded-full bg-peach/60 px-3 py-1 text-xs font-medium text-ink hover:bg-peach"
                title="Change this answer"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <m.section
          key={step}
          custom={dir}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          onAnimationComplete={(name) => {
            if (name === "center" && moved.current) heading.current?.focus();
          }}
          className="mt-6"
        >
          <h3 ref={heading} tabIndex={-1} className="text-2xl font-bold text-ink outline-none sm:text-[2rem] sm:leading-tight">
            {titles[step]}
          </h3>


          {step === 0 && (
            <>
              {initialNeeds.length > 0 && (
                <p className="mt-3 text-sm text-body">
                  Already added: {initialNeeds.map(categoryName).join(", ")}. Need anyone else for the same event? Add them too.
                </p>
              )}
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map((c) => {
                  const need = needs.find((n) => n.slug === c.slug);
                  return (
                    <li key={c.slug}>
                      <button
                        type="button"
                        aria-pressed={Boolean(need)}
                        onClick={() => toggleNeed(c.slug)}
                        className={`press flex h-full w-full items-center justify-between gap-2 rounded-xl py-2 pl-2 pr-3 text-left text-sm font-medium text-ink lg:h-auto lg:px-4 lg:py-3 ${
                          need ? "bg-peach ring-2 ring-brand" : "bg-wash hover:bg-peach/60"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {c.image ? (
                            <Image src={c.image.src} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg object-cover lg:hidden" />
                          ) : (
                            <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white lg:hidden">
                              <Icon name={c.icon} className="h-5 w-5 text-brand" />
                            </span>
                          )}
                          <span className="leading-tight">{c.name}</span>
                        </span>
                        {need && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-brand-hover">
                            {need.count > 1 && `× ${need.count}`}
                            <Check className="h-4 w-4" aria-hidden />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted">Pick everyone you need, then say how many of each.</p>
              {needs.length > 0 && (
                <div className="mt-6 rounded-xl border border-line p-4 sm:p-5">
                  <p className="text-sm font-bold text-ink">How many of each?</p>
                  <ul className="mt-1 divide-y divide-line">
                    {needs.map((n) => {
                      const c = categories.find((x) => x.slug === n.slug);
                      const name = categoryName(n.slug);
                      return (
                        // Phones: the name and remove button on one line, the numbers below; wider: one line.
                        <li key={n.slug} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                          <span className="flex flex-1 items-center gap-2 text-sm font-medium text-ink">
                            {c && <Icon name={c.icon} className="h-4 w-4 shrink-0 text-brand" />}
                            {name}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleNeed(n.slug)}
                            aria-label={`Remove ${name}`}
                            className="rounded-lg p-2 text-muted hover:bg-wash hover:text-ink sm:order-last"
                          >
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                          <div className="w-full sm:w-auto">
                            <CountPicker value={n.count} onChange={(count) => setCount(n.slug, count)} label={name.toLowerCase()} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <StepNav onNext={() => go(1)} nextDisabled={needs.length === 0} />
            </>
          )}
          {step === 1 && (
            <>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {occasionList.map(({ label, icon }) => (
                  <li key={label}>
                    <button
                      type="button"
                      aria-pressed={occasion === label}
                      onClick={() => {
                        if (occasion !== label) remember();
                        setOccasion(label);
                        if (label !== OTHER) go(2);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-4 py-3.5 text-left text-sm font-medium text-ink transition-colors ${
                        occasion === label ? "bg-peach ring-2 ring-brand" : "bg-wash hover:bg-peach/60"
                      }`}
                    >
                      <Icon name={icon} className="h-4 w-4 shrink-0 text-brand" />
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
              {occasion === OTHER ? (
                <label className="mt-5 block text-sm font-medium text-ink">
                  What&apos;s the occasion?
                  <input
                    value={otherOccasion}
                    onChange={(e) => setOtherOccasion(e.target.value)}
                    maxLength={70}
                    autoFocus
                    placeholder="e.g. Aerial event coverage, a college fest, a housewarming…"
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
              ) : (
                <p className="mt-4 text-xs text-muted">Pick one to continue.</p>
              )}
              <StepNav onBack={() => go(0)} onNext={occasion === OTHER ? () => go(2) : undefined} nextDisabled={!occasionOk} />
            </>
          )}

          {step === 2 && (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-ink">
                  Event date
                  <input
                    type="date"
                    value={date}
                    min={minDate}
                    onChange={(e) => {
                      remember();
                      setDate(e.target.value);
                    }}
                    aria-invalid={date !== "" && !dateOk}
                    aria-describedby={date !== "" && !dateOk ? "event-date-error" : undefined}
                    className={`mt-1.5 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-brand ${date === "" || dateOk ? "border-line" : "border-red-500"}`}
                  />
                  {date !== "" && !dateOk && (
                    <span id="event-date-error" className="mt-1.5 block text-xs font-normal text-red-600">
                      Choose a date from tomorrow onwards.
                    </span>
                  )}
                </label>
                {city && !changingCity ? (
                  <div className="text-sm font-medium text-ink">
                    City
                    <div className="mt-1.5 flex items-center justify-between gap-3 rounded-xl border border-brand/40 bg-peach/40 px-4 py-3">
                      <span className="flex items-center gap-2 font-normal">
                        <MapPin className="h-4 w-4 text-brand" aria-hidden />
                        City selected: <strong className="font-medium">{city}</strong>
                      </span>
                      <button type="button" onClick={() => setChangingCity(true)} className="text-sm font-medium text-brand underline-offset-4 hover:underline">
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="text-sm font-medium text-ink">
                    City
                    <select
                      value={city ?? ""}
                      onChange={(e) => {
                        remember();
                        setCity(e.target.value);
                        setChangingCity(false);
                      }}
                      className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-brand"
                    >
                      <option value="" disabled>
                        Choose your city
                      </option>
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="text-sm font-medium text-ink">
                  How many hours?
                  <select
                    value={hours || ""}
                    onChange={(e) => {
                      remember();
                      setHours(Number(e.target.value));
                    }}
                    className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-brand"
                  >
                    <option value="" disabled>
                      Choose
                    </option>
                    {hourChoices.map((m) => (
                      <option key={m} value={m}>
                        {durationText(m)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-ink">
                  Start time
                  <input
                    type="time"
                    step={900}
                    value={startTime}
                    onChange={(e) => {
                      remember();
                      setStartTime(e.target.value);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
                {length !== null && (
                  <p className="-mt-2 text-sm text-ink sm:col-span-2" aria-live="polite">
                    <strong className="font-medium">{timeSpan(startTime, endTime)}</strong>
                  </p>
                )}
                <label className="text-sm font-medium text-ink sm:col-span-2">
                  Event details
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={2}
                    placeholder="Guest count, venue, budget…"
                    className="mt-1.5 w-full resize-none rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
              </div>

              <ArtistBrief brief={brief} onChange={setBrief} />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-ink">
                  Your name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
                <label className="text-sm font-medium text-ink">
                  Phone (WhatsApp)
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
                <label className="text-sm font-medium text-ink sm:col-span-2">
                  Email <span className="font-normal text-muted">(we&apos;ll email you a code to confirm it)</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
                {/* Spam trap for bots: not displayed at all (display: none), so people, screen readers and
                    browser autofill never reach it. Off-screen alone wasn't enough: autofill filled it. */}
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  name="aod_trap"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="hidden"
                />
              </div>

              {codeSent && (
                <div className="mt-6 rounded-xl border border-brand/40 bg-peach/40 p-4 sm:p-5">
                  <p className="text-sm font-bold text-ink">Confirm your email</p>
                  <p className="mt-1 text-sm text-body">
                    We&apos;ve sent a 6-digit code to <strong className="font-medium text-ink">{cleanEmail}</strong>. Enter it, then press{" "}
                    <strong className="font-medium text-ink">Confirm &amp; send</strong>. This keeps automated orders out, and signs you in to My
                    bookings.
                  </p>
                  <label className="mt-4 block text-sm font-medium text-ink">
                    6-digit code
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && codeOk) sendButton.current?.click();
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      placeholder="••••••"
                      className="mt-1.5 block w-full max-w-[14rem] rounded-xl border border-line bg-white px-4 py-3 text-center text-xl font-normal tracking-[0.5em] outline-none focus:border-brand"
                    />
                  </label>
                  <p className="mt-2 text-xs text-muted">
                    Not in your inbox? Check spam, or{" "}
                    <button type="button" onClick={sendCode} disabled={Boolean(busy)} className="font-medium text-brand underline underline-offset-2">
                      send a new code
                    </button>
                    . Wrong email? Change it above.
                  </p>
                  {!backendEnabled && <p className="mt-2 rounded-lg bg-white p-3 text-xs text-muted">Preview: no email is sent yet. Enter any 6 digits.</p>}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Back
                </button>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  <p className="text-sm text-muted" aria-live="polite">
                    {busy === "save"
                      ? "Saving your request…"
                      : (missing ??
                        (codeSent
                          ? codeOk
                            ? "Code entered. Press Confirm & send."
                            : "Enter the 6-digit code from your email."
                          : verified
                            ? "All set. AOD will reply with curated matches."
                            : "Next, we'll email you a code to confirm it's you."))}
                  </p>
                  {/* A button, not a wa.me link: "open in new tab" or a long press on a link would skip
                      saving and send the request to WhatsApp only. */}
                  <button
                    ref={sendButton}
                    type="button"
                    disabled={!ready}
                    onClick={onSend}
                    className={`inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white ${
                      busy ? "cursor-wait" : ready ? "hover:bg-brand-hover" : "cursor-not-allowed opacity-40"
                    }`}
                  >
                    {busy ? (
                      <>
                        <Spinner className="h-5 w-5" /> {busy === "code" ? "Sending code…" : busy === "verify" ? "Checking…" : "Saving…"}
                      </>
                    ) : verified ? (
                      <>
                        <WhatsAppIcon /> Send on WhatsApp
                      </>
                    ) : codeSent ? (
                      <>
                        <WhatsAppIcon /> Confirm &amp; send
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5" aria-hidden /> Email me a code
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-right text-xs text-muted">
                By sending, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-ink">
                  terms
                </Link>
                ,{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
                  privacy policy
                </Link>{" "}
                and{" "}
                <Link href="/refund-policy" className="underline underline-offset-2 hover:text-ink">
                  refund policy
                </Link>
                .
              </p>
              {codeError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-ink" role="alert">
                  <p>{codeError}</p>
                  {codeFailed && (
                    <p className="mt-2">
                      You can also{" "}
                      <button type="button" onClick={sendUnsaved} className="font-medium text-brand underline underline-offset-2">
                        send your request on WhatsApp
                      </button>{" "}
                      instead; the AOD team will add it for you.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </m.section>
      </AnimatePresence>
    </div>
  );
}

function StepNav({ onBack, onNext, nextDisabled = false }: { onBack?: () => void; onNext?: () => void; nextDisabled?: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
      {onBack ? (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
