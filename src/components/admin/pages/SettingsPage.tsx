"use client";

import { Check, Circle, Download, RotateCcw } from "lucide-react";
import { useState } from "react";
import { payee } from "@/content/payments";
import { resetDb, update, useDb, type Settings } from "@/lib/admin-store";
import { buildXlsx, download, XLSX_TYPE } from "@/lib/xlsx";
import { usePayBase } from "@/components/pay/PayLinkBuilder";
import { ActionButton, Card, Details, fieldBase, Labelled, PageHeader, StatusBadge, useCan } from "../ui";
import { masterWorkbook } from "./Reports";

const numbers: { key: keyof Omit<Settings, "notify">; label: string; suffix: string; hint: string }[] = [
  { key: "commissionPct", label: "AOD commission", suffix: "%", hint: "Taken from the quote before the artist payout." },
  { key: "advancePct", label: "Default advance", suffix: "%", hint: "Suggested advance when saving a quote." },
  { key: "paymentHoldHours", label: "Payment hold", suffix: "hours", hint: "How long a quoted slot is held before the reminder." },
  { key: "deliveryLinkDays", label: "Delivery link lasts", suffix: "days", hint: "After this, customers are reminded to download." },
];

// Launch checklist from the platform plan: what must exist before real customers pay.
const launch = [
  { label: "Privacy, terms and refund pages drafted (/privacy, /terms, /refund-policy)", done: true },
  { label: "Policies confirmed by the founder and checked by a lawyer; entity name, GSTIN and grievance officer added", done: false },
  { label: "Business UPI ID set (NEXT_PUBLIC_UPI_ID)", done: !!payee.upiId },
  { label: "Staff accounts with 2-step verification (backend)", done: false },
  { label: "WhatsApp Business Platform provider connected", done: false },
  { label: "Razorpay for cards, netbanking and automatic confirmation", done: false },
];

export function SettingsPage() {
  const db = useDb();
  const allowed = useCan();
  const payBase = usePayBase();
  const [draft, setDraft] = useState<Partial<Settings>>({});
  if (!db) return null;
  const s = { ...db.settings, ...draft };
  const changed = numbers.some((n) => s[n.key] !== db.settings[n.key]);
  const editable = allowed("settings.edit");

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" text="Business rules, notifications, payments and the launch checklist." />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card title="Business rules">
          <div className="grid gap-4 sm:grid-cols-2">
            {numbers.map((n) => (
              <Labelled key={n.key} label={n.label}>
                <div className="flex items-center gap-2">
                  <input
                    value={s[n.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [n.key]: Number(e.target.value.replace(/\D/g, "").slice(0, 4)) }))}
                    inputMode="numeric"
                    disabled={!editable}
                    className={`${fieldBase} w-24`}
                  />
                  <span className="text-sm text-muted">{n.suffix}</span>
                </div>
                <span className="mt-1 block font-normal">{n.hint}</span>
              </Labelled>
            ))}
          </div>
          <ActionButton
            permission="settings.edit"
            className="mt-4"
            disabled={!changed}
            onClick={() => {
              update("Settings", "Changed the business rules", (d) => void (d.settings = { ...d.settings, ...draft }));
              setDraft({});
            }}
          >
            Save
          </ActionButton>
        </Card>

        <Card title="Notify the team about">
          <ul className="space-y-2">
            {Object.entries(db.settings.notify).map(([k, v]) => (
              <li key={k}>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink">{k}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={v}
                    disabled={!editable}
                    onClick={() => update("Settings", `${v ? "Turned off" : "Turned on"} "${k}" alerts`, (d) => void (d.settings.notify[k] = !v))}
                    className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${v ? "bg-brand" : "bg-line"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${v ? "left-[1.375rem]" : "left-0.5"}`} />
                  </button>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Alerts show in the bell now; WhatsApp and email alerts start with the backend.</p>
        </Card>

        <Card title="Payments">
          <Details
            rows={[
              ["UPI ID", payee.upiId ? <span key="u" className="font-mono">{payee.upiId}</span> : <StatusBadge key="u" tone="bad">Not set</StatusBadge>],
              ["Name shown", payee.name],
              ["Payment page", payBase || "—"],
              ["Card payments", "Razorpay, coming later"],
            ]}
          />
          <p className="mt-3 text-xs text-muted">The UPI ID and name are set on Vercel (NEXT_PUBLIC_UPI_ID, NEXT_PUBLIC_UPI_NAME). Use a business UPI account.</p>
        </Card>

        <Card title="Before taking real payments">
          <ul className="space-y-2 text-sm">
            {launch.map((l) => (
              <li key={l.label} className="flex items-center gap-2">
                {l.done ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Circle className="h-4 w-4 text-line" aria-hidden />}
                <span className={l.done ? "text-muted line-through" : "text-ink"}>{l.label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Data">
          <div className="flex flex-wrap gap-2">
            {allowed("export") && (
              <button
                type="button"
                onClick={() => download(`aod-master-${new Date().toISOString().slice(0, 10)}.xlsx`, buildXlsx(masterWorkbook(db)), XLSX_TYPE)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-sm font-medium text-ink hover:border-ink"
              >
                <Download className="h-4 w-4" aria-hidden /> Export everything
              </button>
            )}
            <button
              type="button"
              onClick={() => window.confirm("Replace everything with fresh sample data? Changes made in this browser will be lost.") && resetDb()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3.5 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Reset sample data
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">This preview keeps its data in this browser only. Each person sees their own copy.</p>
        </Card>
      </div>
    </div>
  );
}
