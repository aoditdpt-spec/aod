import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { portal } from "@/content/artist-portal";

// Thin strip on every portal page: this is a preview and nothing is saved or sent.
export function PreviewBanner() {
  return (
    <p className="flex items-center justify-center gap-2 bg-night px-4 py-2 text-center text-xs text-white/85 sm:text-sm">
      <Info className="h-4 w-4 shrink-0 text-tangerine" aria-hidden />
      {portal.previewNote}
    </p>
  );
}

// "AOD. for Artists" mark. Links to the portal's start page.
export function PortalLogo({ href = "/artists" }: { href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2" aria-label={`${portal.name} home`}>
      <Image src="/aod-wordmark.png" alt="AOD" width={708} height={200} priority className="h-6 w-auto" />
      <span className="rounded-md bg-peach px-2 py-0.5 text-xs font-medium text-brand-hover">for Artists</span>
    </Link>
  );
}

// Top bar of the portal. `right` holds page-specific actions (a back link, the account menu).
export function PortalHeader({ right, logoHref }: { right?: ReactNode; logoHref?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <PortalLogo href={logoHref} />
        <div className="flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}
