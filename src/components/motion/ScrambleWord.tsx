"use client";

import { useEffect, useRef } from "react";
import { Dots } from "@/components/ui/Dots";
import { dotsHtml } from "@/lib/dots";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const HOLD = 1000; // ms a word stays before the next one scrambles in
const SETTLE = 400; // ms the scramble takes to settle on the new word

// motion.dev's scramble text: the word turns into random letters that settle, left to right,
// into the next word. Writes straight to the page (no React re-render per frame). The server
// renders the first word; under "reduce motion" the words simply swap. Once settled, a word gets
// the logo's orange dots like the rest of the heading. With a `lead` ("Book"), a line above the
// word reads "Book a" or "Book an" (small a, on request), the article following the word (an
// Anchor, a Host). With `stop`, an orange full stop follows every word ("Book a Photographer.",
// on request 2026-11-20); it sits outside the scrambling letters, so it never flickers.
const article = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

export function ScrambleWord({ words, lead, stop = false, className = "" }: { words: string[]; lead?: string; stop?: boolean; className?: string }) {
  const el = useRef<HTMLSpanElement>(null);
  const leadEl = useRef<HTMLSpanElement>(null);
  // The word showing, kept across the effect stopping and starting again.
  const current = useRef(0);

  useEffect(() => {
    const node = el.current;
    if (!node || words.length < 2) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = current.current % words.length;
    let frame = 0;
    let timer = 0;

    const setLead = (word: string) => {
      if (leadEl.current && lead) leadEl.current.textContent = `${lead} ${article(word)}`;
    };
    // A whole word, with its dots: used on (re)start and when stopping, so the heading never keeps
    // half-scrambled letters. Next.js keeps a page's HTML while you're on another page (cache
    // components) and only stops its effects; leaving the homepage mid-scramble used to leave
    // random letters there, which showed on the way back (2026-11-21).
    const settle = (word: string) => {
      setLead(word);
      node.innerHTML = dotsHtml(word);
    };
    settle(words[index]);

    const scrambleTo = (word: string) => {
      setLead(word);
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / SETTLE);
        const settled = Math.floor(t * word.length); // letters already in place, from the left
        let text = word.slice(0, settled);
        for (let i = settled; i < word.length; i++) text += word[i] === " " ? " " : CHARS[Math.floor(Math.random() * CHARS.length)];
        // Settled: the word with its orange dots (dotsHtml escapes the text).
        if (t < 1) {
          node.textContent = text;
          frame = requestAnimationFrame(step);
        } else {
          node.innerHTML = dotsHtml(word);
          timer = window.setTimeout(next, HOLD);
        }
      };
      frame = requestAnimationFrame(step);
    };

    function next() {
      if (document.hidden) {
        timer = window.setTimeout(next, 1000);
        return;
      }
      index = (index + 1) % words.length;
      current.current = index;
      if (still) {
        setLead(words[index]);
        node!.innerHTML = dotsHtml(words[index]);
        timer = window.setTimeout(next, HOLD + 800);
      } else scrambleTo(words[index]);
    }

    timer = window.setTimeout(next, HOLD);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      settle(words[index]);
    };
  }, [words, lead]);

  return (
    <>
      {lead && (
        <span ref={leadEl} aria-hidden className="block">
          {`${lead} ${article(words[0])}`}
        </span>
      )}
      <span aria-hidden className={className}>
        <span ref={el}>
          <Dots>{words[0]}</Dots>
        </span>
        {stop && <span className="dot-stop">.</span>}
      </span>
    </>
  );
}
