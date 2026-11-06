"use client";

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/lib/motion-safe";

// The portfolio film: plays muted while on screen and pauses off screen; nothing downloads until it
// first scrolls into view. Under reduced motion it never plays by itself and gets controls instead.
// The footage carries a "Ganesh Housing" logo top left, a "Million Minds" logo top right (both in
// the top 11% of the frame) and, in one shot, a caption bar from 86% down. Zoomed 1.38× around a
// point a little above the middle, about 12% comes off the top and 16% off the bottom, so none of
// them shows (the same crop as on expos.aod.co.in).
export function PortfolioVideo({ base, label }: { base: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotionSafe();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduce) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduce]);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload={reduce ? "metadata" : "none"}
      controls={reduce}
      poster={`${base}/gate-2026.webp`}
      aria-label={label}
      className={`h-full w-full object-cover ${reduce ? "" : "origin-[50%_42%] scale-[1.38]"}`}
    >
      <source src={`${base}/gate-2026-1080-av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
      <source src={`${base}/gate-2026-1080.mp4`} type='video/mp4; codecs="avc1.640028"' />
    </video>
  );
}
