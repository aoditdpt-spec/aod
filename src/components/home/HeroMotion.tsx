"use client";

import { motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { hero } from "@/content/site";
import { Icon, type AnyIconName } from "@/components/ui/Icon";

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

// A booking walk-through that spotlights one step at a time: the current step pops forward
// while the other two grey out, then the next step takes over (1 → 2 → 3 → 1 …). It only runs
// while the card is on screen; with reduced motion all steps stay lit and nothing moves.
const STEP_MS = 1200;

export function HeroDemo() {
  const steps = hero.demo;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduce || !inView) return;
    const t = setInterval(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => clearInterval(t);
  }, [reduce, inView, steps.length]);

  return (
    <div ref={ref} aria-hidden className="relative w-full">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-white/50">How a booking flows</p>
      <ul className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const lit = reduce || i === active;
          return (
            <motion.li
              key={step.title}
              animate={lit ? { opacity: 1, scale: 1.03 } : { opacity: 0.35, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className={`flex items-center gap-3 rounded-2xl border p-4 backdrop-blur transition-[background-color,border-color,box-shadow,filter] duration-300 ${
                lit ? "border-tangerine/60 bg-white/[0.12] shadow-[0_10px_30px_rgba(249,115,22,0.2)]" : "border-white/10 bg-white/[0.04] grayscale"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-bright/20">
                <Icon name={step.icon as AnyIconName} className="h-5 w-5 text-tangerine" />
              </span>
              <span>
                <span className="block text-sm font-medium text-white">{step.title}</span>
                <span className="block text-xs text-white/60">{step.text}</span>
              </span>
              {i === steps.length - 1 && <span className="ml-auto rounded-md bg-brand-bright px-2 py-0.5 text-[0.7rem] font-semibold text-white">Done</span>}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
