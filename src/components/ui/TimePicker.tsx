"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { durationText, time12 } from "@/lib/event-time";

// Scroll-wheel pickers, as on aod.co.in (no icons here: the site has none but search and the
// menu): a field showing the value; tapping it opens wheels under it. `TimeField` has three, hour,
// minutes and AM / PM; `DurationField` has two, hours and minutes ("How Many Hours?"). The
// minute wheels and the time's hour wheel go round without end (…11, 12, 1, 2… and …58, 59, 00, 01…); the middle
// row, on a grey band, is the pick, in orange. Scroll, tap a row or use the arrow keys, then OK;
// Cancel, Escape or a tap outside leave the value as it was. Times are "HH:MM", 24-hour, as the
// rest of the site stores them (src/lib/event-time.ts).

const ITEM = 40; // height of one row, px
const ROWS = 7; // rows on show; the middle one is the pick
const PAD = Math.floor(ROWS / 2) * ITEM; // space above the first row and below the last
const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const periods = ["AM", "PM"];

type Parts = { hour: number; minute: number; period: number }; // indexes into the lists above

function partsOf(t: string): Parts {
  const h = Number(t.slice(0, 2));
  return { hour: (h % 12 || 12) - 1, minute: Number(t.slice(3, 5)), period: h >= 12 ? 1 : 0 };
}

function timeOf({ hour, minute, period }: Parts): string {
  const h = ((hour + 1) % 12) + period * 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function TimeField({
  label,
  value,
  onChange,
  defaultTime = "10:00",
  align = "left",
}: {
  label: string;
  value: string; // "" until picked
  onChange: (time: string) => void; // on OK
  defaultTime?: string; // shown on the wheels when nothing is picked yet
  align?: "left" | "right"; // which edge of the field the wheels line up with
}) {
  const [draft, setDraft] = useState(value || defaultTime);
  const parts = partsOf(draft);
  const set = (p: Partial<Parts>) => setDraft(timeOf({ ...parts, ...p }));

  return (
    <PickerField
      label={label}
      align={align}
      shown={value ? time12(value) : ""}
      onOpen={() => setDraft(value || defaultTime)}
      onOk={() => onChange(draft)}
    >
      <Wheel label="Hour" items={hours} index={parts.hour} loop onPick={(i) => set({ hour: i })} />
      <Wheel label="Minutes" items={minutes} index={parts.minute} loop onPick={(i) => set({ minute: i })} />
      <Wheel label="AM or PM" items={periods} index={parts.period} onPick={(i) => set({ period: i })} />
    </PickerField>
  );
}

// "How Many Hours?": two wheels like the time's, hours (0 to 24) and minutes (00 to 59, going
// round without end). The value is the length in minutes; 0 until picked.
const lengthHours = Array.from({ length: 25 }, (_, i) => `${i} hr`);
const lengthMinutes = Array.from({ length: 60 }, (_, i) => `${String(i).padStart(2, "0")} min`);

export function DurationField({
  label,
  value,
  onChange,
  defaultMinutes = 180,
  align = "left",
}: {
  label: string;
  value: number; // minutes, 0 until picked
  onChange: (minutes: number) => void; // on OK
  defaultMinutes?: number; // shown on the wheels when nothing is picked yet
  align?: "left" | "right"; // a field on the right opens its wheels leftwards, so they stay on screen
}) {
  const [draft, setDraft] = useState(value || defaultMinutes);
  const h = Math.floor(draft / 60);
  const m = draft % 60;

  return (
    <PickerField
      label={label}
      align={align}
      shown={value ? durationText(value) : ""}
      onOpen={() => setDraft(value || defaultMinutes)}
      onOk={() => onChange(draft)}
    >
      <Wheel label="Hours" items={lengthHours} index={h} onPick={(i) => setDraft(i * 60 + m)} width="w-24" />
      <Wheel label="Minutes" items={lengthMinutes} index={m} loop onPick={(i) => setDraft(h * 60 + i)} width="w-24" />
    </PickerField>
  );
}

// The field and the drop-down holding the wheels, shared by TimeField and DurationField.
function PickerField({
  label,
  align,
  shown,
  onOpen,
  onOk,
  children,
}: {
  label: string;
  align: "left" | "right";
  shown: string; // the value as text, "" until picked
  onOpen: () => void;
  onOk: () => void;
  children: ReactNode; // the wheels
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Opening near the bottom of the screen (phones, above the bottom bar): bring the wheels into view.
  useEffect(() => {
    if (!open) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [open]);

  function show() {
    onOpen();
    setOpen(true);
  }
  function close() {
    setOpen(false);
    button.current?.focus();
  }

  // A tap outside or Escape closes without changing the value (as Cancel).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative text-sm text-muted">
      <span id={labelId}>{label}</span>
      <button
        ref={button}
        type="button"
        onClick={() => (open ? setOpen(false) : show())}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-labelledby={`${labelId} ${labelId}-value`}
        className={`mt-2 flex h-12 w-full items-center rounded-lg border bg-paper px-4 text-left text-base outline-none transition-colors ${
          open ? "border-ink" : "border-line hover:border-ink focus-visible:border-ink"
        }`}
      >
        <span id={`${labelId}-value`} className={`tabular-nums ${shown ? "text-ink" : "text-muted"}`}>
          {shown || "Choose"}
        </span>
      </button>

      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()}`}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-30 mt-1 w-full min-w-64 max-w-80 overflow-hidden rounded-xl border border-line bg-paper text-ink shadow-xl scroll-mb-4 max-lg:scroll-mb-[calc(var(--bottom-bar)+1rem)]`}
        >
          <div className="relative flex justify-center gap-2 px-4 pt-3" style={{ height: ITEM * ROWS + 12 }}>
            {/* The grey band across the middle row: the value picked. */}
            <div aria-hidden className="pointer-events-none absolute inset-x-3 rounded-lg bg-wash" style={{ top: 12 + PAD, height: ITEM }} />
            {children}
          </div>
          <div className="flex justify-end gap-1 px-2 py-2">
            <button type="button" onClick={close} className="h-10 rounded-lg px-4 text-[15px] font-medium text-ink hover:bg-wash">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onOk();
                close();
              }}
              className="h-10 rounded-lg px-4 text-[15px] font-medium text-brand hover:bg-wash"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// One wheel. A looping wheel draws its list several times over and, once a scroll settles, jumps
