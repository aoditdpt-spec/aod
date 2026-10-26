"use client";

import { useState } from "react";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "A";

// An artist's or applicant's round profile photo. `src` comes from artistPhotoSrc()
// (src/lib/artist-photo.ts): the private /api/artist-photos address, or a picture still in the
// browser. Their initials on orange stand in while there's no photo, or if it won't load.
export function ArtistPhoto({ name, src, className = "h-9 w-9 text-sm", alt = "" }: { name: string; src?: string; className?: string; alt?: string }) {
  const [failed, setFailed] = useState(""); // the address that didn't load
  if (src && failed !== src)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a private photo from AOD's Drive (or one still in the browser), not optimised through Next.js
      <img src={src} alt={alt} loading="lazy" onError={() => setFailed(src)} className={`shrink-0 rounded-full bg-wash object-cover ${className}`} />
    );
  return (
    <span aria-hidden={!alt} className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-medium text-white ${className}`}>
      {initials(name)}
    </span>
  );
}
