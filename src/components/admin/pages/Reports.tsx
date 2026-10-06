"use client";

import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { applicationStages, bookingStages, leadStatuses, paymentStatuses } from "@/content/admin";
import { useDb, type Db } from "@/lib/admin-store";
import { buildXlsx, download, XLSX_TYPE, type Sheet } from "@/lib/xlsx";
import { artistName, Card, categoryName, inr, PageHeader, Stat, useCan } from "../ui";

const stageLabel = (list: readonly { id: string; label: string }[], id: string) => list.find((s) => s.id === id)?.label ?? id;

// The master workbook: one sheet per list (artists, bookings, payments, payouts, leads,
// applications, activity), plus "which customer booked which artist".
export function masterWorkbook(db: Db): Sheet[] {
  return [
    {
      name: "Bookings",
      rows: [
        ["Ref", "Created", "Type", "Customer", "Phone", "Email", "Category", "Service", "Event", "Date", "Time", "City", "Venue", "Budget", "Status", "Artist", "Quote", "Advance", "Delivery link", "Rating"],
        ...db.bookings.map((b) => [b.id, b.createdAt.slice(0, 10), b.audience, b.customer.name, b.customer.phone, b.customer.email, categoryName(b.category), b.service, b.event, b.date, b.time, b.city, b.venue, b.budget, stageLabel(bookingStages, b.status), artistName(db, b.artistId), b.quote, b.advance, b.delivery?.link, b.review?.rating]),
      ],
    },
    {
      name: "Artists",
      rows: [
        ["ID", "Name", "Phone", "Email", "Category", "Services", "City", "Experience", "Languages", "Status", "Identity", "Payout UPI", "Joined", "Jobs done"],
        ...db.artists.map((a) => [a.id, a.name, a.phone, a.email, categoryName(a.category), a.services.join(", "), a.city, a.experience, a.languages.join(", "), a.status, a.kyc, a.payoutUpi, a.joinedAt.slice(0, 10), db.bookings.filter((b) => b.artistId === a.id && ["completed", "delivered", "reviewed"].includes(b.status)).length]),
      ],
    },
    {
      name: "Customer x artist",
      rows: [["Customer", "Booking", "Date", "Service", "Artist", "Status"], ...db.bookings.filter((b) => b.artistId).map((b) => [b.customer.name, b.id, b.date, b.service, artistName(db, b.artistId), stageLabel(bookingStages, b.status)])],
    },
    {
      name: "Payments",
      rows: [["ID", "Booking", "Payer", "Amount", "UTR", "Reported", "Status", "Checked by", "Checked at", "Reason"], ...db.payments.map((p) => [p.id, p.bookingId, p.payer, p.amount, p.utr, p.reportedAt.slice(0, 16).replace("T", " "), stageLabel(paymentStatuses, p.status), p.checkedBy, p.checkedAt?.slice(0, 16).replace("T", " "), p.reason])],
    },
    {
      name: "Payouts",
      rows: [["ID", "Artist", "Booking", "Amount", "Status", "Paid on", "Reference"], ...db.payouts.map((p) => [p.id, artistName(db, p.artistId), p.bookingId, p.amount, p.status, p.paidAt?.slice(0, 10), p.reference])],
    },
    {
      name: "Leads",
      rows: [["ID", "Came in", "Name", "Phone", "Source", "Type", "City", "Looking for", "Status", "Booking"], ...db.leads.map((l) => [l.id, l.createdAt.slice(0, 10), l.name, l.phone, l.source, l.type, l.city, l.need, stageLabel(leadStatuses, l.status), l.bookingId])],
    },
    {
      name: "Applications",
      rows: [["ID", "Submitted", "Name", "Phone", "Email", "Category", "City", "Experience", "Status", "Meeting", "Links"], ...db.applications.map((a) => [a.id, a.submittedAt.slice(0, 10), a.name, a.phone, a.email, categoryName(a.category), a.city, a.experience, stageLabel(applicationStages, a.status), a.meeting?.at.slice(0, 16).replace("T", " "), a.links.join(" ")])],
    },
    { name: "Activity", rows: [["When", "Who", "Area", "What", "Record"], ...db.activity.map((a) => [a.at.slice(0, 16).replace("T", " "), a.by, a.area, a.text, a.target])] },
  ];
}