// back to the same row in the middle copy (the rows look the same, so the jump can't be seen),
// which makes it go round without end. The row that settles in the middle is the pick.
const COPIES = 7;

function Wheel({
  label,
  items,
  index,
  loop = false,
  onPick,
  width = "w-16",
}: {
  label: string;
  items: string[];
  index: number;
  loop?: boolean;
  onPick: (i: number) => void;
  width?: string;
}) {
  const n = items.length;
  const copies = loop ? COPIES : 1;
  const base = loop ? n * Math.floor(COPIES / 2) : 0; // first row of the middle copy
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [center, setCenter] = useState(base + index); // the row in the middle right now
  const id = useId();
  const mod = (p: number) => ((p % n) + n) % n;
  const rowAt = (el: HTMLDivElement) => Math.round(el.scrollTop / ITEM);

  // Opening: straight to the picked row of the middle copy.
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = (base + index) * ITEM;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on opening
  }, []);

  // A pick by tap or key: glide the shortest way round to it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const at = rowAt(el);
    if (mod(at) === index) return;
    let step = index - mod(at);
    if (loop && Math.abs(step) > n / 2) step -= Math.sign(step) * n;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: (at + step) * ITEM, behavior: reduce ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the pick changes
  }, [index]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const at = Math.max(0, Math.min(n * copies - 1, rowAt(el)));
    if (at !== center) setCenter(at);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const settled = Math.max(0, Math.min(n * copies - 1, rowAt(el)));
      const i = mod(settled);
      if (loop && Math.floor(settled / n) !== Math.floor(COPIES / 2)) {
        el.scrollTop = (base + i) * ITEM; // back to the middle copy, unseen
        setCenter(base + i);
      }
      if (i !== index) onPick(i);
    }, 120);
  }

  function onKey(e: React.KeyboardEvent) {
    const move = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const next = loop ? mod(index + move) : Math.max(0, Math.min(n - 1, index + move));
    if (next !== index) onPick(next);
  }

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`${id}-${center}`}
      tabIndex={0}
      onScroll={onScroll}
      onKeyDown={onKey}
      className={`relative ${width} snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ink [&::-webkit-scrollbar]:hidden`}
      style={{
        paddingBlock: PAD,
        maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
      }}
    >
      {Array.from({ length: n * copies }, (_, p) => (
        <div
          key={p}
          id={`${id}-${p}`}
          role="option"
          aria-selected={p === center}
          onClick={() => mod(p) !== index && onPick(mod(p))}
          className={`flex snap-center cursor-pointer items-center justify-center whitespace-nowrap tabular-nums transition-colors ${
            p === center ? "text-xl font-semibold text-brand" : "text-base text-muted"
          }`}
          style={{ height: ITEM }}
        >
          {items[mod(p)]}
        </div>
      ))}
    </div>
  );
}
