"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, Ticket, X } from "lucide-react";
import { legalDocs } from "@/content/legal";
import { brand, categories } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { SearchBox } from "@/components/search/SearchBox";
import { CityChips, CityPicker } from "@/components/location/CityPicker";
import { SectionLink } from "@/components/ui/SectionLink";
import { portalHref } from "@/lib/site-url";

const links = [
  { href: "/business", label: "For Business" },
  { href: "/for-artists", label: "For Artists" },
  // The Resolution Centre itself (resolve.aod.co.in in production, /resolve on localhost).
  { href: portalHref("/resolve"), label: "Resolution Centre" },
  { href: "/about", label: "About us" },
];


// The AOD. wordmark in the brand orange, on a transparent background: public/aod-wordmark-sm.png,
// 84px tall (sharp at the footer's size on 2x screens), served as it is. Every logo uses this file
// with `unoptimized`: Next.js's small AVIF copies of the full-size file turned the orange brown.
export function Logo({ size = "nav" }: { size?: "nav" | "footer" }) {
  return (
    <Link href="/" aria-label={`${brand.name} home`} className="inline-block shrink-0">
      <Image
        src="/aod-wordmark-sm.png"
        alt={brand.name}
        unoptimized
        width={size === "nav" ? 85 : 127}
        height={size === "nav" ? 24 : 36}
        priority
        className={`w-auto ${size === "nav" ? "h-6" : "h-9"}`}
      />
    </Link>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-page items-center gap-4 px-4 sm:px-6 lg:px-8 xl:gap-6" aria-label="Main">
        <Logo />

        {/* Every link shows from 1024px. To fit them beside the search box on smaller laptops, the
            links are a little smaller below 1280px and the city picker waits until 1152px (the
            booking questions ask for the city when it isn't picked; phones pick it in the menu). */}
        <div className="hidden min-[72rem]:block">
          <CityPicker />
        </div>

        <ul className="hidden items-center gap-0.5 text-sm lg:flex xl:gap-1 xl:text-[0.9375rem]">
          <li className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 hover:text-brand xl:px-3"
              aria-haspopup="true"
            >
              Book an artist
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" aria-hidden />
            </button>
            {/* Opens on hover and on keyboard focus. */}
            <div className="invisible absolute left-0 top-full w-[32.5rem] rounded-card border border-line bg-white p-4 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="grid grid-cols-2 gap-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/categories/${c.slug}`} className="block rounded-lg px-3 py-2 hover:bg-wash">
                      <span className="block text-sm font-medium text-ink">{c.name}</span>
                      <span className="block truncate text-xs text-muted">{c.short}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
          {links.map((l) => (
            <li key={l.href}>
              <SectionLink href={l.href} className="whitespace-nowrap rounded-md px-2 py-2 hover:text-brand xl:px-3">
                {l.label}
              </SectionLink>
            </li>
          ))}
        </ul>

        {/* From 1024px the search sits in the navbar; below that it is a full-width bar under the logo row. */}
        <div className="hidden min-w-0 flex-1 justify-end lg:flex">
          <div className="w-full max-w-[22rem] xl:max-w-[28rem] 2xl:max-w-[34rem]">
            <SearchBox variant="nav" />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-4">
          {/* Customers' own bookings: a quiet outlined button, icon-only where space is tight. */}
          <Link
            href="/my-bookings"
            aria-label="My bookings"
            title="My bookings"
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-2.5 text-[0.9375rem] text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Ticket className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            <span className="hidden sm:inline lg:hidden xl:inline">My bookings</span>
          </Link>
          <Link href="/book" className={buttonClasses("primary", "md", "hidden lg:inline-flex")}>
            Get your artist
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            // Inside the installed app the tab bar's "More" does this job.
            className="rounded-lg p-2 lg:hidden standalone:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Phones and tablets: an always-visible search bar under the logo row (Blinkit-style). */}
      <div className="px-4 pb-3 sm:px-6 lg:hidden">
        <SearchBox variant="nav" />
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-white px-4 pb-6 lg:hidden">
          <div className="pt-4">
            <CityChips />
          </div>
          {/* No category list here: phones reach categories through the search bar, the homepage
              carousel and "Get your artist". */}
          <ul className="mt-4 space-y-1 border-t border-line pt-4">
            {links.map((l) => (
              <li key={l.href}>
                <SectionLink
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-wash"
                >
                  {l.label}
                </SectionLink>
              </li>
            ))}
          </ul>
          <Link
            href="/my-bookings"
            onClick={() => setMenuOpen(false)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink hover:border-brand"
          >
            <Ticket className="h-4 w-4 text-brand" aria-hidden /> My bookings
          </Link>
          <Link
            href="/book"
            onClick={() => setMenuOpen(false)}
            className={buttonClasses("primary", "lg", "mt-3 w-full")}
          >
            Get your artist
          </Link>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-muted">
            {legalDocs.map((d) => (
              <li key={d.slug}>
                <Link href={`/${d.slug}`} onClick={() => setMenuOpen(false)} className="hover:text-brand">
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
