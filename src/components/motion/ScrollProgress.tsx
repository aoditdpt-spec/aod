"use client";

import { motion, useScroll, useSpring } from "motion/react";

// Thin orange bar along the top of the page showing how far you've scrolled.
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-bright via-brand to-tangerine"
      style={{ scaleX }}
    />
  );
}
