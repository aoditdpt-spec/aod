"use client";

import Link from "next/link";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotionSafe } from "@/lib/motion-safe";
import { createSwipeInterpreter } from "@/lib/swipe";

const mod = (n: number, m: number) => ((n % m) + m) % m;
const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places;
const SNAP = { type: "spring", stiffness: 120, damping: 22 } as const;
const AUTO_SPEED = 0.008; // degrees per millisecond while turning on its own
const CARD_HEIGHT_REM = 21;

// With few items the ring would have big empty stretches, so items are repeated until the
// ring holds at least this many cards (6 services → 12 cards, 30° apart).
const MIN_SLOTS = 12;

// Card width follows the screen (wide on laptops, narrower on phones); the ring's radius is
// then derived from the card width so neighbouring cards sit almost edge to edge — no big gaps.
function sizeFor(stageWidth: number, count: number) {
  const cardWidth = stageWidth < 640
    ? Math.round(Math.min(300, Math.max(220, stageWidth * 0.68)))
    : Math.round(Math.min(520, Math.max(320, stageWidth * 0.34)));
  const chordPerCard = 2 * Math.sin(Math.PI / count); // distance between neighbours, per unit radius
  const radius = Math.round((cardWidth / chordPerCard) * 1.04);
  return { cardWidth, radius };
}

type Ring3DProps<T> = {
  items: T[];
  label: string;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  getHref: (item: T) => string;
  renderCard: (item: T, front: boolean) => ReactNode;
};

// A slowly turning 3D "globe" of cards. Drag it (mouse/touch), swipe with two fingers
// (no limit while the fingers move), use the dots, the arrow buttons or the ← → keys,
// or click a side card to bring it to the front. Keeps turning even under the cursor; it only
// holds still while being dragged/swiped and while snapping to a card.
export function Ring3D<T>({ items, label, getKey, getLabel, getHref, renderCard }: Ring3DProps<T>) {
  const reduce = useReducedMotionSafe();
  const stageRef = useRef<HTMLDivElement>(null);
  const count = items.length; // unique items (one dot each)
  const copies = Math.max(1, Math.ceil(MIN_SLOTS / count));
  const slots = count * copies; // cards actually placed on the ring
  const step = 360 / slots;
  const rotation = useMotionValue(0);
  const [frontSlot, setFrontSlot] = useState(0);
  const front = frontSlot % count; // which item is in front (for the dots)
  const [{ cardWidth, radius }, setSize] = useState(() => sizeFor(1200, slots));
  const [dragging, setDragging] = useState(false);
  const paused = useRef({ hovered: false, dragging: false, snapping: false });
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const drag = useRef({ down: false, startX: 0, startRot: 0, moved: 0, lastX: 0, lastT: 0, velocity: 0 });
  const degPerPx = 180 / Math.PI / radius; // so the front card moves with the finger

  // Which card faces the viewer right now.
  useMotionValueEvent(rotation, "change", (r) => {
    const next = mod(Math.round(-r / step), slots);
    setFrontSlot((f) => (f === next ? f : next));
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize(sizeFor(entry.contentRect.width, slots)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [slots]);

  // Always turning, except mid-drag/swipe, while snapping, or when the visitor prefers reduced motion.
  useAnimationFrame((_, delta) => {
    const p = paused.current;
    if (reduce || p.dragging || p.snapping) return;
    rotation.set(rotation.get() - delta * AUTO_SPEED);
  });

  function snapTo(target: number) {
    controls.current?.stop();
    paused.current.snapping = true;
    controls.current = animate(rotation, target, {
      ...SNAP,
      onComplete: () => (paused.current.snapping = false),
    });
  }
  const nearest = () => Math.round(rotation.get() / step) * step;
  const go = (delta: number) => snapTo(nearest() - delta * step);
  // Bring the card in `slot` to the front by the shortest way round.
  const goToSlot = (slot: number) => {
    let d = mod(slot - mod(Math.round(-rotation.get() / step), slots), slots);
    if (d > slots / 2) d -= slots;
    snapTo(nearest() - d * step);
  };
  // Bring item `index` to the front, using whichever copy of it is nearest.
  const goTo = (index: number) => {
    let d = mod(index - mod(Math.round(-rotation.get() / step), slots), count);
    if (d > count / 2) d -= count;
    snapTo(nearest() - d * step);
  };

  // ← → keys while the pointer is over the ring (focus is handled on the element itself).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!paused.current.hovered) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (stageRef.current?.parentElement?.contains(t)) return;
      const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!delta) return;
      controls.current?.stop();
      paused.current.snapping = true;
      controls.current = animate(rotation, Math.round(rotation.get() / step) * step - delta * step, {
        ...SNAP,
        onComplete: () => (paused.current.snapping = false),
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rotation, step]);

  // Two-finger trackpad swipe / Shift + wheel, interpreted by createSwipeInterpreter (same feel
  // as the Coverflow): follows the fingers, fades the inertia after they lift, then snaps.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let settle = 0;
    const swipe = createSwipeInterpreter();
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical: let the page scroll
      e.preventDefault();
      controls.current?.stop();
      paused.current.dragging = true;
      rotation.set(rotation.get() - swipe.step(e.deltaX, e.deltaMode, e.timeStamp) * step);
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        swipe.reset();
        paused.current.dragging = false;
        paused.current.snapping = true;
        controls.current = animate(rotation, Math.round(rotation.get() / step) * step, {
          ...SNAP,
          onComplete: () => (paused.current.snapping = false),
        });
      }, 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settle);
    };
  }, [rotation, step, degPerPx]);

  function endDrag() {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    paused.current.dragging = false;
    setDragging(false);
    // A quick flick carries on by at most one card.
    const flick = Math.max(-step, Math.min(step, d.velocity * 120 * degPerPx));
    snapTo(Math.round((rotation.get() + flick) / step) * step);
  }

  const perspective = Math.max(1400, radius * 3);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
      onPointerEnter={() => (paused.current.hovered = true)}
      onPointerLeave={() => (paused.current.hovered = false)}
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
        className={`relative touch-pan-y select-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ perspective, height: `${CARD_HEIGHT_REM + 3}rem` }}
        onPointerDown={(e) => {
          controls.current?.stop();
          paused.current.snapping = false;
          const now = performance.now();
          drag.current = { down: true, startX: e.clientX, startRot: rotation.get(), moved: 0, lastX: e.clientX, lastT: now, velocity: 0 };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.down) return;
          const dx = e.clientX - d.startX;
          d.moved = Math.max(d.moved, Math.abs(dx));
          if (d.moved <= 6) return;
          if (!paused.current.dragging) {
            paused.current.dragging = true;
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          const now = performance.now();
          if (now > d.lastT) d.velocity = (e.clientX - d.lastX) / (now - d.lastT);
          d.lastX = e.clientX;
          d.lastT = now;
          rotation.set(d.startRot + dx * degPerPx);
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (drag.current.moved > 6) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = 0;
          }
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto h-16 w-2/3 rounded-[50%] bg-brand-bright/15 blur-2xl" />
        <motion.ul
          className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]"
          // translateZ(-radius) keeps the front card at its true size.
          style={{ z: -radius, rotateY: rotation }}
        >
          {Array.from({ length: slots }, (_, slot) => {
            const item = items[slot % count];
            const isFront = slot === frontSlot;
            return (
              <RingCard
                key={`${getKey(item)}-${slot}`}
                angle={slot * step}
                radius={radius}
                width={cardWidth}
                rotation={rotation}
                isFront={isFront}
                href={getHref(item)}
                onBringForward={() => goToSlot(slot)}
              >
                {renderCard(item, isFront)}
              </RingCard>
            );
          })}
        </motion.ul>
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
              aria-current={i === front}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === front ? "w-8 bg-brand" : "w-2 bg-line hover:bg-apricot"}`}
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

