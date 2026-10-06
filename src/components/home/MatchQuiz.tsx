"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { useState, type ReactNode } from "react";
import { Check, MapPin } from "lucide-react";
import { categories, cities, occasions, type Audience } from "@/content/site";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { setCity, useCity } from "@/lib/city";
import { whatsappUrl } from "@/lib/whatsapp";

const audienceLabel: Record<Audience, string> = {
  personal: "Personal event",
  business: "Business",
};

// Earliest bookable date: tomorrow, in the visitor's local time, as YYYY-MM-DD.
// (Today and earlier can't be picked.)
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const group: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.18, delayChildren: 0.05 } } };
const pop: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

// One numbered question. Pops in after the one before it; the number turns into a tick once answered.
function Question({ n, title, done, children }: { n: number; title: string; done: boolean; children: ReactNode }) {
  return (
    <motion.section variants={pop} data-reveal className="border-t border-line pt-6 first:border-0 first:pt-0">
      <h3 className="flex items-center gap-3 text-lg font-medium text-ink sm:text-xl">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
            done ? "bg-brand text-white" : "bg-peach text-brand-hover"
          }`}
        >
          {done ? <Check className="h-4 w-4" aria-hidden /> : n}
        </span>
        {title}
        {done && <span className="sr-only">(answered)</span>}
      </h3>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

// Three quick questions on one card, then a pre-filled WhatsApp message to the AOD team.
// All questions are visible at once and pop in one after another as the card comes into view.
// `audience` picks the occasion list (personal or business); without it a mixed list is shown.
// The city comes from the navbar picker (src/lib/city.ts); if it's already chosen, it isn't asked again.
// Nothing is saved yet — once Supabase is set up, save the request before opening WhatsApp.
export function MatchQuiz({ audience }: { audience?: Audience }) {
  const occasionList = occasions[audience ?? "any"];
  const [occasion, setOccasion] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const city = useCity();
  const minDate = tomorrowISO();
  // YYYY-MM-DD strings compare correctly as text. An empty date means "not fixed yet", which is allowed.
  const dateOk = date === "" || date >= minDate;
  const [changingCity, setChangingCity] = useState(false);
  const [details, setDetails] = useState("");
  const [opened, setOpened] = useState(false);

  const answered = [Boolean(occasion), needs.length > 0, Boolean(city) && dateOk];
  const done = answered.filter(Boolean).length;
  const canSend = answered.every(Boolean);
  const missing = !occasion ? "Pick the occasion." : needs.length === 0 ? "Pick who you need." : !city ? "Choose your city." : !dateOk ? "Choose a date from tomorrow onwards." : null;

  const message = [
    "Hi Artists on Demand! I'd like 3 curated matches.",
    audience && `Booking for: ${audienceLabel[audience]}`,
    `Occasion: ${occasion}`,
    `Looking for: ${needs.join(", ")}`,
    `Date: ${date || "Not fixed yet"}`,
    `City: ${city ?? "Not selected"}`,
    details && `Details: ${details}`,
  ]
    .filter(Boolean)
    .join("\n");

  function toggleNeed(name: string) {
    setNeeds((n) => (n.includes(name) ? n.filter((x) => x !== name) : [...n, name]));
  }

  return (
    <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(38,18,0,0.06)] sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-2xl font-normal sm:text-[2rem] sm:leading-tight">Three quick questions</p>
        <div className="flex items-center gap-2 text-xs text-ink" aria-label={`${done} of 3 answered`}>
          <span>{done} of 3 answered</span>
          {answered.map((a, i) => (
            <span key={i} className={`h-2 rounded-full transition-all duration-500 ${a ? "w-10 bg-brand" : "w-6 bg-line"}`} />
          ))}
        </div>
      </div>

      <motion.div className="mt-8 space-y-6" variants={group} initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.15 }}>
        <Question n={1} title="What's the occasion?" done={answered[0]}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {occasionList.map(({ label, icon }) => (
              <li key={label}>
                <button
                  type="button"
                  aria-pressed={occasion === label}
                  onClick={() => setOccasion(label)}
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
        </Question>

        <Question n={2} title="Who do you need?" done={answered[1]}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          <p className="mt-2 text-xs text-muted">Pick as many as you need.</p>
        </Question>

        <Question n={3} title="When and where?" done={answered[2]}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-ink">
              Event date <span className="font-normal text-muted">(optional)</span>
              <input
                type="date"
                value={date}
                min={minDate}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!dateOk}
                aria-describedby={dateOk ? undefined : "event-date-error"}
                className={`mt-1.5 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-brand ${dateOk ? "border-line" : "border-red-500"}`}
              />
              {!dateOk && (
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
            <label className="text-sm font-medium text-ink sm:col-span-2">
              Anything else? <span className="font-normal text-muted">(optional)</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                placeholder="Guest count, venue, timings, budget…"
                className="mt-1.5 w-full resize-none rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
              />
            </label>
          </div>
        </Question>

        <motion.div variants={pop} data-reveal className="border-t border-line pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted" aria-live="polite">
              {missing ?? "All set. We'll reply with 3 curated matches."}
            </p>
            <a
              href={canSend ? whatsappUrl(message) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!canSend}
              onClick={(e) => (canSend ? setOpened(true) : e.preventDefault())}
              className={`inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white ${
                canSend ? "hover:bg-brand-hover" : "cursor-not-allowed opacity-40"
              }`}
            >
              <WhatsAppIcon /> Send on WhatsApp
            </a>
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
          {opened && (
            <p className="mt-4 rounded-xl bg-wash p-4 text-sm text-ink" role="status">
              WhatsApp opened with your request pre-filled — just tap <strong>send</strong> to reach our team.
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
