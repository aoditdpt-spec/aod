"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck2, CalendarDays, FileCheck2, Images, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { portalSignOut, usePortalMode } from "@/lib/artist-live";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { useBookings } from "./BookingCard";

export const portalLinks = [
  { href: "/artists/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/artists/profile", label: "Profile", icon: UserRound },
  { href: "/artists/portfolio", label: "Portfolio", icon: Images },
  { href: "/artists/bookings", label: "Bookings", icon: CalendarCheck2 },
  { href: "/artists/availability", label: "Availability", icon: CalendarDays },
  { href: "/artists/documents", label: "Documents", icon: FileCheck2 },
];

const helpUrl = whatsappUrl("Hi AOD, I need help with the artist portal.");

// Signed-in navigation: a sidebar from 1024px up, a scrollable tab row below that.
export function PortalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const mode = usePortalMode();
  const bookings = useBookings();
  const newRequests = mode === "live" ? bookings.filter((b) => b.status === "new").length : 0;

  const items = portalLinks.map((l) => {
    const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
    const count = l.href === "/artists/bookings" && newRequests > 0 ? newRequests : null;
    return { ...l, active, count };
  });

  return (
    <>
      {/* Phones and tablets */}
      <nav aria-label="Portal" className="sticky top-16 z-20 border-b border-line bg-white lg:hidden">
        <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
          {items.map(({ href, label, icon: I, active, count }) => (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${active ? "bg-peach/60 font-medium text-ink" : "text-body hover:bg-wash"}`}
              >
                <I className={`h-4 w-4 ${active ? "text-brand" : "text-muted"}`} aria-hidden />
                {label}
                {count && <span className="rounded-full bg-brand px-1.5 text-[0.7rem] font-medium text-white">{count}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Laptops and up */}
      <nav aria-label="Portal" className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-line bg-white px-3 py-6 lg:flex">
        <ul className="space-y-1">
          {items.map(({ href, label, icon: I, active, count }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] transition-colors ${
                  active ? "bg-peach/60 font-medium text-ink" : "text-body hover:bg-wash"
                }`}
              >
                <I className={`h-[1.125rem] w-[1.125rem] ${active ? "text-brand" : "text-muted"}`} aria-hidden />
                <span className="flex-1">{label}</span>
                {count && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">{count}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] text-body hover:bg-wash"
          >
            <WhatsAppIcon className="h-[1.125rem] w-[1.125rem] text-whatsapp" /> Help on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => void portalSignOut().then(() => router.push("/artists"))}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] text-body hover:bg-wash"
          >
            <LogOut className="h-[1.125rem] w-[1.125rem] text-muted" aria-hidden /> Sign out
          </button>
        </div>
      </nav>
    </>
  );
}
