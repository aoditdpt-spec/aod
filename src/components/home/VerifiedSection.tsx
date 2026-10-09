"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { BadgeCheck, Check } from "lucide-react";
import { verifiedArtists } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { TiltCard, iconHover } from "@/components/motion/TiltCard";

// The trust promise. As it scrolls in, the page fades to dark, the promise lights up
// word by word, and the page fades back to light as you scroll past.
// Elements carry data-reveal so they're fully visible without JavaScript (see layout.tsx).
export function VerifiedSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const dark = useTransform(scrollYProgress, [0.12, 0.26, 0.74, 0.9], [0, 1, 1, 0]);
  const content = useTransform(scrollYProgress, [0.16, 0.28], [0, 1]);
  const words = verifiedArtists.text.split(" ");

  return (
    <section ref={ref} className="relative overflow-hidden py-28 sm:py-36">
      <motion.div data-reveal aria-hidden className="absolute inset-0 bg-night" style={{ opacity: dark }} />
      <motion.div
        data-reveal
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(208,97,57,0.25),transparent_65%)]"
        style={{ opacity: dark }}
      />
      <Container className="relative">
        <motion.div data-reveal className="mx-auto max-w-5xl" style={{ opacity: content }}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <BadgeCheck className="h-7 w-7 text-tangerine" strokeWidth={1.5} aria-hidden />
          </span>
          <h2 className="mt-6 text-3xl font-medium !text-white sm:text-5xl">{verifiedArtists.title}</h2>
          <p className="mt-8 text-2xl leading-snug sm:text-4xl sm:leading-tight" aria-label={verifiedArtists.text}>
            {words.map((word, i) => (
              <Word key={i} progress={scrollYProgress} range={[0.28 + (i / words.length) * 0.3, 0.3 + ((i + 1) / words.length) * 0.3]}>
                {word}
              </Word>
            ))}
          </p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-3">
            {verifiedArtists.points.map((p, i) => (
              <Point key={p} progress={scrollYProgress} at={0.45 + i * 0.05}>
                {p}
              </Point>
            ))}
          </ul>
        </motion.div>
      </Container>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span data-reveal aria-hidden className="text-white" style={{ opacity }}>
      {children}{" "}
    </motion.span>
  );
}

function Point({ children, progress, at }: { children: string; progress: MotionValue<number>; at: number }) {
  const opacity = useTransform(progress, [at, at + 0.06], [0, 1]);
  const y = useTransform(progress, [at, at + 0.06], [24, 0]);
  return (
    <motion.li data-reveal style={{ opacity, y }}>
      <TiltCard
        tone="dark"
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur transition-colors duration-300 hover:border-tangerine/40"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-bright ${iconHover}`}>
          <Check className="h-4 w-4" aria-hidden />
        </span>
        {children}
      </TiltCard>
    </motion.li>
  );
}
