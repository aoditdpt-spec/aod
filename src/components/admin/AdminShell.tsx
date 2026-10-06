"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileSpreadsheet,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  RotateCcw,
  Search,
  Settings,
  Ticket,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { roles } from "@/content/admin";
import { resetDb, signOut, useBrowserReady, useDb, useSession, type Db } from "@/lib/admin-store";
import { daysUntil, fieldClass, inr } from "./ui";

const nav = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: UserCheck, count: (db: Db) => db.applications.filter((a) => a.status === "submitted").length },
  { href: "/admin/artists", label: "Artists", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket, count: (db: Db) => db.bookings.filter((b) => b.status === "new").length },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, count: (db: Db) => db.payments.filter((p) => p.status === "pending").length },
  { href: "/admin/leads", label: "Leads", icon: Inbox, count: (db: Db) => db.leads.filter((l) => l.status === "new").length },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/reports", label: "Reports & exports", icon: FileSpreadsheet },
  { href: "/admin/team", label: "Team & roles", icon: ClipboardList },
  { href: "/admin/activity", label: "Activity log", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// Things that need someone's attention, worked out from the data.
export function useAlerts(db: Db | null) {
  return useMemo(() => {
    if (!db) return [];
    const out: { text: string; href: string; tone: "brand" | "wait" }[] = [];
    const pending = db.payments.filter((p) => p.status === "pending");
    if (pending.length) out.push({ text: `${pending.length} payment${pending.length > 1 ? "s" : ""} to verify (${inr(pending.reduce((n, p) => n + p.amount, 0))})`, href: "/admin/payments", tone: "brand" });
    const apps = db.applications.filter((a) => a.status === "submitted");
    if (apps.length) out.push({ text: `${apps.length} new artist application${apps.length > 1 ? "s" : ""}`, href: "/admin/applications", tone: "brand" });
    const fresh = db.bookings.filter((b) => b.status === "new");
    if (fresh.length) out.push({ text: `${fresh.length} booking request${fresh.length > 1 ? "s" : ""} to match`, href: "/admin/bookings", tone: "brand" });
    for (const b of db.bookings.filter((b) => b.status === "confirmed" && daysUntil(b.date) >= 0 && daysUntil(b.date) <= 2)) {
      out.push({ text: `${b.id} is ${daysUntil(b.date) === 0 ? "today" : daysUntil(b.date) === 1 ? "tomorrow" : "in 2 days"}: ${b.service}, ${b.city}`, href: `/admin/bookings?open=${b.id}`, tone: "wait" });
    }
    for (const b of db.bookings.filter((b) => b.delivery && daysUntil(b.delivery.expires) >= 0 && daysUntil(b.delivery.expires) <= 5)) {
      out.push({ text: `Delivery link for ${b.id} expires in ${daysUntil(b.delivery!.expires)} days`, href: `/admin/bookings?open=${b.id}`, tone: "wait" });
    }
    for (const a of db.applications.filter((a) => a.status === "meeting" && a.meeting && daysUntil(a.meeting.at.slice(0, 10)) <= 2 && daysUntil(a.meeting.at.slice(0, 10)) >= 0)) {
      out.push({ text: `Meeting with ${a.name} soon`, href: `/admin/applications?open=${a.id}`, tone: "wait" });
    }
    const dues = db.payouts.filter((p) => p.status === "due");
    if (dues.length) out.push({ text: `${dues.length} artist payout${dues.length > 1 ? "s" : ""} due`, href: "/admin/payments?tab=payouts", tone: "wait" });
    return out;
  }, [db]);
}

function GlobalSearch({ db }: { db: Db }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    const hit = (...v: (string | undefined)[]) => v.some((x) => x?.toLowerCase().includes(s));
    return [
      ...db.bookings.filter((b) => hit(b.id, b.customer.name, b.service, b.city)).map((b) => ({ href: `/admin/bookings?open=${b.id}`, label: `${b.id} · ${b.customer.name}`, hint: "Booking" })),
      ...db.artists.filter((a) => hit(a.id, a.name, a.city)).map((a) => ({ href: `/admin/artists?open=${a.id}`, label: a.name, hint: "Artist" })),
      ...db.applications.filter((a) => hit(a.id, a.name)).map((a) => ({ href: `/admin/applications?open=${a.id}`, label: a.name, hint: "Application" })),
      ...db.leads.filter((l) => hit(l.id, l.name, l.need)).map((l) => ({ href: `/admin/leads?open=${l.id}`, label: l.name, hint: "Lead" })),
      ...db.payments.filter((p) => hit(p.id, p.utr, p.payer, p.bookingId)).map((p) => ({ href: `/admin/payments?open=${p.id}`, label: `${p.id} · ${p.payer}`, hint: "Payment" })),
    ].slice(0, 8);
  }, [q, db]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Search bookings, artists, leads, UTR…"
        aria-label="Search everything"
        className={`${fieldClass} pl-9`}
      />
      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl">
          {results.map((r) => (
            <li key={r.href}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQ("");
                  setOpen(false);
                  router.push(r.href);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-wash"
              >
                <span className="truncate text-ink">{r.label}</span>
                <span className="shrink-0 text-xs text-muted">{r.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Alerts({ db }: { db: Db }) {
  const alerts = useAlerts(db);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Alerts (${alerts.length})`} aria-expanded={open} className="relative rounded-lg p-2 text-ink hover:bg-wash">
        <Bell className="h-5 w-5" aria-hidden />
        {alerts.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[0.65rem] font-medium text-white">{alerts.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-line bg-white p-2 shadow-xl">
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">Needs attention</p>
          {alerts.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">All clear.</p>
          ) : (
            <ul>
              {alerts.map((a) => (
                <li key={a.text}>
                  <Link href={a.href} onClick={() => setOpen(false)} className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm text-ink hover:bg-wash">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.tone === "brand" ? "bg-brand" : "bg-amber-500"}`} aria-hidden />
                    {a.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Signed-in admin layout: sidebar, top bar (search, alerts, account) and the page.
// Sends anyone without a (preview) session back to the sign-in page.
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useBrowserReady();
  const session = useSession();
  const db = useDb();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (ready && !session) router.replace("/admin");
  }, [ready, session, router]);

  if (!ready || !session || !db) {
    return <div className="flex flex-1 items-center justify-center p-10 text-sm text-muted">Loading…</div>;
  }

  const roleLabel = roles.find((r) => r.id === session.role)?.label;
  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-1 overflow-y-auto p-3">
      <ul className="space-y-0.5">
        {nav.map(({ href, label, icon: I, count }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const n = count?.(db) ?? 0;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setMenu(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-peach/60 font-medium text-ink" : "text-body hover:bg-wash"}`}
              >
                <I className={`h-4 w-4 ${active ? "text-brand" : "text-muted"}`} aria-hidden />
                <span className="flex-1">{label}</span>
                {n > 0 && <span className="rounded-full bg-brand px-1.5 text-[0.7rem] font-medium text-white">{n}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-1 border-t border-line pt-3 text-sm">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Replace everything with fresh sample data? Your changes in this browser will be lost.")) resetDb();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body hover:bg-wash"
        >
          <RotateCcw className="h-4 w-4 text-muted" aria-hidden /> Reset sample data
        </button>
        <button
          type="button"
          onClick={() => {
            signOut();
            router.replace("/admin");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-body hover:bg-wash"
        >
          <LogOut className="h-4 w-4 text-muted" aria-hidden /> Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-full flex-1 flex-col bg-wash">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-white px-3 sm:px-5">
        <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Menu" className="rounded-lg p-2 hover:bg-wash lg:hidden">
          {menu ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
        <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-2">
          <Image src="/aod-wordmark.png" alt="AOD" width={708} height={200} priority className="h-5 w-auto" />
          <span className="rounded-md bg-night px-2 py-0.5 text-xs font-medium text-white">Admin</span>
        </Link>
        <div className="hidden flex-1 justify-center md:flex">
          <GlobalSearch db={db} />
        </div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <span className="hidden rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 sm:inline" title="Sample data kept in this browser">
            Sample data
          </span>
          <Alerts db={db} />
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-medium leading-tight text-ink">{session.name}</span>
            <span className="block text-xs leading-tight text-muted">{roleLabel}</span>
          </span>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-line bg-white lg:block">{sidebar}</aside>
        {menu && (
          <div className="fixed inset-0 top-14 z-30 lg:hidden">
            <button type="button" aria-label="Close menu" onClick={() => setMenu(false)} className="absolute inset-0 bg-night/30" />
            <aside className="relative h-full w-64 bg-white shadow-xl">{sidebar}</aside>
          </div>
        )}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 md:hidden">
            <GlobalSearch db={db} />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
