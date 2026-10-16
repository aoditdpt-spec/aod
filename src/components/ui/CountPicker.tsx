"use client";

import { useId, useRef, useState } from "react";
import { MAX_ARTISTS, quickCounts } from "@/lib/booking-needs";

// "How many?": 1 to 4 as buttons, then "More" opens a box for any number up to MAX_ARTISTS (20).
// Used for each category in the booking quiz and the admin's New booking form.
export function CountPicker({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  label: string; // what is being counted, for screen readers: "photographers"
  size?: "sm" | "md";
}) {
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState<string | null>(null); // what's typed in the box, while typing
  const [tooMany, setTooMany] = useState(false);
  const box = useRef<HTMLInputElement>(null);
  const hint = useId();
  // A number above 4 set from outside (a pasted WhatsApp message) opens the box too.
  const boxOpen = custom || value > quickCounts.length;
  const cell = size === "sm" ? "h-8 min-w-8 text-xs" : "h-10 min-w-10 text-sm";
  const tone = (on: boolean) =>
    on ? "bg-brand text-white ring-1 ring-brand" : "bg-white text-ink ring-1 ring-line hover:ring-brand";

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`How many ${label}`}>
      {quickCounts.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={!boxOpen && value === n}
          onClick={() => {
            setCustom(false);
            setTooMany(false);
            onChange(n);
          }}
          className={`${cell} rounded-lg px-2 font-medium transition-colors ${tone(!boxOpen && value === n)}`}
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        aria-pressed={boxOpen}
        onClick={() => {
          setCustom(true);
          if (value <= quickCounts.length) onChange(quickCounts.length + 1);
          // Once the box is on screen, put the cursor in it with the number selected to type over.
          requestAnimationFrame(() => box.current?.select());
        }}
        className={`${cell} rounded-lg px-3 font-medium transition-colors ${tone(boxOpen)}`}
      >
        More
      </button>
      {boxOpen && (
        <span className="flex items-center gap-2">
          <input
            ref={box}
            value={draft ?? String(value)}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
              setDraft(digits);
              const n = Number(digits);
              setTooMany(n > MAX_ARTISTS);
              if (n >= 1) onChange(Math.min(n, MAX_ARTISTS));
            }}
            onBlur={() => setDraft(null)}
            inputMode="numeric"
            aria-label={`Number of ${label}`}
            aria-describedby={hint}
            aria-invalid={tooMany}
            className={`${size === "sm" ? "h-8 w-12 text-xs" : "h-10 w-14 text-sm"} rounded-lg border px-2 text-center font-medium text-ink outline-none focus:border-brand ${tooMany ? "border-red-500" : "border-line"}`}
          />
          <span id={hint} className={`text-xs ${tooMany ? "text-red-600" : "text-muted"}`} aria-live="polite">
            {tooMany ? `${MAX_ARTISTS} at most. Need more? Say so in the details.` : `Up to ${MAX_ARTISTS}`}
          </span>
        </span>
      )}
    </div>
  );
}
