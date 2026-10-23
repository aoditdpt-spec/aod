"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useReducedMotionSafe } from "@/lib/motion-safe";

// Phones held upright (narrower than 2:3) get the phone-shaped cut; every other screen the 1080p one.
const PHONE = "(max-aspect-ratio: 2/3)";

const subscribeLoad = (onChange: () => void) => {
  window.addEventListener("load", onChange);
  return () => window.removeEventListener("load", onChange);
};
const pageLoaded = () => document.readyState === "complete";
// Whether a media query matches, kept up to date (false on the server).
function useMedia(query: string | undefined) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!query) return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => !query || window.matchMedia(query).matches,
    () => false,
  );
}
// Data Saver on, or a 2G connection: keep the still poster.
const lowData = () => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData) || /2g$/.test(c?.effectiveType ?? "");
};

// Looping background video for the hero, kept light for the page:
// - The poster (the clip's first frame as AVIF, 43–105 KB, with WebP for older browsers) renders
//   on the server and is what visitors see first. The video only starts downloading once the
//   rest of the page has loaded, then fades in over the poster when it plays.
// - Each screen shape gets its own cut (608×1080, the middle of the frame, for phones; 1920×1080
//   otherwise), as AV1 (about 60% smaller; Chrome, Edge, Firefox, newer Safari) with H.264 as the
//   fallback. 30 fps, no sound.
// - No video for visitors who prefer reduced motion or are on Data Saver / 2G.
// - Zoomed in 12% from the left edge (poster and video alike), which crops the right edge off so
//   the "Million Minds Tech City" logo in the top-right corner of the footage never shows. The
//   phones' cut is the middle of the frame, which leaves that corner out already, so it isn't zoomed.
// - `media`: only fetch and play the video while this media query matches. The homepage has two
//   heroes (the app-style one below 1024px, the full-screen one on laptops) and hides one with
//   CSS, so this keeps the hidden one from downloading the video too.
// The files are in public/media/, or wherever NEXT_PUBLIC_MEDIA_URL points (see Hero.tsx).
export function HeroVideo({ base, media }: { base: string; media?: string }) {
  const reduce = useReducedMotionSafe();
  const loaded = useSyncExternalStore(subscribeLoad, pageLoaded, () => false);
  const [playing, setPlaying] = useState(false);
  const shown = useMedia(media);
  const showVideo = loaded && shown && !reduce && !lowData();

  return (
    <div aria-hidden className="absolute inset-0 origin-left [@media(min-aspect-ratio:2/3)]:scale-[1.12]">
      <picture>
        <source media={PHONE} type="image/avif" srcSet={`${base}/hero-portrait.avif`} />
        <source media={PHONE} srcSet={`${base}/hero-portrait.webp`} />
        <source type="image/avif" srcSet={`${base}/hero.avif`} />
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
          <source media={PHONE} src={`${base}/hero-portrait-av1.mp4`} type='video/mp4; codecs="av01.0.04M.08"' />
          <source media={PHONE} src={`${base}/hero-portrait.mp4`} type='video/mp4; codecs="avc1.640028"' />
          <source src={`${base}/hero-1080-av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
          <source src={`${base}/hero-1080.mp4`} type='video/mp4; codecs="avc1.640028"' />
        </video>
      )}
    </div>
  );
}
