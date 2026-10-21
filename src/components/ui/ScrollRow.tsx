"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// A row of cards that scrolls sideways, modelled on Headout's carousels: the heading on the left,
// "See all" and round ← → buttons on the right (from tablets up; phones swipe), and the cards
// snapping into place. Each child is one card (a `<li>`); give it its width. `listClassName` can
// hide the row at some widths (MostBooked shows phones a list instead), and `after` sits under it.
export function ScrollRow({
  heading,
  label,
  seeAll,
  listClassName = "",
  after,
  children,
}: {
  heading: ReactNode;
  label: string;
  seeAll?: { href: string; label: string };
  listClassName?: string;
  after?: ReactNode;
  children: ReactNode;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      resize.disconnect();
    };
  }, [measure]);

  // One press moves by most of a screenful, so the next unseen card lands at the left edge.
  const move = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow = "flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-35";

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">{heading}</div>
        <div className="flex shrink-0 items-center gap-3">
          {seeAll && (
            <Link href={seeAll.href} className="text-sm font-semibold text-ink underline underline-offset-4 hover:text-brand">
              {seeAll.label}
            </Link>
          )}
          <div className="hidden gap-2 sm:flex">
            <button type="button" className={arrow} onClick={() => move(-1)} disabled={edges.start} aria-label={`Previous ${label}`}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" className={arrow} onClick={() => move(1)} disabled={edges.end} aria-label={`More ${label}`}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
      {/* Padding inside the track keeps the hover ring from being clipped by the scroll box. */}
      <ul
        ref={track}
        aria-label={label}
        className={`-mx-1 mt-6 flex snap-x snap-mandatory scroll-px-1 gap-5 overflow-x-auto scroll-smooth p-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${listClassName}`}
      >
        {children}
      </ul>
      {after}
    </div>
  );
}
