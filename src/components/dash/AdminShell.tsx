"use client";

import Image from "next/image";
import Link from "@/components/ui/AppLink";
import { MainSiteLink } from "@/components/ui/MainSiteLink";
import { useAppPathname as usePathname, useAppRouter as useRouter } from "@/components/ui/AppLink";
import { backendEnabled } from "@/lib/backend";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AdminData, counts, useAdminError, useAdminSaving, useDb, useLiveConnection } from "@/lib/app-db";
import { SearchIcon } from "@/components/ui/SearchIcon";
import { btnMain } from "./ui";
import { AdminSignIn, setAdminSession, useAdminSession } from "./AdminSignIn";

// The admin around every page (design-tests/test2.html): the sidebar in three groups with what
// needs the team counted (orange when it's waiting on someone), and the top bar with search, the
// test-mode mark and New Booking. Phones: the sidebar becomes one scrolling row.

type Item = { href: string; label: string; count?: (c: ReturnType<typeof counts>) => number; hot?: boolean };
const groups: { title: string; items: Item[] }[] = [
  {
    title: "Work",
    items: [
      { href: "/admin", label: "Overview" },
      { href: "/admin/bookings", label: "Bookings", count: (c) => c.newRequests, hot: true },
      { href: "/admin/applications", label: "Applications", count: (c) => c.applications, hot: true },
      { href: "/admin/artists", label: "Artists" },
      { href: "/admin/calendar", label: "Calendar" },
      { href: "/admin/payments", label: "Payments", count: (c) => c.toVerify, hot: true },
      { href: "/admin/disputes", label: "Dispute Desk", count: (c) => c.cases, hot: true },
    ],
  },
  {
    title: "Talk",
    items: [
      { href: "/admin/chat", label: "Chat With Artists", count: (c) => c.unread, hot: true },
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/blog", label: "Blog" },
    ],
  },
  {
    title: "Team",
    items: [
      { href: "/admin/reports", label: "Reports And Exports" },
      { href: "/admin/team", label: "Team And Roles" },
      { href: "/admin/activity", label: "Activity Log" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  // Signed out (known only in the browser): the sign-in. While the page builds and hydrates, the
  // shell renders as usual, so every page stays in the tree.
  if (session === "") return <AdminSignIn />;
  return (
    <AdminData>
      <Shell email={session ?? ""}>{children}</Shell>
    </AdminData>
  );
}

// The header's state: Test Mode (preview), or live with Saving… while a change is being saved.
function ModeMark() {
  const saving = useAdminSaving();
  const connection = useLiveConnection();
  if (!backendEnabled) return null; // no "Test Mode" label (on request, 2026-11-21)
  return (
    <>
      <i className={`h-1.5 w-1.5 rounded-full ${connection === "live" ? "bg-[#1a9b4b]" : "bg-ink/30"}`} />
      {saving ? "Saving…" : connection === "live" ? "Live" : "Connecting…"}
    </>
  );
}

function Shell({ children, email }: { children: ReactNode; email: string }) {
  const path = usePathname();
  const db = useDb();
  const c = db ? counts(db) : null;
  // The signed-in team member, from Team And Roles (any email works in test mode).
  const me = db?.staff.find((s) => s.email.toLowerCase() === email);
  const name = me?.name ?? email;

  return (
    <div className="grid min-h-dvh text-sm md:grid-cols-[208px_1fr]">
      <aside className="flex items-center gap-4 overflow-x-auto border-b border-line px-4 py-3 md:sticky md:top-0 md:block md:h-dvh md:overflow-y-auto md:border-b-0 md:border-r md:px-[18px] md:py-[22px]">
        <Link href="/admin" className="block shrink-0" aria-label="AOD Admin overview">
          <Image src="/aod-wordmark-sm.png" alt="AOD." width={71} height={20} priority unoptimized className="h-5 w-auto" />
        </Link>
        <div className="mt-1 hidden text-xs text-muted md:block">Admin</div>
        <nav aria-label="Admin" className="flex gap-4 md:block">
          {/* Work, Talk and Team: orange headings with a line between the groups (on request,
              2026-11-21); on phones, where the menu is one row, a short upright line. */}
          {groups.map((g, i) => (
            <div key={g.title} className={`flex gap-4 md:block ${i > 0 ? "max-md:border-l max-md:border-line max-md:pl-4 md:mt-5 md:border-t md:border-line" : ""}`}>
              <p className={`mb-1 hidden text-xs font-medium text-brand md:block ${i > 0 ? "mt-4" : "mt-6"}`}>{g.title}</p>
              {g.items.map((it) => {
                const on = it.href === "/admin" ? path === "/admin" : path.startsWith(it.href);
                const n = c && it.count ? it.count(c) : 0;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-2 whitespace-nowrap py-[5px] transition-colors ${on ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
                  >
                    {on && <i className="h-1.5 w-1.5 rounded-full bg-brand" />}
                    {it.label}
                    {n > 0 && <b className={`ml-auto font-medium tabular-nums ${it.hot ? "text-brand" : "text-ink"}`}>{n}</b>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        {/* Phones: the menu is one scrolling row, so the button ends it. */}
        <MainSiteLink className="shrink-0 md:hidden" />
        <div className="hidden pt-8 text-xs text-muted md:block">
          <span className="block truncate">{name}</span>
          {/* Back To Main Site, just above Sign Out (on request, 2026-11-21): the admin is its own
              site (admin.aod.co.in). */}
          <MainSiteLink className="mt-4" />
          <span className="mt-4 flex gap-4">
            <button type="button" onClick={() => setAdminSession("")} className="hover:text-ink">
              Sign Out
            </button>
          </span>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-3 md:px-9">
          <AdminSearch />
          <span className="ml-auto hidden items-center gap-1.5 text-[13px] text-muted sm:flex">
            <ModeMark />
          </span>
          <Link href="/admin/bookings?new=1" className={`${btnMain} max-sm:ml-auto`}>
            New Booking
          </Link>
          <button
            type="button"
            title={`${name}${me ? `, ${me.role}` : ""}. Sign out`}
            aria-label={`Signed in as ${name}. Sign out`}
            onClick={() => setAdminSession("")}
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-ink text-xs font-medium uppercase text-paper"
          >
            {name.charAt(0)}
          </button>
        </div>
        <main className="max-w-[1240px] px-4 pb-24 pt-8 md:px-9">
          <LoadError />
          {children}
        </main>
      </div>
    </div>
  );
}

// Live: the data couldn't load (shown above the page).
function LoadError() {
  const error = useAdminError();
  return error ? (
    <p role="alert" className="mb-6 rounded-lg bg-wash p-4 text-red-600">
      {error}
    </p>
  ) : null;
}

// Search across orders, artists, applications and disputes; Ctrl K (or ⌘K) jumps to it.
function AdminSearch() {
  const db = useDb();
  const router = useRouter();
  const box = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        box.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!db || !t) return [];
    const has = (...s: string[]) => s.some((x) => x.toLowerCase().includes(t));
    return [
      ...db.bookings.filter((b) => has(b.id, b.customer, b.needs, b.city)).map((b) => ({ href: `/admin/bookings?open=${b.id}`, title: b.id, text: `${b.customer} · Booking` })),
      ...db.artists.filter((a) => has(a.id, a.name, a.craft)).map((a) => ({ href: `/admin/artists?open=${a.id}`, title: a.name, text: `${a.craft} · Artist` })),
      ...db.applications.filter((a) => has(a.id, a.name, a.craft)).map((a) => ({ href: `/admin/applications?open=${a.id}`, title: a.name, text: `${a.id} · Application` })),
      ...db.cases.filter((c) => has(c.id, c.name, c.about)).map((c) => ({ href: `/admin/disputes?open=${c.id}`, title: c.id, text: `${c.about} · Dispute` })),
    ].slice(0, 8);
  }, [db, q]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(href);
  };

  return (
    <div className="relative min-w-0 flex-1 md:max-w-[420px]">
      <label className="flex h-[34px] items-center gap-2 rounded-[7px] border border-line px-3 text-muted focus-within:border-ink">
        <SearchIcon className="h-3.5 w-3.5 shrink-0" />
        <input
          ref={box}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            else if (e.key === "Enter" && results[active]) go(results[active].href);
            else if (e.key === "Escape") box.current?.blur();
          }}
          placeholder="Search Orders, Artists, Cases"
          aria-label="Search orders, artists and cases"
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted"
        />
        <kbd className="hidden text-[11px] font-medium md:inline">Ctrl K</kbd>
      </label>
      {open && q.trim() && (
        <div className="absolute inset-x-0 top-10 z-40 rounded-lg border border-line bg-paper py-1 shadow-lg">
          {results.length ? (
            results.map((r, i) => (
              <button
                key={r.href}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r.href)}
                className={`block w-full px-3 py-2 text-left ${i === active ? "bg-wash" : ""}`}
              >
                {r.title}
                <small className="block text-xs text-muted">{r.text}</small>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-muted">Nothing found.</p>
          )}
        </div>
      )}
    </div>
  );
}
