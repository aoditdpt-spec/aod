"use client";

import Link from "@/components/ui/AppLink";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { places } from "@/data/home";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

// "AOD, All In One Place": the Dispute Desk, the artist portal and AOD for Business, each a card
// with one line and its own address. The colour change from animejs.com (it took the place of the
// For Business / For Artists section): as the section scrolls up into view its background turns
// from white to black and the text from black to white (Motion needs real colours to blend
// between, so the theme's paper and ink are written out here).
const PAPER = "#ffffff";
const INK = "#0a0a0a";

export function Places() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.3"] });
  const background = useTransform(scrollYProgress, [0.35, 1], [PAPER, INK]);
  const color = useTransform(scrollYProgress, [0.35, 1], [INK, PAPER]);
  const faint = useTransform(scrollYProgress, [0.35, 1], ["rgb(10 10 10 / 0.6)", "rgb(255 255 255 / 0.6)"]);
  const edge = useTransform(scrollYProgress, [0.35, 1], ["rgb(10 10 10 / 0.25)", "rgb(255 255 255 / 0.3)"]);

  return (
    <motion.section ref={ref} style={{ backgroundColor: background, color }} className="py-24 lg:py-36">
      <Container>
        <Reveal>
          <h2 className="text-4xl sm:text-5xl">
            <Dots>{places.title}</Dots>
          </h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
          {places.items.map((p) => (
            <StaggerItem key={p.title}>
              <motion.div style={{ borderColor: edge }} className="h-full rounded-xl border">
                <Link href={p.href} className="group flex h-full flex-col rounded-xl p-7 transition-colors hover:bg-white/5 md:min-h-56">
                  <h3 className="text-2xl">{p.title}</h3>
                  <motion.p style={{ color: faint }} className="mt-2">
                    {p.text}
                  </motion.p>
                  {/* The address with an arrow (the one icon-like mark here, on request), which
                      moves a little on hover. */}
                  <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-medium">
                    {p.address}
                    <span aria-hidden className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </motion.section>
  );
}
