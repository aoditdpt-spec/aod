"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotionSafe } from "@/lib/motion-safe";
import { createSwipeInterpreter } from "@/lib/swipe";

const mod = (n: number, m: number) => ((n % m) + m) % m;

// Signed distance from `position` to card `index`, wrapped to the nearest copy
// so the carousel loops (e.g. with 10 cards, card 9 sits just left of card 0).
function wrapOffset(index: number, position: number, count: number) {
  let d = mod(index - position, count);
  if (d >= count / 2) d -= count;
  return d;
}

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
// The cards glide towards the wanted position on this spring, so even very fast input
// becomes a calm, smooth movement.
const GLIDE = { stiffness: 120, damping: 24, mass: 1 };
const MAX_FLICK = 1; // extra cards a fast mouse/touch release can carry on


type CoverflowProps<T> = {
  items: T[];
  label: string; // what the carousel shows, for screen readers
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  getHref: (item: T) => string;
  renderCard: (item: T, active: boolean) => ReactNode;
  autoplayMs?: number;
};

// 3D coverflow carousel. A single continuous `position` drives every card's place,
// angle, size and fade, so dragging (mouse/touch) and trackpad swipes move the cards
// through the arc under your finger, then snap to the nearest card. Also: dots, arrow
// buttons, ← → keys, click a side card to bring it forward. Auto-advances; pauses on
// hover, focus and drag.
export function Coverflow<T>({ items, label, getKey, getLabel, getHref, renderCard, autoplayMs = 3500 }: CoverflowProps<T>) {
  const reduce = useReducedMotionSafe();
  const stageRef = useRef<HTMLDivElement>(null);
  const count = items.length;
  // `target` is where the carousel should be; `position` glides there and drives the cards.
  const target = useMotionValue(0);
  const position = useSpring(target, GLIDE);
  const [active, setActive] = useState(0);
  const [spacing, setSpacing] = useState(280);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ down: false, startX: 0, startPos: 0, moved: 0, lastX: 0, lastT: 0, velocity: 0 });

  // The front card is whichever is nearest to the current position.
  useMotionValueEvent(position, "change", (p) => {
    const next = mod(Math.round(p), count);
    setActive((a) => (a === next ? a : next));
  });

  const snapTo = (to: number) => target.set(to);
  const go = (delta: number) => snapTo(Math.round(target.get()) + delta);
  const goTo = (index: number) => {
    const p = Math.round(target.get());
    snapTo(p + wrapOffset(index, p, count));
  };

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSpacing(Math.round(Math.min(300, Math.max(150, entry.contentRect.width * 0.24))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-advance, unless the visitor is interacting or prefers reduced motion.
  useEffect(() => {
    if (reduce || hovered || focused || dragging) return;
    const id = window.setInterval(() => target.set(Math.round(target.get()) + 1), autoplayMs);
    return () => window.clearInterval(id);
  }, [reduce, hovered, focused, dragging, autoplayMs, target]);

  // ← → keys work while the pointer is over the carousel (focus is handled on the element itself).
  useEffect(() => {
    if (!hovered) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (stageRef.current?.parentElement?.contains(t)) return; // the element's own handler covers this
      const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (delta) target.set(Math.round(target.get()) + delta);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hovered, target]);

  // Trackpad two-finger swipe (and Shift + mouse wheel) arrive as horizontal wheel events.
  // createSwipeInterpreter turns them into cards: following the fingers while they move
  // (a full trackpad stroke ≈ 3–4 cards) and quickly fading the inertia after they lift.
  // Snaps to the nearest card once the swipe settles. Non-passive so the browser's
  // swipe-to-go-back gesture can be blocked.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const swipe = createSwipeInterpreter();
    let settle = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical: let the page scroll
      e.preventDefault();
      target.set(target.get() + swipe.step(e.deltaX, e.deltaMode, e.timeStamp));
      setDragging(true);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        swipe.reset();
        setDragging(false);
        target.set(Math.round(target.get()));
      }, 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
    };
  }, [target]);

  function endDrag() {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    setDragging(false);
    // A quick flick carries on by at most one card in the direction of travel.
    const flick = Math.max(-MAX_FLICK, Math.min(MAX_FLICK, (d.velocity * 120) / spacing));
    snapTo(Math.round(target.get() - flick));
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
    >
      <div
        ref={stageRef}
        className={`relative h-[25rem] touch-pan-y select-none overflow-hidden [perspective:1200px] ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={(e) => {
          const now = performance.now();
          // Grab the cards where they are right now (even mid-glide).
          target.set(position.get());
          drag.current = { down: true, startX: e.clientX, startPos: position.get(), moved: 0, lastX: e.clientX, lastT: now, velocity: 0 };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.down) return;
          const dx = e.clientX - d.startX;
          d.moved = Math.max(d.moved, Math.abs(dx));
          if (d.moved <= 6) return;
          if (!dragging) {
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          const now = performance.now();
          if (now > d.lastT) d.velocity = (e.clientX - d.lastX) / (now - d.lastT); // px per ms
          d.lastX = e.clientX;
          d.lastT = now;
          // Dragging left moves forward; the cards glide after the finger.
          target.set(d.startPos - dx / spacing);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        // A drag shouldn't count as a click on the card under the pointer.
        onClickCapture={(e) => {
          if (drag.current.moved > 6) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = 0;
          }
        }}
      >
        <ul className="absolute inset-0 [transform-style:preserve-3d]">
          {items.map((item, i) => (
            <CoverflowCard
              key={getKey(item)}
              index={i}
              count={count}
              spacing={spacing}
              position={position}
              isActive={i === active}
              href={getHref(item)}
              onBringForward={() => goTo(i)}
            >
              {renderCard(item, i === active)}
            </CoverflowCard>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-wrap justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={getKey(item)}
              type="button"
              aria-label={`Show ${getLabel(item)}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-brand" : "w-2 bg-line hover:bg-apricot"}`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next"
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-muted">Drag or swipe, use the arrows or press ← →</p>
    </div>
  );
}

