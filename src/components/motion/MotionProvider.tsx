"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("./features").then((r) => r.default);

// Site-wide animation settings: honour the visitor's "reduce motion" setting everywhere.
// Animated elements are `m.*` components (`import * as m from "motion/react-m"`), which carry
// no animation code of their own; LazyMotion loads it once, after the page has started.
// `strict` makes a stray `motion.*` component throw, since it would pull everything back in.
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
