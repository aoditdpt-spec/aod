"use client";

import { useState } from "react";

export const MAX_ARTISTS = 20;

// "How many?" as on aod.co.in: 1 to 4 as buttons, then More opens a box for up to 20.
export function CountPicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [more, setMore] = useState(value > 4);
  const cell = (on: boolean) => `h-11 min-w-11 rounded-lg border px-3 text-base tabular-nums transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-ink"}`;
  return (
    <div role="group" aria-label={`How many ${label}`} className="flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={!more && value === n}
          onClick={() => {
            setMore(false);
            onChange(n);
          }}
          className={cell(!more && value === n)}
        >
          {n}
        </button>
      ))}
      {more ? (
        <input
          type="number"
          min={1}
          max={MAX_ARTISTS}
          value={value}
          autoFocus
          onChange={(e) => onChange(Math.max(1, Math.min(MAX_ARTISTS, Number(e.target.value) || 1)))}
          aria-label={`Number of ${label}, up to ${MAX_ARTISTS}`}
          className="h-11 w-[4.5rem] rounded-lg border border-ink px-3 text-base tabular-nums outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setMore(true);
            onChange(Math.max(5, value));
          }}
          className={`${cell(false)} w-[4.5rem]`}
        >
          More
        </button>
      )}
    </div>
  );
}

// "Photographers × 2": one shows the name alone.
export const withCount = (name: string, n: number) => (n > 1 ? `${name} × ${n}` : name);
