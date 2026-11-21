"use client";

import Link from "@/components/ui/AppLink";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Stage } from "@/lib/app-db";
import { useMounted } from "@/lib/use-mounted";

// The admin's and the artist portal's building blocks, from the design tests
// (aod/design-tests/test1.html and test2.html): thin lines instead of boxes, black and white,
// orange only for what needs someone and the main action. Light mode only.

const btnBase = "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-[7px] px-3.5 text-[13px] font-medium transition-colors disabled:opacity-40";
export const btn = `${btnBase} border border-line bg-paper text-ink hover:border-ink`;
export const btnMain = `${btnBase} border border-brand bg-brand text-white hover:border-brand-hover hover:bg-brand-hover`;
export const btnText = `${btnBase} text-muted hover:bg-wash hover:text-ink`;
export const btnInk = `${btnBase} border border-ink bg-paper text-ink hover:bg-ink hover:text-paper`;
export const field = "h-10 w-full rounded-[7px] border border-line bg-paper px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-ink";
export const label = "mb-1.5 block text-[13px] text-muted";
export const th = "border-b border-ink pb-2 pr-3 text-left text-xs font-normal text-muted";
export const td = "border-b border-line py-3 pr-3 align-top";
export const sub = "block text-xs text-muted";

// A dot and a label. "hot" is orange (needs someone); the greys step down to "dim" for done.
export type Tone = "hot" | "ink" | "mid" | "soft" | "dim";
const dot: Record<Tone, string> = { hot: "bg-brand", ink: "bg-ink", mid: "bg-ink/60", soft: "bg-ink/35", dim: "bg-ink/20" };
export function Status({ tone = "ink", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${tone === "dim" ? "text-muted" : ""}`}>
      <i className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[tone]}`} />
      {children}
    </span>
  );
}
export const stageTone: Record<Stage, Tone> = { new: "hot", matched: "ink", advance: "mid", confirmed: "soft", completed: "dim", cancelled: "dim" };

// A section's heading row: the title on the left, a link, count or tabs on the right.
export function Head({ title, children, className = "" }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`mb-3 flex flex-wrap items-baseline justify-between gap-3 ${className}`}>
      <h2 className="text-[17px]">{title}</h2>
      {children && <div className="text-[13px] text-muted">{children}</div>}
    </div>
  );
}

export function HeadLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-[13px] text-muted transition-colors hover:text-ink">
      {children}
    </Link>
  );
}

// The page's title, its one line, and its buttons.
export function Title({ title, text, children }: { title: string; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px]">{title}</h1>
        {text && <p className="mt-1 text-muted">{text}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

// The row of key numbers under a black line; "hot" ones are orange.
export type Num = { value: string; label: string; note?: string; hot?: boolean; href?: string };
export function Nums({ items, className = "" }: { items: Num[]; className?: string }) {
  return (
    <div className={`mt-7 grid grid-cols-2 border-y border-b-line border-t-ink sm:grid-cols-3 xl:grid-cols-5 ${className}`}>
      {items.map((n) => {
        const inner = (
          <>
            <b className={`block text-[26px] font-medium tracking-tight tabular-nums ${n.hot ? "text-brand" : ""}`}>{n.value}</b>
            <span className="text-[13px] text-muted">{n.label}</span>
            {n.note && <small className={`mt-1.5 block text-xs ${n.hot ? "text-brand" : "text-muted"}`}>{n.note}</small>}
          </>
        );
        const cls = "block border-b border-line py-[18px] pr-4 transition-colors max-xl:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:border-r xl:pl-0 xl:last:border-r-0 xl:[&:not(:first-child)]:pl-[18px]";
        return n.href ? (
          <Link key={n.label} href={n.href} className={`${cls} hover:bg-wash`}>
            {inner}
          </Link>
        ) : (
          <div key={n.label} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

// Text tabs (Open / This Week / All), underlined when on.
export function Tabs<T extends string>({ options, value, onChange }: { options: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`border-b pb-0.5 transition-colors ${value === o.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
        >
          {o.label}
          {o.count !== undefined && <span className="ml-1 tabular-nums">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

// The record open in the drawer, kept in the address (?open=<id>) so Back closes it.
export function useOpen() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const value = params.get("open");
  return {
    value,
    isNew: params.get("new") === "1",
    open: (id: string) => router.push(`${path}?open=${encodeURIComponent(id)}`, { scroll: false }),
    close: () => router.push(path, { scroll: false }),
  };
}

// A panel from the right (the whole screen on phones), over the page.
export function Drawer({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode }) {
  const mounted = useMounted();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-[480px] flex-col bg-paper text-sm shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl">{title}</h2>
            {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className={btnText}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// Label / value rows in a drawer.
export function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[120px_1fr] gap-3 py-2.5">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

// An on / off switch (Settings).
export function Toggle({ on, onChange, label: text }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={text} onClick={() => onChange(!on)} className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-ink" : "bg-line"}`}>
      <i className={`absolute top-1 h-4 w-4 rounded-full bg-paper transition-[left] ${on ? "left-5" : "left-1"}`} />
    </button>
  );
}

export function Loading() {
  return <p className="py-10 text-muted">Loading…</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="border-y border-line py-6 text-muted">{children}</p>;
}
