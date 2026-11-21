"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const noop = () => () => {};
const prefersStill = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The GATE 2026 film from aod.co.in (public/media): plays muted while on screen and pauses off
// screen; nothing downloads until it first scrolls into view. Zoomed 1.38× around a point a little
// above the middle, so the footage's corner logos and a caption bar don't show (the same crop as
// the main site). Under reduced motion it never plays by itself and gets controls instead.
export function GateFilm({ label, className = "" }: { label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const still = useSyncExternalStore(noop, prefersStill, () => false);

  useEffect(() => {
    const video = ref.current;
    if (!video || still) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [still]);

  return (
    <div className={`aspect-video w-full overflow-hidden bg-ink ${className}`}>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload={still ? "metadata" : "none"}
        controls={still}
        poster="/media/gate-2026.webp"
        aria-label={label}
        className={`h-full w-full object-cover ${still ? "" : "origin-[50%_42%] scale-[1.38]"}`}
      >
        <source src="/media/gate-2026-1080-av1.mp4" type='video/mp4; codecs="av01.0.08M.08"' />
        <source src="/media/gate-2026-1080.mp4" type='video/mp4; codecs="avc1.640028"' />
      </video>
    </div>
  );
}
