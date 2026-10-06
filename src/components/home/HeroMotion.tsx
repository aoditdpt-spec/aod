"use client";

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { useReducedMotionSafe } from "@/lib/motion-safe";
import { useEffect, useRef, useState } from "react";
import { hero } from "@/content/site";
import { Icon, type AnyIconName } from "@/components/ui/Icon";

const EASE = [0.22, 1, 0.36, 1] as const;

// Headline lines slide up out of a mask, one after another.
export function HeroHeadline() {
  const lines = [
    ...hero.title[0].map((text) => ({ text, accent: false })),
    ...hero.title[1].map((text) => ({ text, accent: true })),
  ];
  return (
    <h1 className="mt-8 max-w-[56rem] text-2xl font-medium leading-[1.1] !text-ink sm:text-4xl">
      {lines.map((line, i) => (
        <span
          key={line.text}
          className={`block overflow-hidden pb-[0.08em] ${line.accent ? "text-brand" : ""} ${i === 2 ? "mt-3" : ""}`}
        >
          <motion.span
            data-reveal
            className="block"
            initial={{ y: "110%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.12 }}
          >
            {line.text}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

// Soft orange light that follows the pointer around the hero card.
export function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(75);
  const y = useMotionValue(45);
  const sx = useSpring(x, { stiffness: 60, damping: 20 });
  const sy = useSpring(y, { stiffness: 60, damping: 20 });
  const background = useMotionTemplate`radial-gradient(38rem circle at ${sx}% ${sy}%, rgba(249,115,22,0.16), transparent 60%)`;

  useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card) return;
    const onMove = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      x.set(((e.clientX - r.left) / r.width) * 100);
      y.set(((e.clientY - r.top) / r.height) * 100);
    };
    const onLeave = () => {
      x.set(75);
      y.set(45);
    };
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  return <motion.div ref={ref} aria-hidden className="pointer-events-none absolute inset-0" style={{ background }} />;
}

// A booking walk-through: notification cards stack in one by one, then the stack resets.
export function HeroDemo() {
  const reduce = useReducedMotionSafe();
  const steps = hero.demo;
  const [count, setCount] = useState(1);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setCount((c) => (c >= steps.length + 1 ? 1 : c + 1));
    }, 1800);
    return () => window.clearInterval(id);
  }, [reduce, steps.length]);

  // With reduce motion on, show the whole walk-through at once (after hydration).
  const visible = steps.slice(0, reduce ? steps.length : Math.min(count, steps.length));

  return (
    <div aria-hidden className="relative w-full">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-white/50">How a booking flows</p>
      <ul className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {visible.map((step, i) => {
            const last = i === visible.length - 1;
            return (
              <motion.li
                key={step.title}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.94, filter: "blur(6px)" }}
                animate={{ opacity: last ? 1 : 0.55, y: 0, scale: last ? 1 : 0.97, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 30, transition: { duration: 0.25 } }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className={`flex items-center gap-3 rounded-2xl border p-4 backdrop-blur ${
                  last ? "border-white/20 bg-white/10" : "border-white/10 bg-white/[0.04]"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bright/20">
                  <Icon name={step.icon as AnyIconName} className="h-5 w-5 text-tangerine" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{step.title}</span>
                  <span className="block text-xs text-white/60">{step.text}</span>
                </span>
                {last && i === steps.length - 1 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                    className="ml-auto rounded-md bg-brand-bright px-2 py-0.5 text-[0.7rem] font-semibold text-white"
                  >
                    Done
                  </motion.span>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