function Bars({ rows }: { rows: { label: string; value: number; display?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[9rem_1fr_5rem] items-center gap-3 text-sm" title={`${r.label}: ${r.display ?? r.value}`}>
          <span className="truncate text-body">{r.label}</span>
          <span className="h-3 rounded-full bg-wash">
            <span className="block h-3 rounded-full bg-brand" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? "0.75rem" : 0 }} />
          </span>
          <span className="text-right font-medium text-ink">{r.display ?? r.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function Reports() {
  const db = useDb();
  const allowed = useCan();
  if (!db) return null;

  const live = db.bookings.filter((b) => b.status !== "cancelled");
  const quoted = db.bookings.filter((b) => b.quote);
  const verified = db.payments.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
  const booked = db.bookings.filter((b) => ["confirmed", "completed", "delivered", "reviewed"].includes(b.status)).reduce((n, b) => n + (b.quote ?? 0), 0);
  const converted = db.leads.filter((l) => l.status === "converted").length;
  const closedLeads = db.leads.filter((l) => l.status === "converted" || l.status === "lost").length;
  const cancelled = db.bookings.filter((b) => b.status === "cancelled").length;
  const reviews = db.bookings.filter((b) => b.review);
  const count = <K extends string>(keys: K[]) => keys.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
  const byCategory = Object.entries(count(live.map((b) => categoryName(b.category)))).sort((a, b) => b[1] - a[1]);
  const byCity = Object.entries(count(live.map((b) => b.city))).sort((a, b) => b[1] - a[1]);
  const bySource = Object.entries(count(db.leads.map((l) => l.source))).sort((a, b) => b[1] - a[1]);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & exports"
        text="How the business is doing, and every list as an Excel file."
        actions={
          allowed("export") && (
            <button
              type="button"
              onClick={() => download(`aod-master-${stamp}.xlsx`, buildXlsx(masterWorkbook(db)), XLSX_TYPE)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-medium text-white hover:bg-brand-hover"
            >
              <Download className="h-4 w-4" aria-hidden /> Master Excel (all sheets)
            </button>
          )
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Booked value" value={inr(booked)} note="Confirmed and later" />
        <Stat label="Payments verified" value={inr(verified)} note="All time" />
        <Stat label="Average quote" value={inr(quoted.length ? Math.round(quoted.reduce((n, b) => n + b.quote!, 0) / quoted.length) : 0)} note={`${quoted.length} quotes`} />
        <Stat label="Lead conversion" value={closedLeads ? `${Math.round((converted / closedLeads) * 100)}%` : "—"} note={`${converted} of ${closedLeads} closed leads`} />
        <Stat label="Cancellations" value={db.bookings.length ? `${Math.round((cancelled / db.bookings.length) * 100)}%` : "—"} note={`${cancelled} of ${db.bookings.length} bookings`} />
        <Stat label="Reviews" value={reviews.length ? `${(reviews.reduce((n, b) => n + b.review!.rating, 0) / reviews.length).toFixed(1)} / 5` : "—"} note={`${reviews.length} reviews`} />
        <Stat label="Active artists" value={db.artists.filter((a) => a.status === "active").length} note={`${db.artists.length} in total`} />
        <Stat label="Applications" value={db.applications.length} note={`${db.applications.filter((a) => a.status === "approved").length} approved`} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Card title="Bookings by category">
          <Bars rows={byCategory.map(([label, value]) => ({ label, value }))} />
        </Card>
        <Card title="Bookings by city">
          <Bars rows={byCity.map(([label, value]) => ({ label, value }))} />
        </Card>
        <Card title="Leads by source">
          <Bars rows={bySource.map(([label, value]) => ({ label, value }))} />
        </Card>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card title="Download a list">
          <ul className="divide-y divide-line">
            {masterWorkbook(db).map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-ink">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-700" aria-hidden /> {s.name} <span className="text-muted">({s.rows.length - 1} rows)</span>
                </span>
                {allowed("export") && (
                  <button type="button" onClick={() => download(`aod-${s.name.toLowerCase().replace(/\W+/g, "-")}-${stamp}.xlsx`, buildXlsx([s]), XLSX_TYPE)} className="text-sm font-medium text-brand hover:text-brand-hover">
                    Excel
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Live Google Sheet">
          <p className="flex items-start gap-3 text-sm text-body">
            <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            Once the backend is connected, the same sheets update a shared Google Sheet every few minutes, so the team can work in a spreadsheet without touching the database.
          </p>
        </Card>
      </div>
    </div>
  );
}
