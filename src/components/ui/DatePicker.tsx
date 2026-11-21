"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

// A calendar in a popup, in the style of Untitled UI's date picker (on request, 2026-11-21):
// the month with arrows either side, the days in a grid (the picked one a filled orange circle,
// today marked with a dot, days before `min` greyed out), and under it the picked date with
// Cancel and Apply. Dates are "YYYY-MM-DD" in the visitor's own time, like the rest of the site.
// Escape or a tap outside closes it without a change.

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function DatePickerDialog({ open, value, min, onApply, onClose }: { open: boolean; value: string; min: string; onApply: (date: string) => void; onClose: () => void }) {
  return createPortalSafe(
    <AnimatePresence>
      {open && (
        <motion.div
          key="date-picker"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <Calendar value={value} min={min} onApply={onApply} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>,
  );
}

function createPortalSafe(node: React.ReactNode) {
  return typeof document === "undefined" ? null : createPortal(node, document.body);
}

function Calendar({ value, min, onApply, onClose }: { value: string; min: string; onApply: (date: string) => void; onClose: () => void }) {
  const first = value || min || keyOf(new Date());
  const [draft, setDraft] = useState(value);
  const [month, setMonth] = useState(() => {
    const d = fromKey(first);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  const today = keyOf(new Date());
  const minMonth = min ? new Date(fromKey(min).getFullYear(), fromKey(min).getMonth(), 1) : null;
  const canGoBack = !minMonth || month > minMonth;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = before;
    };
  }, []);

  // The grid: blanks before the 1st (weeks start on Monday), then every day of the month.
  const lead = (month.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => keyOf(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const picked = draft ? fromKey(draft).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <motion.div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label="Pick a date"
      tabIndex={-1}
      initial={{ y: 16, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ y: 8, opacity: 0, transition: { duration: 0.15 } }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-[340px] rounded-2xl border border-line bg-paper shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] outline-none"
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} disabled={!canGoBack} aria-label="Previous month" className="grid h-9 w-9 place-items-center rounded-lg text-ink transition-colors hover:bg-wash disabled:opacity-30">
            <Chevron dir="left" />
          </button>
          <p className="text-base font-medium" aria-live="polite">
            {month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <button type="button" onClick={() => shift(1)} aria-label="Next month" className="grid h-9 w-9 place-items-center rounded-lg text-ink transition-colors hover:bg-wash">
            <Chevron dir="right" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-muted">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1.5">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
          {cells.map((k, i) => {
            if (!k) return <span key={`b${i}`} />;
            const off = !!min && k < min;
            const on = k === draft;
            return (
              <button
                key={k}
                type="button"
                disabled={off}
                aria-pressed={on}
                aria-label={fromKey(k).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                onClick={() => setDraft(k)}
                className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full tabular-nums transition-colors ${on ? "bg-brand font-medium text-white" : off ? "text-muted/50" : "text-ink hover:bg-wash"}`}
              >
                {Number(k.slice(8))}
                {k === today && !on && <i className="absolute bottom-1.5 h-1 w-1 rounded-full bg-brand" />}
              </button>
            );
          })}
        </div>
      </div>

      <p className="truncate border-t border-line px-5 py-4 text-sm" aria-live="polite">
        {picked ? <span className="font-medium text-ink">{picked}</span> : <span className="text-muted">Select A Date</span>}
      </p>
      <div className="grid grid-cols-2 gap-3 px-5 pb-5">
        <button type="button" onClick={onClose} className="h-10 rounded-lg border border-line text-sm font-medium text-ink transition-colors hover:border-ink">
          Cancel
        </button>
        <button type="button" disabled={!draft} onClick={() => draft && onApply(draft)} className="h-10 rounded-lg bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-40">
          Apply
        </button>
      </div>
    </motion.div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}
