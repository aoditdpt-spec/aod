"use client";

import Link from "@/components/ui/AppLink";
import { usePathname } from "next/navigation";
import { nav } from "@/data/site";

// Phones and tablets: an app-style bar fixed to the bottom of the screen with My Bookings and
// Get Your Artist, always within thumb's reach (laptops have both in the top bar). A black line
// above it matches the one under the top bar. The page leaves room for it (see the layout).
export function BottomBar() {
  const pathname = usePathname();
  const onBookings = pathname === "/my-bookings" || pathname.startsWith("/my-bookings/");

  return (
    <nav
      aria-label="Bookings"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink bg-paper px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:hidden"
    >
      <div className="grid grid-cols-[1fr_1.35fr] gap-3">
        <Link
          href="/my-bookings"
          aria-current={onBookings ? "page" : undefined}
          className={`flex h-11 items-center justify-center rounded-lg border text-[15px] font-medium text-ink transition-[border-color,transform] active:scale-[0.97] ${
            onBookings ? "border-ink" : "border-line hover:border-ink"
          }`}
        >
          {nav.myBookings}
        </Link>
        <Link
          href="/book"
          className="flex h-11 items-center justify-center rounded-lg bg-brand text-[15px] font-medium text-white transition-[background-color,transform] hover:bg-brand-hover active:scale-[0.97]"
        >
          {nav.cta}
        </Link>
      </div>
    </nav>
  );
}
