"use client";

import { useState } from "react";
import { drivePhotoSrc } from "@/lib/drive-photo";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "A";

// An artist's or applicant's round profile photo, loaded from the Google Drive link they gave
// (src/lib/drive-photo.ts). Their initials on orange stand in while there's no photo, or when
// Drive won't show it (the file isn't shared "Anyone with the link", or was deleted).
// `onStatus` tells a form whether the photo loaded.
export function ArtistPhoto({
  name,
  photo,
  className = "h-9 w-9 text-sm",
  width = 160,
  alt = "",
  onStatus,
}: {
  name: string;
  photo?: string;
  className?: string; // size and initials' text size
  width?: number; // pixels to ask Drive for (about twice the shown size)
  alt?: string;
  onStatus?: (status: "loaded" | "failed") => void;
}) {
  const src = drivePhotoSrc(photo, width);
  const [failed, setFailed] = useState(""); // the address that didn't load
  if (src && failed !== src)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- the artist's own Google Drive, not optimised through Next.js
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => onStatus?.("loaded")}
        onError={() => {
          setFailed(src);
          onStatus?.("failed");
        }}
        className={`shrink-0 rounded-full bg-wash object-cover ${className}`}
      />
    );
  return (
    <span aria-hidden={!alt} className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-medium text-white ${className}`}>
      {initials(name)}
    </span>
  );
}
