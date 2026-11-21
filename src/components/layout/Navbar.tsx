"use client";

import Link from "@/components/ui/AppLink";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { nav, navLinks } from "@/data/site";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchDialog } from "@/components/layout/SearchDialog";
import { SearchIcon } from "@/components/ui/SearchIcon";
import { startTyping } from "@/lib/typing";

const ease = [0.22, 1, 0.36, 1] as const;

// The top bar on every page, full width with the logo at the far left.
// Laptops (1024px and up): logo, For Business / For Artists / Dispute Desk / About Us with a soft
// pill that glides to whichever one the pointer is on, then the search bar, My Bookings and
// Get Your Artist at the far right. Phones and tablets: logo, then apple.com's search and menu
// buttons at the right (the menu opens full screen); My Bookings and Get Your Artist are in the
// bottom bar (BottomBar.tsx). A black line under it separates it from the page. It hides while
// scrolling down, comes back on any scroll up, and turns see-through with a blur once the page
// has moved. Text only, except the search magnifier and the phones' menu lines.
export function Navbar() {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  // The menu remembers the page it was opened on, so moving to another page closes it.
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const menuOpen = menuFor === pathname;
  const closeMenu = useCallback(() => setMenuFor(null), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openSearch = () => {
    closeMenu();
    setSearchOpen(true);
  };

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const before = scrollY.getPrevious() ?? 0;
    setScrolled(y > 4);
    setHidden(y > before && y > 160);
  });
  const showBar = !hidden || menuOpen || searchOpen;

  // Ctrl / ⌘ K opens search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenuFor(null);
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const solid = scrolled || menuOpen;

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: showBar ? 0 : "-100%" }}
        transition={{ duration: 0.35, ease }}
        className={`sticky top-0 z-50 border-b border-ink transition-[background-color] duration-300 ${
          solid ? "bg-glass backdrop-blur-md" : "bg-paper"
        }`}
      >
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6 lg:gap-6">
          <Logo onClick={closeMenu} />

          {/* Laptop links. The pill behind them follows the pointer (shared layout animation). */}
          <nav aria-label="Main" className="hidden items-center lg:flex" onPointerLeave={() => setHovered(null)}>
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onPointerEnter={() => setHovered(l.href)}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`relative flex h-9 items-center rounded-full px-3 text-sm transition-colors xl:px-3.5 ${
                  isActive(l.href) ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {hovered === l.href && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.45 }}
                    className="absolute inset-0 rounded-full bg-wash"
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SearchBar onOpen={openSearch} />
            {/* Phones: apple.com's two buttons, search then the menu. While the search is open
                the magnifier fades away and the menu button's cross closes the search. */}
            <motion.button
              type="button"
              onClick={openSearch}
              aria-label={nav.searchLong}
              animate={{ opacity: searchOpen ? 0 : 1 }}
              transition={{ duration: 0.2 }}
              className={`grid h-10 w-10 place-items-center text-ink lg:hidden ${searchOpen ? "pointer-events-none" : ""}`}
            >
              <SearchIcon className="h-5 w-5" strokeWidth={1.6} />
            </motion.button>
            <Hamburger
              open={menuOpen || searchOpen}
              label={searchOpen ? "Close search" : menuOpen ? "Close menu" : "Open menu"}
              onClick={() => (searchOpen ? closeSearch() : menuOpen ? closeMenu() : setMenuFor(pathname))}
            />

            <Link
              href="/my-bookings"
              aria-current={isActive("/my-bookings") ? "page" : undefined}
              className="hidden h-9 items-center rounded-full px-3 text-sm text-ink transition-colors hover:bg-wash lg:flex"
            >
              {nav.myBookings}
            </Link>

            <Link
              href="/book"
              onClick={closeMenu}
              className="hidden h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-[background-color,transform] hover:bg-brand-hover active:scale-[0.97] lg:inline-flex"
            >
              {nav.cta}
            </Link>

          </div>
        </div>
      </motion.header>

      <MobileMenu id="mobile-menu" open={menuOpen} onClose={closeMenu} />
      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </>
  );
}

// Laptops: the search bar as on aod.co.in, a rounded box with the magnifier in front and the
// names of artists and services typing themselves in. A click opens the search.
function SearchBar({ onOpen }: { onOpen: () => void }) {
  const typed = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      startTyping(nav.searchWords, (text) => {
        if (typed.current) typed.current.textContent = text;
      }),
    [],
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={nav.searchLong}
      className="hidden h-9 w-52 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-left text-sm text-muted transition-colors hover:border-muted lg:flex xl:w-64"
    >
      <SearchIcon className="h-4 w-4 shrink-0 text-ink" />
      <span className="flex min-w-0 items-center overflow-hidden whitespace-nowrap">
        <span ref={typed}>{nav.searchWords[0]}</span>
        <span aria-hidden className="ml-px h-4 w-px animate-pulse bg-muted" />
      </span>
    </button>
  );
}

// apple.com's menu button: two thin lines that, on open, first slide together and then turn
// into a cross; on close the cross turns back first and the lines then part.
function Hamburger({ open, label, onClick }: { open: boolean; label: string; onClick: () => void }) {
  const line = (dir: 1 | -1) => ({
    closed: { y: 0, rotate: 0, transition: { rotate: { duration: 0.18, ease }, y: { delay: 0.18, duration: 0.18, ease } } },
    open: { y: 4.25 * dir, rotate: 45 * dir, transition: { y: { duration: 0.18, ease }, rotate: { delay: 0.18, duration: 0.22, ease } } },
  });
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={label}
      className="-mr-2 grid h-10 w-10 place-items-center text-ink lg:hidden"
    >
      <motion.span initial={false} animate={open ? "open" : "closed"} aria-hidden className="relative block h-[10px] w-5">
        <motion.span variants={line(1)} className="absolute inset-x-0 top-0 h-[1.5px] rounded-full bg-current" />
        <motion.span variants={line(-1)} className="absolute inset-x-0 bottom-0 h-[1.5px] rounded-full bg-current" />
      </motion.span>
    </button>
  );
}
