import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/content/site";
import { resolution } from "@/content/resolution";
import { sectionLink, siteHref } from "@/lib/site-url";

const description = "Raise a problem with an AOD booking, get a case number, follow it and escalate it. For customers, businesses and AOD artists.";

// The Resolution Centre, at resolve.aod.co.in (src/proxy.ts; /resolve on localhost). Its own small
// header and footer, so it reads as a separate, formal place rather than part of the booking site.
// Links inside are written as /resolve/… and go through sectionLink(), which gives /new, /track…
// on its own domain; links back to the customer site go through siteHref().
export const metadata: Metadata = {
  title: { absolute: resolution.title, template: `%s — ${resolution.title}` },
  description,
  alternates: { canonical: `https://resolve.${brand.domain}/` },
  openGraph: { title: resolution.title, description, siteName: brand.fullName },
};

const nav = [
  { href: sectionLink("/resolve/new"), label: "Raise a case" },
  { href: sectionLink("/resolve/track"), label: "Track a case" },
];

export default function ResolveLayout({ children }: { children: ReactNode }) {
  const officer = resolution.grievanceOfficer;
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href={sectionLink("/resolve")} className="flex items-center gap-2" aria-label={resolution.title}>
            <Image src="/aod-wordmark.png" alt="AOD" width={85} height={24} priority className="h-6 w-auto" />
            <span className="rounded-md bg-peach px-2 py-0.5 text-xs font-medium text-brand-hover">{resolution.name}</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hidden rounded-lg px-3 py-2 font-medium text-ink hover:bg-wash sm:block">
                {n.label}
              </Link>
            ))}
            <a href={siteHref("/")} className="rounded-lg px-3 py-2 text-muted hover:bg-wash hover:text-ink">
              {brand.domain}
            </a>
          </nav>
        </div>
        {/* Phones: the two actions as tabs under the logo row. */}
        <nav className="grid grid-cols-2 border-t border-line text-center text-sm font-medium sm:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="py-2.5 text-ink hover:bg-wash">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-wash">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-medium text-ink">Grievance officer</p>
            <p className="mt-2 text-muted">
              {officer.name}, {brand.fullName}, {brand.city}, {brand.region}
            </p>
            <p className="mt-1 text-muted">
              <a href={`mailto:${officer.email}`} className="hover:text-brand">
                {officer.email}
              </a>
              {" · "}
              <a href={officer.phoneHref} className="hover:text-brand">
                {officer.phone}
              </a>
            </p>
          </div>
          <div>
            <p className="font-medium text-ink">Policies</p>
            <ul className="mt-2 space-y-1 text-muted">
              <li>
                <a href={siteHref("/refund-policy")} className="hover:text-brand">
                  Cancellation & refunds
                </a>
              </li>
              <li>
                <a href={siteHref("/terms")} className="hover:text-brand">
                  Terms
                </a>
              </li>
              <li>
                <a href={siteHref("/privacy")} className="hover:text-brand">
                  Privacy
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-ink">Not a problem, just a question?</p>
            <p className="mt-2 text-muted">Quotes, changes and questions go to AOD on WhatsApp or {brand.phoneDisplay}.</p>
          </div>
        </div>
        <p className="pb-8 text-center text-xs text-muted">
          {brand.fullName} · {resolution.name}
        </p>
      </footer>
    </div>
  );
}
