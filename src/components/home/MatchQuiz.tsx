"use client";

import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { categories, cities, occasions, type Audience } from "@/content/site";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { setCity, useCity } from "@/lib/city";
import { backendEnabled } from "@/lib/backend";
import { durationText, endsNextDay, eventMinutes, timeRange } from "@/lib/event-time";
import { addSentRequest, newRequestRef } from "@/lib/customer-store";
import { whatsappUrl } from "@/lib/whatsapp";
import { createBookingRequest } from "@/server/actions/public";

const audienceLabel: Record<Audience, string> = {
  personal: "Personal event",
  business: "Business",
};

const titles = ["What's the occasion?", "Who do you need?", "When and where?"];

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

// Three quick questions, one at a time, then a pre-filled WhatsApp message to the AOD team.
// Picking the occasion moves straight on; the answers so far show as chips that jump back to edit.
// `audience` picks the occasion list (personal or business); without it a mixed list is shown.
// The city comes from the navbar picker (src/lib/city.ts); if it's already chosen, it isn't asked again.
// With the backend set up, "Send" saves the request first (createBookingRequest) and only then
// says "received" and opens WhatsApp with its reference. Without it (preview) the request is kept
// in this browser for My bookings and WhatsApp opens straight away.
export function MatchQuiz({ audience }: { audience?: Audience }) {
  const occasionList = occasions[audience ?? "any"];
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const city = useCity();
  const minDate = tomorrowISO();
  // YYYY-MM-DD strings compare correctly as text. Every detail is required.
  const dateOk = date !== "" && date >= minDate;
  const length = eventMinutes(startTime, endTime);
  const [changingCity, setChangingCity] = useState(false);
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: hidden, only bots fill it in
  const [opened, setOpened] = useState(false);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState<string | null>(null); // the request reference, once saved
  const [saveError, setSaveError] = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const nameOk = name.trim().length >= 2;
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const detailsOk = details.trim().length >= 3;
  const canSend =
    Boolean(occasion) && needs.length > 0 && Boolean(city) && dateOk && length !== null && detailsOk && nameOk && phoneOk && emailOk && !sending;
  const missing = !dateOk
    ? date
      ? "Choose a date from tomorrow onwards."
      : "Choose the event date."
    : !city
      ? "Choose your city."
      : !startTime || !endTime
        ? "Add the start and end time."
        : length === null
          ? "Start and end can't be the same time."
          : !detailsOk
            ? "Add a few event details."
            : !nameOk
              ? "Add your name."
              : !phoneOk
                ? "Add your phone number."
                : !emailOk
                  ? "Add your email address."
                  : null;

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
    `Occasion: ${occasion}`,
    `Looking for: ${needs.join(", ")}`,
    `Date: ${date || "Not fixed yet"}`,
    startTime && endTime && `Time: ${timeRange(startTime, endTime)}`,
    `City: ${city ?? "Not selected"}`,
    details && `Details: ${details}`,
    name.trim() && `Name: ${name.trim()}`,
    email.trim() && `Email: ${email.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  function toggleNeed(name: string) {
    setNeeds((n) => (n.includes(name) ? n.filter((x) => x !== name) : [...n, name]));
  }

  // Answers given so far, shown above the current question.
  const summary = [
    step > 0 && occasion ? { label: occasion, to: 0 } : null,
    step > 1 && needs.length ? { label: needs.join(", "), to: 1 } : null,
  ].filter((x): x is { label: string; to: number } => x !== null);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(40,28,21,0.06)] sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">Three quick questions</p>
        <div className="flex items-center gap-2 text-xs text-ink" aria-label={`Question ${step + 1} of 3`}>
          <span>Question {step + 1} of 3</span>
          {titles.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all duration-500 ${i <= step ? "w-10 bg-brand" : "w-6 bg-line"}`} />
          ))}
        </div>
      </div>

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
        <motion.section
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
          <h3 ref={heading} tabIndex={-1} className="text-2xl font-normal text-ink outline-none sm:text-[2rem] sm:leading-tight">
            {titles[step]}
          </h3>

          {step === 0 && (
            <>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {occasionList.map(({ label, icon }) => (
                  <li key={label}>
                    <button
                      type="button"
                      aria-pressed={occasion === label}
                      onClick={() => {
                        setOccasion(label);
                        go(1);
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
              <p className="mt-4 text-xs text-muted">Pick one to continue.</p>
            </>
          )}

          {step === 1 && (
            <>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map((c) => {
                  const on = needs.includes(c.name);
                  return (
                    <li key={c.slug}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleNeed(c.name)}
                        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-ink transition-colors ${
                          on ? "bg-peach ring-2 ring-brand" : "bg-wash hover:bg-peach/60"
                        }`}
                      >
                        {c.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted">Pick as many as you need.</p>
              <StepNav onBack={() => go(0)} onNext={() => go(2)} nextDisabled={needs.length === 0} />
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
                    onChange={(e) => setDate(e.target.value)}
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
                  Start time
                  <input
                    type="time"
                    step={900}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
                <label className="text-sm font-medium text-ink">
                  End time
                  <input
                    type="time"
                    step={900}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
                {length !== null && (
                  <p className="-mt-2 text-sm text-ink sm:col-span-2" aria-live="polite">
                    {timeRange(startTime, endTime).replace(/ \(.*\)$/, "")} ·{" "}
                    <strong className="font-medium">
                      {durationText(length)}
                      {endsNextDay(startTime, endTime) ? ", ends next day" : ""}
                    </strong>
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
                  Email <span className="font-normal text-muted">(for updates and My bookings)</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
                  />
                </label>
                {/* Honeypot for bots: hidden from people and screen readers. */}
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute -left-[9999px] h-px w-px opacity-0"
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Back
                </button>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  <p className="text-sm text-muted" aria-live="polite">
                    {sending ? "Saving your request…" : (missing ?? "All set. AOD will reply with curated matches.")}
                  </p>
                  <a
                    href={canSend ? whatsappUrl(message) : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!canSend}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (!canSend) return;
                      if (!backendEnabled) {
                        // Preview: remember the request in this browser so it shows under My bookings,
                        // with a reference the team can quote back.
                        const ref = newRequestRef();
                        addSentRequest({ id: ref, sentAt: new Date().toISOString(), audience, occasion, needs, date, city: city ?? "", details });
                        window.open(whatsappUrl([message, `Ref: ${ref}`].join("\n")), "_blank", "noopener,noreferrer");
                        setOpened(true);
                        return;
                      }
                      // Live: open the WhatsApp tab now (inside the click, so it isn't blocked as a pop-up),
                      // save the request, then point the tab at WhatsApp with the saved reference.
                      const tab = window.open("", "_blank");
                      setSending(true);
                      setSaveError(null);
                      const res = await createBookingRequest({ audience, occasion, needs, date, startTime, endTime, city: city ?? "", details, name, phone, email, website });
                      setSending(false);
                      const url = whatsappUrl(res.ok ? [message, `Ref: ${res.ref}`].join("\n") : message);
                      if (res.ok) setSaved(res.ref);
                      else setSaveError(res.error);
                      if (tab) {
                        tab.opener = null;
                        tab.location.href = url;
                      } else window.open(url, "_blank", "noopener,noreferrer");
                      setOpened(true);
                    }}
                    className={`inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white ${
                      canSend ? "hover:bg-brand-hover" : "cursor-not-allowed opacity-40"
                    }`}
                  >
                    <WhatsAppIcon /> Send on WhatsApp
                  </a>
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
              {saved && (
                <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-ink" role="status">
                  <strong>Request received · Ref {saved}.</strong> WhatsApp opened with it pre-filled; tap <strong>send</strong> to chat with
                  the AOD team.{" "}
                  Track it under{" "}
                  <Link href="/my-bookings" className="font-medium text-brand underline underline-offset-2">
                    My bookings
                  </Link>{" "}
                  by signing in with {email.trim()}.
                </p>
              )}
              {saveError && (
                <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-ink" role="alert">
                  {saveError} WhatsApp opened with your request; tap <strong>send</strong> so the AOD team gets it.
                </p>
              )}
              {opened && !backendEnabled && (
                <p className="mt-4 rounded-xl bg-wash p-4 text-sm text-ink" role="status">
                  WhatsApp opened with your request pre-filled — just tap <strong>send</strong> to reach our team. You can find this
                  request later under{" "}
                  <Link href="/my-bookings" className="font-medium text-brand underline underline-offset-2">
                    My bookings
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

function StepNav({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
