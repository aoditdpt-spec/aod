"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { categories, cities, occasions, type Audience } from "@/content/site";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { setCity, useCity } from "@/lib/city";
import { whatsappUrl } from "@/lib/whatsapp";

const audienceLabel: Record<Audience, string> = {
  personal: "Personal event",
  business: "Business",
};

const TOTAL = 3;

// Earliest bookable date: tomorrow, in the visitor's local time, as YYYY-MM-DD.
// (Today and earlier can't be picked.)
function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Three quick questions, then a pre-filled WhatsApp message to the AOD team.
// `audience` picks the occasion list (personal or business); without it a mixed list is shown.
// The city comes from the navbar picker (src/lib/city.ts); if it's already chosen, it isn't asked again.
// Nothing is saved yet — once Supabase is set up, save the request before opening WhatsApp.
export function MatchQuiz({ audience }: { audience?: Audience }) {
  const occasionList = occasions[audience ?? "any"];
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const city = useCity();
  const minDate = tomorrowISO();
  // YYYY-MM-DD strings compare correctly as text. An empty date means "not fixed yet", which is allowed.
  const dateOk = date === "" || date >= minDate;
  const canSend = Boolean(city) && dateOk;
  const [changingCity, setChangingCity] = useState(false);
  const [details, setDetails] = useState("");
  const [opened, setOpened] = useState(false);

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

  const questions = {
    1: "What's the occasion?",
    2: "Who do you need?",
    3: "When and where?",
  } as const;

  return (
    <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(38,18,0,0.06)] sm:p-10">
      <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-start">
        <h3 className="max-w-[18.75rem] text-2xl font-normal sm:text-[2rem] sm:leading-tight">
          {questions[step as 1 | 2 | 3]}
        </h3>
        <div className="flex items-center gap-2 text-xs text-ink" aria-label={`Question ${step} of ${TOTAL}`}>
          <span>
            Question {step} of {TOTAL}
          </span>
          {Array.from({ length: TOTAL }, (_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all ${i < step ? "w-14 bg-brand" : "w-6 bg-line"}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {occasionList.map(({ label, icon }) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => {
                  setOccasion(label);
                  setStep(2);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-4 py-4 text-left text-sm font-medium text-ink transition-colors hover:bg-peach/60 ${
                  occasion === label ? "bg-peach" : "bg-wash"
                }`}
              >
                <Icon name={icon} className="h-4 w-4 shrink-0 text-brand" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {step === 2 && (
        <>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
          <QuizNav onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={needs.length === 0} />
        </>
      )}

      {step === 3 && (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-ink">
              Event date
              <input
                type="date"
                value={date}
                min={minDate}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={!dateOk}
                aria-describedby={dateOk ? undefined : "event-date-error"}
                className={`mt-1.5 w-full rounded-xl border px-4 py-3 font-normal outline-none focus:border-brand ${
                  dateOk ? "border-line" : "border-red-500"
                }`}
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
                  <button
                    type="button"
                    onClick={() => setChangingCity(true)}
                    className="text-sm font-medium text-brand underline-offset-4 hover:underline"
                  >
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

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </button>
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
          {!city && <p className="mt-3 text-right text-sm text-muted">Choose your city to continue.</p>}
          {opened && (
            <p className="mt-4 rounded-xl bg-wash p-4 text-sm text-ink" role="status">
              WhatsApp opened with your request pre-filled — just tap <strong>send</strong> to reach our team.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function QuizNav({ onBack, onNext, nextDisabled }: { onBack: () => void; onNext: () => void; nextDisabled: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
