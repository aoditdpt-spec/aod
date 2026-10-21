"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CalendarPlus,
  ChevronRight,
  Compass,
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
  type LucideIcon,
} from "lucide-react";
import { legalDocs } from "@/content/legal";
import { appMenu, brand } from "@/content/site";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { CityChips } from "@/components/location/CityPicker";
import { portalHref, siteUrl } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";

const icons: Record<string, LucideIcon> = {
  explore: Compass,
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

// On phones and tablets (below 1024px), on the website and in the installed app alike: a bottom tab
// bar like a native app's, modelled on Headout's (Explore, Categories, Book, Bookings, More). "More"
// opens a sheet with the city and every other place: business, the Dispute Desk, about, the artist
// portal, joining, the team's admin sign-in, sharing, WhatsApp, a call and the policies. The app has
// no address bar, so this is how people reach the separate sites; those open on their own domains
// (an in-app browser tab), each installable as its own app. The sheet sits above the bar, so the
// tabs stay tappable while it's open, and it closes when the page changes.
export function AppTabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = (href: string) =>
    href === "/"
      ? pathname === "/"
      : href === "/categories"
        ? pathname.startsWith("/categories")
        : pathname.startsWith(href);

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

  const tab = "press flex h-[4.25rem] w-full flex-col items-center justify-center gap-1 text-[0.9rem] leading-none";

  return (
    <>
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-[61] select-none border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {appMenu.tabs.map((t) => {
            const Icon = icons[t.icon];
            const on = !open && active(t.href);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  onClick={() => setOpen(false)}
                  aria-current={on ? "page" : undefined}
                  className={`${tab} ${on ? "font-bold text-ink" : "font-medium text-muted"}`}
                >
                  <Icon className={`h-6 w-6 ${on ? "text-brand" : ""}`} strokeWidth={on ? 2.3 : 1.8} aria-hidden />
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className={`${tab} ${open ? "font-bold text-ink" : "font-medium text-muted"}`}
            >
              <Menu className={`h-6 w-6 ${open ? "text-brand" : ""}`} strokeWidth={open ? 2.3 : 1.8} aria-hidden />
              {appMenu.more}
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={open} onClose={() => setOpen(false)} title={appMenu.title} bottomGap>
        <div className="rounded-2xl bg-wash p-4">
          <CityChips />
        </div>

        {appMenu.groups.map((g) => (
          <section key={g.title} className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{g.title}</p>
            <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {g.links.map((l) => {
                const Icon = icons[l.icon];
                return (
                  <li key={l.href}>
                    <Link href={portalHref(l.href)} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 active:bg-wash">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-peach text-brand">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{l.label}</span>
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
          <button type="button" onClick={share} className="press flex flex-col items-center gap-1.5 rounded-2xl border border-line px-2 py-3 active:bg-wash">
            <Share2 className="h-5 w-5 text-brand" aria-hidden />
            {copied ? appMenu.shared : appMenu.share}
          </button>
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="press flex flex-col items-center gap-1.5 rounded-2xl border border-line px-2 py-3 text-center active:bg-wash">
            <WhatsAppIcon className="h-5 w-5 text-whatsapp" />
            {appMenu.whatsapp}
          </a>
          <a href={brand.phoneHref} className="press flex flex-col items-center gap-1.5 rounded-2xl border border-line px-2 py-3 active:bg-wash">
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
      </Sheet>
    </>
  );
}
