"use client";

import Link from "next/link";
import {
  animate,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { categories, type Category } from "@/content/site";
import { Icon } from "@/components/ui/Icon";

const STEP = 360 / categories.length;
const AUTO_SPEED = 0.006; // degrees per millisecond (≈ one full turn a minute)

// Nearest rotation (in the current turn) that brings card `index` to the front.
function frontRotationFor(index: number, current: number) {
  const target = -index * STEP;
  return target + Math.round((current - target) / 360) * 360;
}

// The categories on a slowly turning 3D ring. Drag it, use the arrows, or tab through the cards.
export function CategoryRing() {
  const stageRef = useRef<HTMLDivElement>(null);
  const rotation = useMotionValue(0);
  const reduce = useReducedMotion();
  const [radius, setRadius] = useState(420);
  const paused = useRef(false);
  const drag = useRef({ active: false, startX: 0, startRotation: 0, moved: 0 });

  // Size the ring to the space available.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      // A minimum radius keeps neighbouring cards from overlapping on phones; the edges fade out.
      setRadius(Math.round(Math.min(460, Math.max(310, width * 0.36))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (reduce || paused.current || drag.current.active) return;
    rotation.set(rotation.get() - delta * AUTO_SPEED);
  });

  function snap(to?: number) {
    const current = rotation.get();
    const target = to ?? Math.round(current / STEP) * STEP;
    animate(rotation, target, { type: "spring", stiffness: 120, damping: 20 });
  }

  const cardWidth = Math.round(Math.min(240, Math.max(186, radius * 0.58)));

  return (
    <div>
      <div
        ref={stageRef}
        className="relative h-[24rem] cursor-grab touch-pan-y select-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [perspective:1400px] active:cursor-grabbing sm:h-[27rem]"
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => {
          paused.current = false;
          if (drag.current.active) {
            drag.current.active = false;
            snap();
          }
        }}
        onPointerDown={(e) => {
          drag.current = { active: true, startX: e.clientX, startRotation: rotation.get(), moved: 0 };
        }}
        onPointerMove={(e) => {
          if (!drag.current.active) return;
          const dx = e.clientX - drag.current.startX;
          drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
          rotation.set(drag.current.startRotation + dx * 0.3);
        }}
        onPointerUp={() => {
          if (!drag.current.active) return;
          drag.current.active = false;
          snap();
        }}
        // A drag shouldn't count as a click on the card under the pointer.
        onClickCapture={(e) => {
          if (drag.current.moved > 6) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = 0;
          }
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-6 mx-auto h-16 w-2/3 rounded-[50%] bg-brand-bright/15 blur-2xl" />
        <motion.ul
          className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]"
          // translateZ(-radius) keeps the front card at its true size instead of magnified
          style={{ z: -radius, rotateY: rotation }}
        >
          {categories.map((c, i) => (
            <RingCard
              key={c.slug}
              category={c}
              index={i}
              radius={radius}
              width={cardWidth}
              rotation={rotation}
              onFocus={() => {
                paused.current = true;
                snap(frontRotationFor(i, rotation.get()));
              }}
              onBlur={() => (paused.current = false)}
            />
          ))}
        </motion.ul>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous category"
          onClick={() => snap(Math.round(rotation.get() / STEP) * STEP + STEP)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-sm text-muted">Drag to explore</p>
        <button
          type="button"
          aria-label="Next category"
          onClick={() => snap(Math.round(rotation.get() / STEP) * STEP - STEP)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Piecewise-linear map of `v` from `input` stops to `output` stops (clamped).
function interpolate(v: number, input: number[], output: number[]) {
  if (v <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (v <= input[i]) {
      const t = (v - input[i - 1]) / (input[i] - input[i - 1]);
      return output[i - 1] + t * (output[i] - output[i - 1]);
    }
  }
  return output[output.length - 1];
}

function RingCard({
  category,
  index,
  radius,
  width,
  rotation,
  onFocus,
  onBlur,
}: {
  category: Category;
  index: number;
  radius: number;
  width: number;
  rotation: MotionValue<number>;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const angle = index * STEP;
  // 1 when the card faces the viewer, 0 when it is at the back of the ring.
  // Rounded so the server-rendered style matches the client exactly (avoids a hydration mismatch).
  const facing = useTransform(rotation, (r) => Math.round(((Math.cos(((angle + r) * Math.PI) / 180) + 1) / 2) * 1000) / 1000);
  const opacity = useTransform(facing, (f) => Math.round(interpolate(f, [0, 0.5, 1], [0.15, 0.45, 1]) * 1000) / 1000);
  const glow = useTransform(facing, (f) => Math.round(interpolate(f, [0.85, 1], [0, 1]) * 1000) / 1000);

  return (
    <li
      className="absolute"
      style={{
        width,
        left: -width / 2,
        top: "-9.5rem",
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
      }}
    >
      <motion.div className="[backface-visibility:hidden]" style={{ opacity }}>
        <Link
          href={`/categories/${category.slug}`}
          onFocus={onFocus}
          onBlur={onBlur}
          draggable={false}
          className="group relative block h-[19rem] overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_18px_40px_-18px_rgba(38,18,0,0.35)] outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <div aria-hidden className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-peach via-wash to-apricot/40" />
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-2xl ring-2 ring-brand-bright"
            style={{ opacity: glow }}
          />
          <div className="relative">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-sm">
              <Icon name={category.icon} className="h-7 w-7 text-brand" strokeWidth={1.5} />
            </span>
            <h3 className="mt-12 text-lg font-medium leading-tight">{category.name}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted">{category.short}</p>
            <p className="mt-4 flex items-center justify-between text-sm font-medium text-brand">
              {category.services.length} services
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </p>
          </div>
        </Link>
      </motion.div>
    </li>
  );
}
