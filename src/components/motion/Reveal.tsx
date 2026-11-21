"use client";

import { motion, type Variants } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

// Fades and lifts its content in the first time it scrolls into view. The server renders the
// content too, and `data-reveal` lets the <noscript> rule in the layout show it without JavaScript.
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// A list whose items arrive one after another (motion.dev's staggered grid).
const group: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.06 } } };
const piece: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } },
};

export function Stagger({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.ul data-reveal variants={group} initial="hidden" whileInView="shown" viewport={{ once: true, margin: "0px 0px -10% 0px" }} className={className}>
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <motion.li data-reveal variants={piece} className={className} style={style}>
      {children}
    </motion.li>
  );
}
