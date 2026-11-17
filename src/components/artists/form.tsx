"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { isOtherCity, otherCityName, OTHER_CITY, withOtherCity } from "@/content/artist-portal";
import { cities } from "@/content/site";

// Form building blocks for the artist portal, styled like the booking questions (MatchQuiz).

export const inputBase =
  "w-full rounded-xl border border-line bg-white px-4 py-3 font-normal text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-brand aria-[invalid=true]:border-red-500";
export const inputClass = `mt-1.5 ${inputBase}`;

// A white card with an optional heading, used for every block of portal content.
export function Panel({
  title,
  text,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[1.25rem] border border-line bg-white p-5 sm:p-7 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-lg font-bold text-ink sm:text-xl">{title}</h2>}
            {text && <p className="mt-1 text-sm text-muted">{text}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Label + control + hint/error. Wrap any input in it.
export function Field({
  label,
  optional,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium text-ink ${className}`}>
      {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-normal text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs font-normal text-muted">{hint}</span>
      )}
    </label>
  );
}

// The city list, with "Other city in Gujarat" opening a box to write the city's name.
export function CitySelect({ value, onChange, invalid }: { value: string; onChange: (city: string) => void; invalid?: boolean }) {
  const other = isOtherCity(value);
  return (
    <>
      <select value={other ? OTHER_CITY : value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid} className={inputClass}>
        <option value="">Choose…</option>
        {cities.map((c) => (
          <option key={c}>{c}</option>
        ))}
        <option value={OTHER_CITY}>{OTHER_CITY}</option>
      </select>
      {other && (
        <input
          value={otherCityName(value)}
          onChange={(e) => onChange(withOtherCity(e.target.value))}
          placeholder="Please specify your city"
          aria-label="Please specify your city"
          aria-invalid={invalid}
          autoFocus={value === OTHER_CITY}
          className={inputClass}
        />
      )}
    </>
  );
}

// Pick one or many from a list of options, shown as toggle chips.
export function ChipGroup({
  options,
  value,
  onChange,
  multiple = true,
  label,
  selectAll = false,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  label: string;
  selectAll?: boolean; // a "Select all" chip first (for lists of several choices)
}) {
  // "Select all" ticks every real choice; "Other" and "None" stay the person's own call.
  const all = options.filter((o) => o !== "Other" && o !== "None");
  const allOn = all.length > 0 && all.every((o) => value.includes(o));
  return (
    <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-2">
      {multiple && selectAll && all.length > 1 && (
        <button
          type="button"
          aria-pressed={allOn}
          onClick={() => onChange(allOn ? value.filter((v) => !all.includes(v)) : [...value, ...all.filter((o) => !value.includes(o))])}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors ${
            allOn ? "border-brand bg-peach/50 text-ink" : "border-brand/60 bg-white text-brand hover:bg-wash"
          }`}
        >
          {allOn && <Check className="h-3.5 w-3.5 text-brand" aria-hidden />}
          Select all
        </button>
      )}
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(multiple ? (on ? value.filter((v) => v !== o) : [...value, o]) : [o])}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-normal transition-colors ${
              on ? "border-brand bg-peach/50 text-ink" : "border-line bg-white text-body hover:border-brand/50"
            }`}
          >
            {on && <Check className="h-3.5 w-3.5 text-brand" aria-hidden />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

// A checkbox with a sentence next to it (agreements).
export function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm text-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
      />
      <span>{children}</span>
    </label>
  );
}

// Small coloured status label.
export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "brand" | "good" | "wait"; children: ReactNode }) {
  const tones = {
    neutral: "bg-wash text-muted",
    brand: "bg-peach text-brand-hover",
    good: "bg-emerald-50 text-emerald-700",
    wait: "bg-amber-50 text-amber-700",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
