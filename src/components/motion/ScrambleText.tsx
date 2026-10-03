"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/";

// Text that resolves from random characters into the real words, left to right.
// Renders the real text first, so the server HTML and screen readers get the final words.
export function ScrambleText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let frame = 0;
    let raf = 0;
    const totalFrames = 42;
    const start = window.setTimeout(() => {
      const tick = () => {
        const revealed = Math.floor((frame / totalFrames) * text.length);
        el.textContent = text
          .split("")
          .map((ch, i) => (i < revealed || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("");
        frame++;
        if (frame <= totalFrames) raf = requestAnimationFrame(tick);
        else el.textContent = text;
      };
      tick();
    }, delay * 1000);
    return () => {
      window.clearTimeout(start);
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text, reduce, delay]);

  return (
    <span ref={ref} aria-label={text} className={className}>
      {text}
    </span>
  );
}
