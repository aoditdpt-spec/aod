"use client";

import Image from "next/image";
import { useEffect, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import Link, { useAppPathname as usePathname, useAppRouter } from "@/components/ui/AppLink";
import { MainSiteLink } from "@/components/ui/MainSiteLink";
import { backendEnabled } from "@/lib/backend";
import { artistUnread, myOrders, PortalData, portalLive, useDb, usePortalInfo } from "@/lib/app-db";
import { setPortalEmail } from "@/lib/portal-session";
import { Loading } from "./ui";

// The artist portal around every page (design-tests/test1.html): the sidebar with what needs the
// artist counted in orange, and the artist at the bottom. Phones: one scrolling row. Live: only for
// someone signed in with an email AOD knows as an artist or applicant (src/lib/app-db.tsx).
const items: { href: string; label: string; count?: "requests" | "messages" }[] = [
  { href: "/artists/dashboard", label: "Overview" },
  { href: "/artists/availability", label: "Availability" },
  { href: "/artists/approval", label: "Approval" },
  { href: "/artists/profile", label: "Profile" },
  { href: "/artists/portfolio", label: "Portfolio" },
  { href: "/artists/bookings", label: "Bookings", count: "requests" },
  { href: "/artists/messages", label: "Messages", count: "messages" },
  { href: "/artists/documents", label: "Documents" },
];

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <PortalData>
      <Gate>
        <Shell>{children}</Shell>
      </Gate>
    </PortalData>
  );
}

// Live: signed-out visitors go to the sign-in; an email with no artist or application is told so.
function Gate({ children }: { children: ReactNode }) {
  const info = usePortalInfo();
  const router = useAppRouter();
  const signedOut = backendEnabled && info.status === "signed-out";
  useEffect(() => {
    if (signedOut) router.replace("/artists");
  }, [signedOut, router]);
  if (!backendEnabled) return <>{children}</>;
  if (info.status === "loading" || signedOut) return <Loading />;
  if (info.status === "no-account")
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <h1 className="text-[28px]">No Artist Profile</h1>
        <p className="mt-3 text-muted">AOD has no artist or application with {info.email}. Use the email you signed up with, or apply to join.</p>
        <div className="mt-6 flex gap-4">
          <Link href="/artists/apply" className="font-medium underline underline-offset-4">
            Apply To Join
          </Link>
          <button type="button" onClick={() => void portalLive.portalSignOut()} className="text-muted hover:text-ink">
            Sign Out
          </button>
        </div>
      </div>
    );
  if (info.status === "error") return <p className="px-4 py-24 text-center text-muted">Couldn&apos;t load your portal just now. Please refresh the page.</p>;
  return <>{children}</>;
}

function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const db = useDb();
  const router = useAppRouter();
  const n = db ? { requests: myOrders(db).toAnswer.length, messages: artistUnread(db) } : { requests: 0, messages: 0 };
  const me = db?.artists.find((a) => a.id === db.me) ?? (db?.applications.find((a) => a.id === db.me) ? { photo: db.applications[0].photo, name: db.applications[0].name, craft: db.applications[0].craft } : undefined);
  const signOut = async () => {
    if (backendEnabled) {
      await portalLive.portalSignOut();
      router.replace("/artists");
    } else {
      setPortalEmail("");
      router.push("/artists");
    }
  };

  return (
    <div className="grid min-h-dvh text-[15px] md:grid-cols-[220px_1fr]">
      <aside className="flex items-center gap-4 overflow-x-auto border-b border-line px-4 py-3 md:sticky md:top-0 md:h-dvh md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-5 md:py-6">
        <Link href="/artists/dashboard" className="block shrink-0 self-start" aria-label="Artist Portal overview">
          <Image src="/aod-wordmark-sm.png" alt="AOD." width={78} height={22} priority unoptimized className="h-[22px] w-auto" />
        </Link>
        <div className="-mt-2 hidden text-[13px] text-muted md:block">Artist Portal</div>
        <nav aria-label="Artist portal" className="flex gap-[18px] md:mt-7 md:block">
          {items.map((it) => {
            const on = path.startsWith(it.href);
            const c = it.count ? n[it.count] : 0;
            return (
              <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined} className={`flex items-center gap-2 whitespace-nowrap py-[7px] transition-colors ${on ? "font-medium text-ink" : "text-muted hover:text-ink"}`}>
                {on && <i className="h-1.5 w-1.5 rounded-full bg-brand" />}
                {it.label}
                {c > 0 && <span className="ml-auto text-[13px] font-semibold text-brand">{c}</span>}
              </Link>
            );
          })}
        </nav>
        {/* Phones: the menu is one scrolling row, so the button ends it. */}
        <MainSiteLink className="shrink-0 md:hidden" />
        <div className="mt-auto hidden md:block">
          {me && (
            <div className="flex items-center gap-2.5 text-sm">
              <Avatar src={me.photo} name={me.name} size={32} />
              <div>
                {db?.profile.name || me.name}
                <small className="block text-xs text-muted">{me.craft}</small>
              </div>
            </div>
          )}
          {/* Back To Main Site, just above Sign Out (on request, 2026-11-21): the portal is its own
              site (artists.aod.co.in). */}
          <MainSiteLink className="mt-5" />
          <div className="mt-4 flex gap-4 text-xs text-muted">
            <button type="button" onClick={() => void signOut()} className="hover:text-ink">
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 max-w-[1120px] px-4 pb-24 pt-7 md:px-12 md:pt-10">{children}</main>
    </div>
  );
}
