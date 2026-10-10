"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { can, templates, type Permission, type TemplateId, type Tone } from "@/content/admin";
import { categories } from "@/content/site";
import { useSession, type Db, type PortfolioFile } from "@/lib/admin-store";

// ---- Formatting ----

export const inr = (n: number | undefined) => (n === undefined || n === null ? "—" : `₹${n.toLocaleString("en-IN")}`);

export const fmtDate = (iso: string | undefined, withTime = false) => {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
};

export const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : fmtDate(iso);
};

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ISO time → value for <input type="datetime-local"> (local time, no seconds).
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// yyyy-mm-dd plus n days.
export const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const daysUntil = (ymd: string) => Math.round((new Date(`${ymd}T00:00:00`).getTime() - new Date(`${todayKey()}T00:00:00`).getTime()) / 86400000);

export const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

export const artistName = (db: Db, id?: string) => (id ? db.artists.find((a) => a.id === id)?.name ?? id : "—");

// ---- WhatsApp ----

// wa.me link to a specific number (customer, artist or applicant), with the message ready.
export function whatsappTo(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function fillTemplate(id: TemplateId, vars: Record<string, string>) {
  const t = templates.find((x) => x.id === id);
  return (t?.text ?? "").replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

// ---- Permissions ----

export function useCan() {
  const session = useSession();
  return (p: Permission) => (session ? can(session.role, p) : false);
}

// A button that's disabled (with an explanation) when the signed-in role can't do the action.
export function ActionButton({
  permission,
  variant = "primary",
  className = "",
  children,
  ...rest
}: { permission?: Permission; variant?: "primary" | "secondary" | "danger" | "whatsapp" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const allowed = useCan();
  const blocked = permission ? !allowed(permission) : false;
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-hover",
    secondary: "border border-line bg-white text-ink hover:border-ink",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    whatsapp: "bg-whatsapp text-white hover:bg-whatsapp-hover",
  };
  return (
    <button
      type="button"
      {...rest}
      disabled={blocked || rest.disabled}
      title={blocked ? "Your role can't do this" : rest.title}
      className={`inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ---- Display ----

const toneClass: Record<Tone, string> = {
  brand: "bg-peach text-brand-hover",
  wait: "bg-amber-50 text-amber-800",
  good: "bg-emerald-50 text-emerald-700",
  bad: "bg-red-50 text-red-700",
  neutral: "bg-wash text-muted",
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${toneClass[tone]}`}>{children}</span>;
}

// Badge for any status id, looked up in one of the stage lists from content/admin.ts.
export function StageBadge({ stages, id }: { stages: readonly { id: string; label: string; tone: Tone }[]; id: string }) {
  const s = stages.find((x) => x.id === id);
  return <StatusBadge tone={s?.tone ?? "neutral"}>{s?.label ?? id}</StatusBadge>;
}

export function PageHeader({ title, text, actions }: { title: string; text?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-medium sm:text-3xl">{title}</h1>
        {text && <p className="mt-1 max-w-2xl text-sm text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-medium text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note, tone }: { label: string; value: ReactNode; note?: ReactNode; tone?: "alert" }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 ${tone === "alert" ? "border-brand/40" : "border-line"}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1.5 text-3xl font-medium text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

// Label/value rows inside drawers.
export function Details({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8.5rem_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// Input styles. fieldClass fills its container; fieldBase has no width, for inputs that set
// their own (w-24, flex-1…), since two width classes on one element don't reliably override.
export const fieldBase =
  "rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-brand";
export const fieldClass = `w-full ${fieldBase}`;

export function Labelled({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block text-xs font-medium text-muted ${className}`}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

// Right-hand panel for a record's details. Closes on Escape or the backdrop.
export function Drawer({ open, onClose, title, subtitle, children, footer }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-night/40" />
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl outline-none">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-medium text-ink">{title}</h2>
            {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-wash hover:text-ink">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap gap-2 border-t border-line bg-wash/60 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

// Notes thread with an "add note" box (applications, artists, bookings, leads).
export function NotesBox({ notes, onAdd, permission }: { notes: { at: string; by: string; text: string }[]; onAdd: (text: string) => void; permission: Permission }) {
  const allowed = useCan()(permission);
  return (
    <div>
      {notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li key={i} className="rounded-lg bg-wash p-3 text-sm">
              <p className="text-ink">{n.text}</p>
              <p className="mt-1 text-xs text-muted">
                {n.by} · {ago(n.at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {allowed && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("note") as HTMLInputElement;
            if (input.value.trim()) {
              onAdd(input.value.trim());
              input.value = "";
            }
          }}
        >
          <input name="note" placeholder="Add a note for the team" className={fieldClass} />
          <button type="submit" className="shrink-0 rounded-lg border border-line px-3 text-sm font-medium text-ink hover:border-ink">
            Add
          </button>
        </form>
      )}
    </div>
  );
}

// Photos and videos an artist uploaded in the portal (the public `portfolio` storage bucket).
export const portfolioUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/portfolio/${path.split("/").map(encodeURIComponent).join("/")}`;

export function PortfolioFiles({ files }: { files?: PortfolioFile[] }) {
  if (!files?.length) return <p className="text-sm text-muted">No photos or videos uploaded in the portal yet.</p>;
  return (
    <ul className="grid grid-cols-3 gap-2">
      {files.map((f) => (
        <li key={f.path}>
          <a href={portfolioUrl(f.path)} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-lg border border-line bg-wash hover:border-brand" title={f.name}>
            {f.type.startsWith("image/") && f.type !== "image/heic" ? (
              // eslint-disable-next-line @next/next/no-img-element -- files from the storage bucket
              <img src={portfolioUrl(f.path)} alt={f.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center p-2 text-center text-xs text-muted">{f.type.startsWith("video/") ? "Video" : "Photo"} · open</span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{children}</p>;
}
