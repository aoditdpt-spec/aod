"use client";

import { Building2, CalendarDays, ClipboardList, LogOut, Plus } from "lucide-react";
import { useState } from "react";
import type { CustomerOrder } from "@/content/my-bookings";
import { companyLinkError, companyLinkLabel, companyLinkOf, companyLinkPlaceholder, companyTypes, stageOf, type Company } from "@/content/business-portal";
import { cities } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { businessCompanyStore } from "@/lib/business-store";
import { Spinner } from "@/components/ui/Spinner";
import { Field, inputClass, Panel } from "@/components/artists/form";
import { MatchQuiz } from "@/components/home/MatchQuiz";
import { updateMyCompany } from "@/server/actions/business";
import { BusinessOrders } from "./BusinessOrders";
import { CompanyCalendar } from "./CompanyCalendar";

type Tab = "calendar" | "book" | "orders" | "company";
const tabs: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "book", label: "Book artists", icon: Plus },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "company", label: "Company", icon: Building2 },
];

// The signed-in company's portal: its calendar, booking, orders and details.
export function BusinessApp({
  company,
  orders,
  sampleNote,
  onCompanyChange,
  onSignOut,
}: {
  company: Company;
  orders: CustomerOrder[];
  sampleNote?: boolean;
  onCompanyChange: (c: Company) => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("calendar");
  const open = orders.filter((o) => stageOf(o) !== "done" && stageOf(o) !== "cancelled").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-night px-5 py-5 text-white sm:px-8">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-apricot">AOD for Business{company.type ? ` · ${company.type === "Other" && company.typeOther ? company.typeOther : company.type}` : ""}</p>
          <h1 className="mt-1 truncate text-2xl font-medium !text-white sm:text-3xl">{company.name}</h1>
          <p className="mt-1 text-sm text-white/80">
            {company.email} · {open} open order{open === 1 ? "" : "s"}
            {sampleNote && " · sample orders shown"}
          </p>
        </div>
        <button type="button" onClick={onSignOut} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/60 px-4 text-sm font-medium text-white hover:bg-white/10">
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </header>

      <nav aria-label="Business portal" className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-brand text-white" : "bg-wash text-body hover:bg-peach/60"
            }`}
          >
            <t.icon className="h-4 w-4" aria-hidden /> {t.label}
          </button>
        ))}
      </nav>

      {tab === "calendar" && <CompanyCalendar orders={orders} onBook={() => setTab("book")} />}
      {tab === "orders" && <BusinessOrders orders={orders} onBook={() => setTab("book")} />}
      {tab === "book" && (
        <section className="rounded-[1.25rem] border border-line bg-white p-4 sm:p-7">
          <h2 className="text-lg font-bold text-ink sm:text-xl">Book artists</h2>
          <p className="mt-1 text-sm text-muted">Pick the artists, the date and the time. We send curated matches, and the order appears in your calendar.</p>
          <div className="mt-6">
            <MatchQuiz audience="business" contact={{ name: company.contactName, phone: company.phone, email: company.email }} />
          </div>
        </section>
      )}
      {tab === "company" && <CompanyDetails company={company} onChange={onCompanyChange} />}
    </div>
  );
}

function CompanyDetails({ company, onChange }: { company: Company; onChange: (c: Company) => void }) {
  const [form, setForm] = useState({ name: company.name, type: company.type, typeOther: company.typeOther, contactName: company.contactName, phone: company.phone, city: company.city, website: company.website });
  const set = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setMessage(null);
  };
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((k) => form[k] !== company[k]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2 || !form.type || form.contactName.trim().length < 2 || !form.city) return setMessage({ ok: false, text: "Fill in the company name, type, contact person and city." });
    if (form.type === "Other" && form.typeOther.trim().length < 2) return setMessage({ ok: false, text: "Please specify what kind of company you are." });
    const link = companyLinkOf(form.website);
    if (!link) return setMessage({ ok: false, text: link === null ? "Check the website, LinkedIn or Linktree link." : companyLinkError });
    setBusy(true);
    if (!backendEnabled) {
      const next = { ...company, ...form, type: form.type as Company["type"], website: link };
      businessCompanyStore.set(next);
      onChange(next);
      setBusy(false);
      return setMessage({ ok: true, text: "Saved on this browser (preview)." });
    }
    const res = await updateMyCompany(form).catch(() => ({ ok: false as const, error: "Couldn't save just now. Please try again." }));
    setBusy(false);
    if (!res.ok) return setMessage({ ok: false, text: res.error });
    onChange(res.company);
    setMessage({ ok: true, text: "Saved." });
  }

  return (
    <Panel title="Company details" text="Used to fill in your bookings. Your sign-in email stays the same.">
      <form noValidate onSubmit={save} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company name">
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Company email" hint="Your sign-in. Ask AOD to change it.">
            <input value={company.email} readOnly className={`${inputClass} bg-wash text-muted`} />
          </Field>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">We are a…</p>
          <div role="group" aria-label="Account type" className="mt-2 flex flex-wrap gap-2">
            {companyTypes.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={form.type === t}
                onClick={() => set({ type: t })}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${form.type === t ? "border-brand bg-peach/50 font-medium text-ink" : "border-line text-body hover:border-brand/50"}`}
              >
                {t}
              </button>
            ))}
          </div>
          {form.type === "Other" && (
            <input
              value={form.typeOther}
              onChange={(e) => set({ typeOther: e.target.value.slice(0, 40) })}
              placeholder="Please specify, e.g. production house"
              aria-label="Please specify what kind of company you are"
              className={`${inputClass} sm:max-w-sm`}
            />
          )}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Contact person">
            <input value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Phone (WhatsApp preferred)">
            <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className={inputClass} />
          </Field>
          <Field label="City">
            <select value={form.city} onChange={(e) => set({ city: e.target.value })} className={inputClass}>
              <option value="">Choose…</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label={companyLinkLabel}>
            <input value={form.website} onChange={(e) => set({ website: e.target.value })} inputMode="url" placeholder={companyLinkPlaceholder} className={inputClass} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy || !dirty} className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`} role="status">
              {message.text}
            </p>
          )}
        </div>
      </form>
    </Panel>
  );
}
