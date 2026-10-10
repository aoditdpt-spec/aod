"use client";

import { useState, useSyncExternalStore } from "react";
import { useReducedMotionSafe } from "@/lib/motion-safe";

// Phones held upright (narrower than 2:3) get the phone-shaped cut; every other screen the 1080p one.
const PHONE = "(max-aspect-ratio: 2/3)";

const subscribeLoad = (onChange: () => void) => {
  window.addEventListener("load", onChange);
  return () => window.removeEventListener("load", onChange);
};
const pageLoaded = () => document.readyState === "complete";
// Data Saver on, or a 2G connection: keep the still poster.
const lowData = () => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData) || /2g$/.test(c?.effectiveType ?? "");
};

// Looping background video for the hero, kept light for the page:
// - The poster (the clip's first frame as WebP, 85–165 KB) renders on the server and is what
//   visitors see first. The video only starts downloading once the rest of the page has loaded,
//   then fades in over the poster when it plays.
// - Each screen shape gets its own cut (680×1210 for phones, 1920×1080 otherwise), as AV1 (about
//   40% smaller; Chrome, Edge, Firefox, newer Safari) with H.264 as the fallback. 30 fps, no sound.
// - No video for visitors who prefer reduced motion or are on Data Saver / 2G.
// The files are in public/media/, or wherever NEXT_PUBLIC_MEDIA_URL points (see Hero.tsx).
export function HeroVideo({ base }: { base: string }) {
  const reduce = useReducedMotionSafe();
  const loaded = useSyncExternalStore(subscribeLoad, pageLoaded, () => false);
  const [playing, setPlaying] = useState(false);
  const showVideo = loaded && !reduce && !lowData();

  return (
    <>
      <picture>
        <source media={PHONE} srcSet={`${base}/hero-portrait.webp`} />
        <img src={`${base}/hero.webp`} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
      </picture>
      {showVideo && (
        <video
          aria-hidden
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
        >
          <source media={PHONE} src={`${base}/hero-portrait-av1.mp4`} type='video/mp4; codecs="av01.0.05M.08"' />
          <source media={PHONE} src={`${base}/hero-portrait.mp4`} type='video/mp4; codecs="avc1.640028"' />
          <source src={`${base}/hero-1080-av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
          <source src={`${base}/hero-1080.mp4`} type='video/mp4; codecs="avc1.640028"' />
        </video>
      )}
    </>
  );
}
