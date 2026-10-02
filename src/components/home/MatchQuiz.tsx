"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { categories, cities, occasions, type Audience } from "@/content/site";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { whatsappUrl } from "@/lib/whatsapp";

const audienceLabel: Record<Audience, string> = {
  personal: "Personal event",
  business: "Business",
};

const TOTAL = 3;

// Three quick questions, then a pre-filled WhatsApp message to the AOD team.
// `audience` picks the occasion list (personal or business); without it a mixed list is shown.
// Nothing is saved yet — once Supabase is set up, save the request before opening WhatsApp.
export function MatchQuiz({ audience }: { audience?: Audience }) {
  const occasionList = occasions[audience ?? "any"];
  const [step, setStep] = useState(1);
  const [occasion, setOccasion] = useState("");
  const [needs, setNeeds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [city, setCity] = useState(cities[0]);
  const [details, setDetails] = useState("");
  const [opened, setOpened] = useState(false);

  const message = [
    "Hi Artists on Demand! I'd like 3 curated matches.",
    audience && `Booking for: ${audienceLabel[audience]}`,
    `Occasion: ${occasion}`,
    `Looking for: ${needs.join(", ")}`,
    `Date: ${date || "Not fixed yet"}`,
    `City: ${city}`,
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
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
              />
            </label>
            <label className="text-sm font-medium text-ink">
              City
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal outline-none focus:border-brand"
              >
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
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
              href={whatsappUrl(message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpened(true)}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover"
            >
              <WhatsAppIcon /> Send on WhatsApp
            </a>
          </div>
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
