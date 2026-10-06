"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { legalDocs } from "@/content/legal";
import { brand, categories } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { SearchBox } from "@/components/search/SearchBox";
import { CityChips, CityPicker } from "@/components/location/CityPicker";
import { whatsappUrl } from "@/lib/whatsapp";

const links = [
  { href: "/business", label: "For Business" },
  { href: "/for-artists", label: "For Artists" },
  { href: "/#how-it-works", label: "How it works" },
];

// The AOD. wordmark in the brand orange, on a transparent background (public/aod-wordmark.png).
export function Logo({ size = "nav" }: { size?: "nav" | "footer" }) {
  return (
    <Link href="/" aria-label={`${brand.name} home`} className="inline-block shrink-0">
      <Image
        src="/aod-wordmark.png"
        alt={brand.name}
        width={708}
        height={200}
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
      <nav className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8 xl:gap-6" aria-label="Main">
        <Logo />

        <div className="hidden lg:block">
          <CityPicker />
        </div>

        <ul className="hidden items-center gap-1 text-[0.9375rem] lg:flex">
          <li className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 hover:text-brand"
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
            // "How it works" drops out between 1024 and 1280px to make room for the search box.
            <li key={l.href} className={l.href === "/#how-it-works" ? "hidden xl:block" : undefined}>
              <Link href={l.href} className="whitespace-nowrap rounded-md px-3 py-2 hover:text-brand">
                {l.label}
              </Link>
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
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden whitespace-nowrap text-[0.9375rem] hover:text-brand xl:inline"
          >
            Chat on WhatsApp
          </a>
          <Link href="/book" className={buttonClasses("primary", "md", "hidden lg:inline-flex")}>
            Get your artist
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 lg:hidden"
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
          <p className="mt-5 border-t border-line pt-4 text-xs font-medium uppercase tracking-wider text-muted">Book an artist</p>
          <ul className="mt-2 grid grid-cols-2 gap-1">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-2 py-2 text-sm hover:bg-wash"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 border-t border-line pt-4">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-2 py-2 hover:bg-wash"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/book"
            onClick={() => setMenuOpen(false)}
            className={buttonClasses("primary", "lg", "mt-4 w-full")}
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
