"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};

// false during server rendering and hydration, true afterwards.
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}

// Like useReducedMotion, but stays false until hydration has finished. The server can't
// know the visitor's reduce-motion setting, so anything it changes in the rendered markup
// (text, attributes, initial state) must use this to avoid hydration mismatches.
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotion();
  return useHydrated() && reduce === true;
}
