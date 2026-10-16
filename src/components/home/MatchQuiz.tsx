"use client";

import Link from "next/link";
import { AnimatePresence, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, X } from "lucide-react";
import { categories, cities, occasions, type Audience } from "@/content/site";
import { CountPicker } from "@/components/ui/CountPicker";
import { Spinner } from "@/components/ui/Spinner";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { setCity, useCity } from "@/lib/city";
import { backendEnabled } from "@/lib/backend";
import { needsText, withCount } from "@/lib/booking-needs";
import { durationText, endsNextDay, eventMinutes, timeRange } from "@/lib/event-time";
import { addSentRequest, newRequestRef } from "@/lib/customer-store";
import { whatsappUrl } from "@/lib/whatsapp";
import { createBookingRequest } from "@/server/actions/public";

const audienceLabel: Record<Audience, string> = {
  personal: "Personal event",
  business: "Business",
};

const titles = ["What's the occasion?", "Who do you need?", "When and where?"];

const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

// One category the customer needs, and how many artists of it.
type Need = { slug: string; count: number };

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
// "Who do you need?" takes any number of categories and how many artists of each (1 to 4, or "More"
// for up to 20). A category page passes its own category in `initialNeeds`, already picked.
// With the backend set up, "Send" saves the request first (createBookingRequest) and only then
// says "received" and opens WhatsApp with its reference. Without it (preview) the request is kept
// in this browser for My bookings and WhatsApp opens straight away.
export function MatchQuiz({ audience, initialNeeds = [] }: { audience?: Audience; initialNeeds?: string[] }) {
  const occasionList = occasions[audience ?? "any"];
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [needs, setNeeds] = useState<Need[]>(() => initialNeeds.map((slug) => ({ slug, count: 1 })));
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
    `Looking for: ${needsText(needs.map((n) => ({ name: categoryName(n.slug), count: n.count })))}`,
    `Date: ${date || "Not fixed yet"}`,
    startTime && endTime && `Time: ${timeRange(startTime, endTime)}`,
    `City: ${city ?? "Not selected"}`,
    details && `Details: ${details}`,
    name.trim() && `Name: ${name.trim()}`,
    phone.trim() && `Phone: ${phone.trim()}`,
    email.trim() && `Email: ${email.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  function toggleNeed(slug: string) {
    setNeeds((list) => (list.some((n) => n.slug === slug) ? list.filter((n) => n.slug !== slug) : [...list, { slug, count: 1 }]));
  }
  function setCount(slug: string, count: number) {
    setNeeds((list) => list.map((n) => (n.slug === slug ? { ...n, count } : n)));
  }
  // "Photographers × 3, Musicians & DJs": for the answer chip and this browser's request list.
  const needLabels = needs.map((n) => withCount(categoryName(n.slug), n.count));

  // Answers given so far, shown above the current question.
  const summary = [
    step > 0 && occasion ? { label: occasion, to: 0 } : null,
    step > 1 && needs.length ? { label: needLabels.join(", "), to: 1 } : null,
  ].filter((x): x is { label: string; to: number } => x !== null);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_6%,transparent)] sm:p-10">
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
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium text-ink transition-colors ${
                          need ? "bg-peach ring-2 ring-brand" : "bg-wash hover:bg-peach/60"
                        }`}
                      >
                        {c.name}
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

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <button type="button" onClick={() => go(1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Back
                </button>
                <div className="flex flex-wrap items-center justify-end gap-4">
                  <p className="text-sm text-muted" aria-live="polite">
                    {sending ? "Saving your request…" : (missing ?? "All set. AOD will reply with curated matches.")}
                  </p>
                  {/* A button, not a wa.me link: "open in new tab" or a long press on a link would skip
                      saving and send the request to WhatsApp only. */}
                  <button
                    type="button"
                    disabled={!canSend}
                    onClick={async () => {
                      if (!canSend) return;
                      if (!backendEnabled) {
                        // Preview: remember the request in this browser so it shows under My bookings,
                        // with a reference the team can quote back.
                        const ref = newRequestRef();
                        addSentRequest({ id: ref, sentAt: new Date().toISOString(), audience, occasion, needs: needLabels, date, city: city ?? "", details });
                        window.open(whatsappUrl([message, `Ref: ${ref}`].join("\n")), "_blank", "noopener,noreferrer");
                        setOpened(true);
                        return;
                      }
                      // Live: open the WhatsApp tab now (inside the click, so it isn't blocked as a pop-up),
                      // save the request, then point the tab at WhatsApp with the saved reference.
                      const tab = window.open("", "_blank");
                      setSending(true);
                      setSaveError(null);
                      const input = { audience, occasion, needs: needs.map((n) => ({ category: n.slug, count: n.count })), date, startTime, endTime, city: city ?? "", details, name, phone, email, website };
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
                      setSending(false);
                      // When it wasn't saved, the message says so: the team then pastes it into the admin's New booking.
                      const url = whatsappUrl([message, res.ok ? `Ref: ${res.ref}` : "Ref: not saved on the website"].join("\n"));
                      if (res.ok) setSaved(res.ref);
                      else setSaveError(res.error);
                      if (tab) {
                        tab.opener = null;
                        tab.location.href = url;
                      } else window.open(url, "_blank", "noopener,noreferrer");
                      setOpened(true);
                    }}
                    className={`inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white ${
                      sending ? "cursor-wait" : canSend ? "hover:bg-brand-hover" : "cursor-not-allowed opacity-40"
                    }`}
                  >
                    {sending ? (
                      <>
                        <Spinner className="h-5 w-5" /> Saving…
                      </>
                    ) : (
                      <>
                        <WhatsAppIcon /> Send on WhatsApp
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
        </m.section>
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
