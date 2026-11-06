"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { useReducedMotionSafe } from "@/lib/motion-safe";

// Phones held upright (narrower than 2:3) get the phone-shaped cut; every other screen the 1080p one.
const PHONE = "(max-aspect-ratio: 2/3)";
// Every other screen: keep the right edge, where the reel's captions sit.
const RIGHT = "[@media(min-aspect-ratio:2/3)]:object-right";

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

// Looping background video for the hero (the category reel: photographers, cinematographers,
// editors, drone pilots, anchors, hosts, musicians, DJs, live bands and stand-up comedians, each
// shot captioned at the bottom right), kept light for the page:
// - The poster (the clip's first frame as AVIF, 12–18 KB, with WebP for older browsers) renders
//   on the server and is what visitors see first. The video only starts downloading once the
//   rest of the page has loaded, then fades in over the poster when it plays.
// - Each screen shape gets its own cut (864×1080, the top three quarters of the frame's middle, for
//   phones, which leaves the captions out rather than cutting them in half; 1920×1080 otherwise), as
//   AV1 (about 55% smaller; Chrome, Edge, Firefox, newer Safari) with H.264 as the fallback. 30 fps,
//   no sound. Anchored to the right edge (`RIGHT`), so where a box is narrower than 16:9 the left
//   side is what comes off and the captions stay whole.
// - No video for visitors who prefer reduced motion or are on Data Saver / 2G.
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
    <div aria-hidden className="absolute inset-0">
      <picture>
        <source media={PHONE} type="image/avif" srcSet={`${base}/artists-portrait.avif`} />
        <source media={PHONE} srcSet={`${base}/artists-portrait.webp`} />
        <source type="image/avif" srcSet={`${base}/artists.avif`} />
        <img src={`${base}/artists.webp`} alt="" fetchPriority="high" className={`absolute inset-0 h-full w-full object-cover ${RIGHT}`} />
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
          className={`absolute inset-0 h-full w-full object-cover ${RIGHT} transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
        >
          <source media={PHONE} src={`${base}/artists-portrait-av1.mp4`} type='video/mp4; codecs="av01.0.05M.08"' />
          <source media={PHONE} src={`${base}/artists-portrait.mp4`} type='video/mp4; codecs="avc1.640028"' />
          <source src={`${base}/artists-1080-av1.mp4`} type='video/mp4; codecs="av01.0.08M.08"' />
          <source src={`${base}/artists-1080.mp4`} type='video/mp4; codecs="avc1.640028"' />
        </video>
      )}
    </div>
  );
}
