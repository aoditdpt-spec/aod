"use client";

import { useId, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { cities } from "@/content/site";
import { setCity, useCity } from "@/lib/city";

// Navbar location button: opens a list of the cities AOD serves and remembers the choice.
export function CityPicker() {
  const city = useCity();
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={`flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:border-brand ${
          city ? "border-line text-body" : "border-brand/50 text-brand"
        }`}
      >
        <MapPin className="h-4 w-4 text-brand" aria-hidden />
        {city ?? "Select city"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Choose your city"
          className="absolute left-0 top-full z-50 mt-2 w-56 rounded-card border border-line bg-white p-1.5 shadow-xl"
        >
          <li className="px-3 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wider text-muted">We serve</li>
          {cities.map((c) => (
            <li key={c} role="option" aria-selected={c === city}>
              <button
                type="button"
                onClick={() => {
                  setCity(c);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-wash ${
                  c === city ? "font-medium text-brand" : "text-ink"
                }`}
              >
                {c}
                {c === city && <Check className="h-4 w-4" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Compact version for the mobile menu: the cities as tappable chips.
export function CityChips() {
  const city = useCity();
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
        <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden /> Your city
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {cities.map((c) => (
          <li key={c}>
            <button
              type="button"
              aria-pressed={c === city}
              onClick={() => setCity(c)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                c === city ? "border-brand bg-peach/60 font-medium text-ink" : "border-line text-body hover:border-brand"
              }`}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
