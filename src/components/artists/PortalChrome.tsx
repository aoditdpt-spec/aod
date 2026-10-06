import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { portal } from "@/content/artist-portal";
import { legalDocs } from "@/content/legal";
import { brand } from "@/content/site";
import { siteHref } from "@/lib/site-url";

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

// Bottom line on every portal page: the policies, which live on the customer site.
export function PortalFooter() {
  return (
    <footer className="border-t border-line px-4 py-5 text-xs text-muted sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>
          © {new Date().getFullYear()} {brand.fullName}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {legalDocs.map((d) => (
            <li key={d.slug}>
              <a href={siteHref(`/${d.slug}`)} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                {d.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
