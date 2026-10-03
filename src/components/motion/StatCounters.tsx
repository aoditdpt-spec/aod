"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Star } from "lucide-react";

// Four different number animations for the "Trusted across Gujarat" stats.
//
// Every counter renders its real, final value on the server (for crawlers, no-JS
// visitors and reduce-motion users). After hydration it quietly rewinds to its start
// value — the stat card is still hidden at that point (it fades in on scroll) — and
// plays when scrolled into view.

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function useRun(ref: RefObject<Element | null>) {
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.5 });
  return { reduce, run: inView && !reduce };
}

// Runs `fn` on the next frame after mount (rewinding to the start value), unless motion is reduced.
function useRewind(reduce: boolean | null, fn: () => void) {
  const fnRef = useRef(fn);
  useEffect(() => {
    if (reduce) return;
    const raf = requestAnimationFrame(() => fnRef.current());
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
}

/* 1. Odometer — like a live subscriber count: starts at a random lower number and
      ticks up in shrinking steps, each digit rolling into place. */
export function OdometerStat({ value }: { value: string }) {
  const [, digitsPart, suffix] = value.match(/^(\d+)(.*)$/) ?? ["", "0", ""];
  const target = Number(digitsPart);
  const ref = useRef<HTMLSpanElement>(null);
  const { reduce, run } = useRun(ref);
  const [n, setN] = useState(target);
  const nRef = useRef(target);

  useRewind(reduce, () => {
    nRef.current = Math.round(target * (0.45 + Math.random() * 0.3));
    setN(nRef.current);
  });

  useEffect(() => {
    if (!run) return;
    let timer = 0;
    const tick = () => {
      const cur = nRef.current;
      if (cur >= target) return;
      const remaining = target - cur;
      const next = Math.min(target, cur + Math.max(1, Math.round(remaining * (0.1 + Math.random() * 0.12))));
      nRef.current = next;
      setN(next);
      // Fast at first, then slower near the end, like a live counter settling.
      timer = window.setTimeout(tick, remaining > 25 ? 110 : remaining > 6 ? 220 : 380);
    };
    timer = window.setTimeout(tick, 250);
    return () => window.clearTimeout(timer);
  }, [run, target]);

  const digits = String(n).split("");
  return (
    <span ref={ref} aria-label={value} className="inline-flex items-center leading-none tabular-nums">
      {digits.map((d, i) => (
        // Key from the right, so the ones column stays the same element as numbers grow.
        <DigitColumn key={digits.length - i} digit={Number(d)} />
      ))}
      <span aria-hidden className="text-brand">
        {suffix}
      </span>
    </span>
  );
}

function DigitColumn({ digit }: { digit: number }) {
  return (
    <span aria-hidden className="relative inline-block h-[1em] w-[0.62em] overflow-hidden">
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit}em` }}
        transition={{ type: "spring", stiffness: 170, damping: 22 }}
      >
        {Array.from({ length: 10 }, (_, k) => (
          <span key={k} className="block h-[1em] text-center leading-[1em]">
            {k}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/* 2. Rating — the number climbs from 0.0 while five stars fill one after another. */
export function RatingStat({ value }: { value: string }) {
  const target = Number(value);
  const ref = useRef<HTMLSpanElement>(null);
  const { reduce, run } = useRun(ref);
  const mv = useMotionValue(target);
  const text = useTransform(mv, (v) => v.toFixed(1));

  useRewind(reduce, () => mv.set(0));

  useEffect(() => {
    if (!run) return;
    const controls = animate(mv, target, { duration: 2, ease: EASE_OUT, delay: 0.2 });
    return () => controls.stop();
  }, [run, mv, target]);

  return (
    <span ref={ref} className="flex flex-col items-center gap-2">
      <span aria-label={value} className="leading-none tabular-nums">
        <motion.span aria-hidden>{text}</motion.span>
      </span>
      <span aria-hidden className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <StarFill key={i} index={i} rating={mv} />
        ))}
      </span>
    </span>
  );
}

function StarFill({ index, rating }: { index: number; rating: MotionValue<number> }) {
  const width = useTransform(rating, (v) => `${Math.min(1, Math.max(0, v - index)) * 100}%`);
  return (
    <span className="relative inline-block h-5 w-5">
      <Star className="absolute inset-0 h-5 w-5 text-line" strokeWidth={1.5} />
      <motion.span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width }}>
        <Star className="h-5 w-5 fill-brand-bright text-brand-bright" strokeWidth={1.5} />
      </motion.span>
    </span>
  );
}

/* 3. Split-flap — airport-board tiles flipping 00 → 01 → … → 10. */
export function FlipStat({ value }: { value: string }) {
  const target = Number(value);
  const width = value.length;
  const ref = useRef<HTMLSpanElement>(null);
  const { reduce, run } = useRun(ref);
  const [n, setN] = useState(target);
  const nRef = useRef(target);
  const [started, setStarted] = useState(false);

  useRewind(reduce, () => {
    nRef.current = 0;
    setN(0);
    setStarted(true);
  });

  useEffect(() => {
    if (!run) return;
    let timer = 0;
    const tick = () => {
      if (nRef.current >= target) return;
      nRef.current += 1;
      setN(nRef.current);
      timer = window.setTimeout(tick, 150);
    };
    timer = window.setTimeout(tick, 300);
    return () => window.clearTimeout(timer);
  }, [run, target]);

  const cur = String(n).padStart(width, "0").split("");
  const prev = String(Math.max(0, n - 1)).padStart(width, "0").split("");

  return (
    <span ref={ref} aria-label={value} className="inline-flex gap-1.5">
      {cur.map((d, i) => (
        <FlapDigit key={`${i}-${d}`} cur={d} prev={prev[i]} animated={started && d !== prev[i]} />
      ))}
    </span>
  );
}

function FlapDigit({ cur, prev, animated }: { cur: string; prev: string; animated: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-block h-[1.2em] w-[0.85em] rounded-lg bg-night text-white shadow-[0_6px_16px_-6px_rgba(38,18,0,0.5)] [perspective:240px]"
    >
      <Half side="top">{cur}</Half>
      <Half side="bottom">{animated ? prev : cur}</Half>
      {animated && (
        <>
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 origin-bottom [backface-visibility:hidden]"
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -90 }}
            transition={{ duration: 0.16, ease: "easeIn" }}
          >
            <Half side="top" flat>
              {prev}
            </Half>
          </motion.span>
          <motion.span
            className="absolute inset-x-0 bottom-0 h-1/2 origin-top [backface-visibility:hidden]"
            initial={{ rotateX: 90 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.16, ease: "easeOut", delay: 0.16 }}
          >
            <Half side="bottom" flat>
              {cur}
            </Half>
          </motion.span>
        </>
      )}
      <span className="absolute inset-x-0 top-1/2 h-px bg-black/50" />
    </span>
  );
}

// One half of a flap tile: shows the top or bottom half of the digit.
function Half({ side, children, flat = false }: { side: "top" | "bottom"; children: string; flat?: boolean }) {
  return (
    <span
      className={`${flat ? "relative h-full" : `absolute inset-x-0 h-1/2 ${side === "top" ? "top-0" : "bottom-0"}`} block overflow-hidden ${
        side === "top" ? "rounded-t-lg bg-night" : "rounded-b-lg bg-night-soft"
      }`}
    >
      <span
        className="absolute inset-x-0 block h-[1.2em] text-center leading-[1.2em]"
        style={{ top: side === "top" ? 0 : "-100%" }}
      >
        {children}
      </span>
    </span>
  );
}

/* 4. Zero drama — a drama meter drains from 99 to 0, then the number snaps into "Zero". */
export function ZeroStat({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reduce, run } = useRun(ref);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => String(Math.round(v)));
  const barWidth = useTransform(mv, [0, 99], ["0%", "100%"]);
  const [phase, setPhase] = useState<"count" | "word">("word");
  const [started, setStarted] = useState(false);

  useRewind(reduce, () => {
    mv.set(99);
    setPhase("count");
    setStarted(true);
  });

  useEffect(() => {
    if (!run) return;
    const controls = animate(mv, 0, {
      duration: 1.8,
      ease: [0.45, 0, 0.2, 1],
      delay: 0.3,
      onComplete: () => setPhase("word"),
    });
    return () => controls.stop();
  }, [run, mv]);

  return (
    <span ref={ref} className="flex flex-col items-center gap-2">
      <span aria-label={value} className="relative inline-grid h-[1em] place-items-center leading-none">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "count" ? (
            <motion.span
              key="count"
              aria-hidden
              className="tabular-nums text-muted"
              exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
            >
              {rounded}
            </motion.span>
          ) : (
            <motion.span
              key="word"
              aria-hidden
              initial={started ? { opacity: 0, scale: 0.4, rotate: -8 } : false}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 14 }}
            >
              {value}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span aria-hidden className="flex w-24 items-center gap-2">
        <span className="text-[0.65rem] font-medium uppercase tracking-wider text-muted">Drama</span>
        <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <motion.span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-tangerine to-brand"
            style={{ width: barWidth }}
          />
        </span>
      </span>
    </span>
  );
}
