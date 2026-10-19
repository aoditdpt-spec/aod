"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import {
  Building2,
  CalendarPlus,
  ChevronRight,
  House,
  Info,
  LayoutGrid,
  LockKeyhole,
  Menu,
  Newspaper,
  Palette,
  Phone,
  Scale,
  Share2,
  Ticket,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { legalDocs } from "@/content/legal";
import { appMenu, brand } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { portalHref, siteUrl } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";

const icons: Record<string, LucideIcon> = {
  home: House,
  book: CalendarPlus,
  ticket: Ticket,
  grid: LayoutGrid,
  building: Building2,
  scale: Scale,
  info: Info,
  palette: Palette,
  join: UserPlus,
  lock: LockKeyhole,
  blog: Newspaper,
};

// Inside the installed app only (the `standalone:` variant, so the website itself is unchanged),
// on phones and tablets: a bottom tab bar like a native app's (Home, Book, My bookings, More).
// "More" opens a sheet with every other place: business, the Resolution Centre, about, the artist
// portal, joining, the team's admin sign-in, sharing, WhatsApp, a call and the policies. The app has
// no address bar, so this is how people reach the separate sites; those open on their own domains
// (an in-app browser tab), each installable as its own app.
export function AppTabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string) =>
    href === "/" ? pathname === "/" : href === "/book" ? pathname.startsWith("/book") || pathname.startsWith("/categories") : pathname.startsWith(href);

  async function share() {
    const data = { title: brand.fullName, text: appMenu.shareText, url: siteUrl };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
    } catch {
      // Closed the share sheet, or the clipboard is blocked: nothing to do.
    }
  }

  const tab = "flex h-16 flex-col items-center justify-center gap-1 text-[0.85rem] font-medium transition-colors";

  return (
    <>
      {/* Room at the bottom of the page so the bar never covers the footer's last line. */}
      <div aria-hidden className="hidden h-[calc(5.5rem+env(safe-area-inset-bottom))] standalone:max-lg:block" />

      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-[55] hidden select-none border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur standalone:max-lg:block"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-4">
          {appMenu.tabs.map((t) => {
            const Icon = icons[t.icon];
            const on = !open && active(t.href);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={on ? "page" : undefined} className={`${tab} ${on ? "text-brand" : "text-muted"}`}>
                  <Icon className="h-6 w-6" strokeWidth={on ? 2.4 : 1.8} aria-hidden />
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${tab} w-full ${open ? "text-brand" : "text-muted"}`}>
              <Menu className="h-6 w-6" strokeWidth={open ? 2.4 : 1.8} aria-hidden />
              {appMenu.more}
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            key="more"
            className="fixed inset-0 z-[54] flex items-end bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <m.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-more-title"
              className="max-h-[85svh] w-full overflow-y-auto rounded-t-[1.5rem] bg-white px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3"
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ y: "100%", transition: { duration: 0.2 } }}
            >
              <div className="mx-auto h-1.5 w-12 rounded-full bg-line" aria-hidden />
              <div className="mt-3 flex items-center justify-between">
                <h2 id="app-more-title" className="text-xl font-bold">
                  {appMenu.title}
                </h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-2 text-muted hover:bg-wash hover:text-ink">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {appMenu.groups.map((g) => (
                <section key={g.title} className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{g.title}</p>
                  <ul className="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line">
                    {g.links.map((l) => {
                      const Icon = icons[l.icon];
                      return (
                        <li key={l.href}>
                          <Link href={portalHref(l.href)} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 active:bg-wash">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-peach text-brand">
                              <Icon className="h-5 w-5" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-ink">{l.label}</span>
                              <span className="block truncate text-sm text-muted">{l.note}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              <div className="mt-5 grid grid-cols-3 gap-2 text-sm font-medium text-ink">
                <button type="button" onClick={share} className="flex flex-col items-center gap-1.5 rounded-xl border border-line px-2 py-3 active:bg-wash">
                  <Share2 className="h-5 w-5 text-brand" aria-hidden />
                  {copied ? appMenu.shared : appMenu.share}
                </button>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 rounded-xl border border-line px-2 py-3 text-center active:bg-wash">
                  <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
                  {appMenu.whatsapp}
                </a>
                <a href={brand.phoneHref} className="flex flex-col items-center gap-1.5 rounded-xl border border-line px-2 py-3 active:bg-wash">
                  <Phone className="h-5 w-5 text-brand" aria-hidden />
                  {appMenu.call}
                </a>
              </div>

              <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
                {legalDocs.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/${d.slug}`} onClick={() => setOpen(false)} className="underline-offset-2 hover:underline">
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
