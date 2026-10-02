"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, MapPin, Menu, Search, X } from "lucide-react";
import { brand, categories } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { SearchBox } from "@/components/search/SearchBox";
import { whatsappUrl } from "@/lib/whatsapp";

const links = [
  { href: "/business", label: "For Business" },
  { href: "/for-artists", label: "For Artists" },
  { href: "/#how-it-works", label: "How it works" },
];

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`text-2xl font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
      {brand.name}
      <span className="text-brand-bright">.</span>
    </Link>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 xl:gap-6" aria-label="Main">
        <Logo />

        <button
          type="button"
          className="hidden shrink-0 items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm text-body hover:border-brand lg:flex"
          aria-label={`Location: ${brand.city}`}
        >
          <MapPin className="h-4 w-4 text-brand" aria-hidden />
          {brand.city}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>

        <ul className="hidden items-center gap-1 text-[15px] lg:flex">
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
            <div className="invisible absolute left-0 top-full w-[520px] rounded-card border border-line bg-white p-4 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
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
              <Link href={l.href} className="whitespace-nowrap rounded-md px-3 py-2 hover:text-brand">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Wide screens: search sits in the navbar; narrower screens use the search icon below. */}
        <div className="hidden flex-1 justify-end xl:flex">
          <div className="w-full max-w-[340px]">
            <SearchBox variant="nav" />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-4 xl:ml-0">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((o) => !o);
              setMenuOpen(false);
            }}
            className="rounded-lg p-2 text-ink hover:bg-wash xl:hidden"
            aria-expanded={searchOpen}
            aria-controls="nav-search"
            aria-label={searchOpen ? "Close search" : "Search"}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden whitespace-nowrap text-[15px] hover:text-brand xl:inline"
          >
            Chat on WhatsApp
          </a>
          <Link href="/book" className={buttonClasses("primary", "md", "hidden lg:inline-flex")}>
            Get matched
          </Link>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((o) => !o);
              setSearchOpen(false);
            }}
            className="rounded-lg p-2 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {searchOpen && (
        <div id="nav-search" className="border-t border-line bg-white px-4 py-3 sm:px-6 xl:hidden">
          <div className="mx-auto max-w-2xl">
            <SearchBox variant="nav" autoFocus onNavigate={() => setSearchOpen(false)} />
          </div>
        </div>
      )}

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-white px-4 pb-6 lg:hidden">
          <p className="pt-4 text-xs font-medium uppercase tracking-wider text-muted">Book an artist</p>
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
            Get matched
          </Link>
        </div>
      )}
    </header>
  );
}
