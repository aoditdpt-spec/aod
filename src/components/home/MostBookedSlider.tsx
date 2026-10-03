"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { IconName } from "@/content/site";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { Rating } from "@/components/ui/Rating";

export type SliderItem = {
  service: string;
  category: string;
  slug: string;
  icon: IconName;
  rating: number;
  bookings: number;
};

// Shortest signed distance from the active card, wrapping around the ends.
function offsetFrom(index: number, active: number, count: number) {
  let d = index - active;
  if (d > count / 2) d -= count;
  if (d < -count / 2) d += count;
  return d;
}

// 3D coverflow: the centre card faces you, neighbours angle away. Auto-advances, pauses on hover.
export function MostBookedSlider({ items }: { items: SliderItem[] }) {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [spacing, setSpacing] = useState(280);
  const [hovered, setHovered] = useState(false);
  const swipe = useRef<number | null>(null);
  const count = items.length;

  const go = (delta: number) => setActive((a) => (a + delta + count) % count);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSpacing(Math.round(Math.min(300, Math.max(150, entry.contentRect.width * 0.24))));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || hovered) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), 3500);
    return () => window.clearInterval(id);
  }, [reduce, hovered, count]);

  return (
    <div onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <div
        ref={stageRef}
        className="relative h-[27rem] touch-pan-y select-none overflow-hidden [perspective:1200px]"
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <ul className="absolute inset-0 [transform-style:preserve-3d]">
          {items.map((item, i) => {
            const offset = offsetFrom(i, active, count);
            const distance = Math.abs(offset);
            const isActive = offset === 0;
            return (
              <motion.li
                key={item.service}
                className="absolute left-1/2 top-4 w-[17rem] sm:w-[19rem]"
                style={{ marginLeft: "-8.5rem", zIndex: 20 - distance }}
                initial={false}
                animate={{
                  x: offset * spacing,
                  rotateY: Math.max(-55, Math.min(55, offset * -28)),
                  scale: 1 - Math.min(distance, 3) * 0.1,
                  opacity: distance > 2 ? 0 : 1 - distance * 0.3,
                  filter: isActive ? "blur(0px)" : `blur(${Math.min(distance, 2)}px)`,
                }}
                transition={{ type: "spring", stiffness: 140, damping: 22 }}
                aria-hidden={distance > 2}
              >
                <Link
                  href={`/categories/${item.slug}`}
                  tabIndex={distance > 2 ? -1 : 0}
                  draggable={false}
                  onClick={(e) => {
                    // A side card first comes to the front; a second click opens it.
                    if (!isActive) {
                      e.preventDefault();
                      setActive(i);
                    }
                  }}
                  className={`group block rounded-[1.25rem] border bg-white p-3 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand ${
                    isActive ? "border-brand/40 shadow-[0_30px_60px_-25px_rgba(194,65,12,0.45)]" : "border-line shadow-md"
                  }`}
                >
                  <PhotoPlaceholder icon={item.icon} label={item.service} className="aspect-[16/11]" />
                  <div className="px-3 pb-2 pt-4">
                    <h3 className="text-lg font-medium group-hover:text-brand">{item.service}</h3>
                    <p className="text-sm text-muted">{item.category}</p>
                    <div className="mt-2">
                      <Rating rating={item.rating} count={item.bookings} unit="bookings" />
                    </div>
                    <span className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm font-medium text-brand">
                      Request a quote
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Previous service"
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-2" role="tablist" aria-label="Choose a service">
          {items.map((item, i) => (
            <button
              key={item.service}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={item.service}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-brand" : "w-2 bg-line hover:bg-apricot"}`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next service"
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-line text-ink transition-colors hover:border-brand hover:text-brand"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
