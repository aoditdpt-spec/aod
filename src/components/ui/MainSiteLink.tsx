"use client";

import { useSyncExternalStore } from "react";

// "Back To Main Site": every separate site (the artist portal, the admin, the Dispute Desk) has one,
// as on aod.co.in, since each lives on its own address (artists., admin., resolve.aod.co.in). On one
// of those addresses it leads to the same domain's main site (artists.aod.co.in -> www.aod.co.in,
// admin.localhost:3000 -> localhost:3000); anywhere else (aod.co.in itself, a Vercel preview,
// localhost) to "/". A plain <a>, since it can lead to another address.
const noop = () => () => {};
const PORTALS = /^(artists|admin|resolve)\.(.+)$/;

function mainSiteHref() {
  const { protocol, hostname, port } = window.location;
  const m = hostname.match(PORTALS);
  if (!m) return "/";
  const base = m[2];
  const host = base === "localhost" || base.startsWith("www.") || /^\d+\.\d+\.\d+\.\d+$/.test(base) ? base : `www.${base}`;
  return `${protocol}//${host}${port ? `:${port}` : ""}/`;
}

export function useMainSiteHref() {
  return useSyncExternalStore(noop, mainSiteHref, () => "/");
}

export function MainSiteLink({ variant = "button", className = "" }: { variant?: "button" | "text"; className?: string }) {
  const href = useMainSiteHref();
  const look =
    variant === "button"
      ? "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3.5 text-sm font-medium text-ink transition-colors hover:border-ink"
      : "inline-flex items-center gap-1 whitespace-nowrap text-muted transition-colors hover:text-ink";
  return (
    <a href={href} className={`${look} ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4 shrink-0">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      Back To Main Site
    </a>
  );
}