// One card. Its place, angle, size, fade and stacking all follow the shared position,
// so it moves smoothly during a drag. Values are rounded so the server-rendered styles
// match the client exactly (no hydration mismatch).
function CoverflowCard({
  index,
  count,
  spacing,
  position,
  isActive,
  href,
  onBringForward,
  children,
}: {
  index: number;
  count: number;
  spacing: number;
  position: MotionValue<number>;
  isActive: boolean;
  href: string;
  onBringForward: () => void;
  children: ReactNode;
}) {
  const offset = useTransform(position, (p) => wrapOffset(index, p, count));
  const x = useTransform(offset, (o) => Math.round(o * spacing));
  const rotateY = useTransform(offset, (o) => round(Math.max(-55, Math.min(55, o * -28)), 2));
  const scale = useTransform(offset, (o) => round(1 - Math.min(Math.abs(o), 3) * 0.1, 3));
  const opacity = useTransform(offset, (o) => round(Math.max(0, Math.min(1, 1 - Math.abs(o) * 0.3 - (Math.abs(o) > 2 ? (Math.abs(o) - 2) * 0.8 : 0))), 3));
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));
  const far = Math.abs(wrapOffset(index, Math.round(position.get()), count)) > 2;

  return (
    <motion.li
      className="absolute left-1/2 top-3 w-[17rem] sm:w-[19rem]"
      style={{ marginLeft: "-8.5rem", x, rotateY, scale, opacity, zIndex }}
      aria-hidden={far}
    >
      <Link
        href={href}
        tabIndex={isActive ? 0 : -1}
        draggable={false}
        onClick={(e) => {
          // A side card first comes to the front; a second click opens it.
          if (!isActive) {
            e.preventDefault();
            onBringForward();
          }
        }}
        className={`group block rounded-[1.25rem] border bg-white p-3 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand ${
          isActive ? "border-brand/40 shadow-[0_30px_60px_-25px_rgba(194,65,12,0.45)]" : "border-line shadow-md"
        }`}
      >
        {children}
      </Link>
    </motion.li>
  );
}
