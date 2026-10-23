"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, Ticket } from "lucide-react";
import { brand, categories } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { SearchBox } from "@/components/search/SearchBox";
import { CityPicker, CitySheetButton } from "@/components/location/CityPicker";
import { SectionLink } from "@/components/ui/SectionLink";
import { portalHref } from "@/lib/site-url";

const links = [
  { href: "/business", label: "For Business" },
  { href: "/for-artists", label: "For Artists" },
  // The Dispute Desk (resolve.aod.co.in in production, /resolve on localhost).
  { href: portalHref("/resolve"), label: "Dispute Desk" },
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

// Phones and tablets on any page but the homepage: a back arrow before the logo, as apps have
// (the installed app has no browser back button). It goes back within the site, or home when the
// visitor arrived on this page from elsewhere.
function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const moves = useRef(-1); // page changes inside the site since it opened (the first render counts as none)
  useEffect(() => {
    moves.current += 1;
  }, [pathname]);

  if (pathname === "/") return null;
  return (
    <button
      type="button"
      onClick={() => (moves.current > 0 ? router.back() : router.push("/"))}
      aria-label="Back"
      className="press -ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-wash lg:hidden"
    >
      <ChevronLeft className="h-6 w-6" aria-hidden />
    </button>
  );
}

// On the homepage the hero has its own big search box, so on phones and tablets the navbar's search
// row stays tucked away until that box has scrolled up under the navbar, then slides in.
function useHeroSearchGone(home: boolean) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!home) return;
    const box = document.getElementById("hero-search");
    if (!box) return;
    const seen = new IntersectionObserver(([entry]) => setGone(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      rootMargin: "-56px 0px 0px 0px",
    });
    seen.observe(box);
    return () => seen.disconnect();
  }, [home]);
  return home && gone;
}

// Laptops: logo, city, links, search, My bookings and "Get your artist" in one row.
// Phones and tablets (an app-style top bar): back arrow on inner pages, logo, the city pill, and
// the search bar under them; everything else is in the bottom tab bar (AppTabBar) and its More sheet.
export function Navbar() {
  const home = usePathname() === "/";
  const searchGone = useHeroSearchGone(home);

  return (
    // Solid white on phones (a blurred see-through bar costs every frame of scrolling there).
    <header className="sticky top-0 z-40 border-b border-transparent bg-white max-lg:border-line lg:bg-white/95 lg:backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-page items-center gap-3 px-4 sm:px-6 lg:h-16 lg:gap-4 lg:px-8 xl:gap-6" aria-label="Main">
        <div className="flex min-w-0 items-center">
          <BackButton />
          <Logo />
        </div>

        {/* Every link shows from 1024px. To fit them beside the search box on smaller laptops, the
            links are a little smaller below 1280px and the city picker waits until 1152px (the
            booking questions ask for the city when it isn't picked; phones and tablets use the city pill). */}
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

        <div className="ml-auto flex min-w-0 lg:hidden">
          <CitySheetButton />
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          {/* Customers' own bookings: a quiet outlined button, icon-only where space is tight. */}
          <Link
            href="/my-bookings"
            aria-label="My bookings"
            title="My bookings"
            className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line px-2.5 text-[0.9375rem] text-ink transition-colors hover:border-brand hover:text-brand"
          >
            <Ticket className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            <span className="hidden xl:inline">My bookings</span>
          </Link>
          <Link href="/book" className={buttonClasses("primary", "md")}>
            Get your artist
          </Link>
        </div>
      </nav>

      {/* Phones and tablets: a search bar under the logo row (Blinkit-style). On the homepage it
          hangs below the bar (out of the page flow, so nothing jumps) and only slides in once the
          hero's own search box has scrolled away. */}
      <div
        className={`px-4 pb-2.5 sm:px-6 lg:hidden ${
          home
            ? `absolute inset-x-0 top-full border-b border-line bg-white pt-0.5 transition duration-200 ${searchGone ? "" : "pointer-events-none invisible -translate-y-2 opacity-0"}`
            : ""
        }`}
      >
        <SearchBox variant="nav" />
      </div>
    </header>
  );
}