// One card on the ring. Fades as it turns away; the front card gets an orange outline.
// Values are rounded so the server-rendered styles match the client (no hydration mismatch).
function RingCard({
  angle,
  radius,
  width,
  rotation,
  isFront,
  href,
  onBringForward,
  children,
}: {
  angle: number;
  radius: number;
  width: number;
  rotation: MotionValue<number>;
  isFront: boolean;
  href: string;
  onBringForward: () => void;
  children: ReactNode;
}) {
  // 1 when the card faces the viewer, 0 at the back of the ring.
  const facing = useTransform(rotation, (r) => round((Math.cos(((angle + r) * Math.PI) / 180) + 1) / 2, 3));
  const opacity = useTransform(facing, (f) => round(f < 0.5 ? f * 0.7 : 0.35 + (f - 0.5) * 1.3, 3));
  const glow = useTransform(facing, (f) => round(Math.max(0, (f - 0.9) * 10), 3));

  return (
    <li
      className="absolute [backface-visibility:hidden]"
      style={{
        width,
        left: -width / 2,
        top: `-${CARD_HEIGHT_REM / 2}rem`,
        height: `${CARD_HEIGHT_REM}rem`,
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
      }}
    >
      <motion.div className="h-full" style={{ opacity }}>
        <Link
          href={href}
          tabIndex={isFront ? 0 : -1}
          draggable={false}
          onClick={(e) => {
            // A side card first comes to the front; a second click opens it.
            if (!isFront) {
              e.preventDefault();
              onBringForward();
            }
          }}
          className="group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-line bg-white p-3 shadow-[0_24px_50px_-24px_rgba(38,18,0,0.4)] outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.25rem] ring-2 ring-brand-bright"
            style={{ opacity: glow }}
          />
          {children}
        </Link>
      </motion.div>
    </li>
  );
}
