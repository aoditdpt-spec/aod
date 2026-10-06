"use client";

import { useReducedMotionSafe } from "@/lib/motion-safe";

// Looping background video for the hero. Muted and inline so browsers (and phones) autoplay it.
// Visitors who prefer reduced motion get the still poster image instead of moving footage.
// The video itself is never the content: the hero text sits on a light overlay (see Hero.tsx).
export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const reduce = useReducedMotionSafe();
  return reduce ? (
    poster ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
    ) : null
  ) : (
    <video
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover"
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}
