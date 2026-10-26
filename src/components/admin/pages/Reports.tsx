"use client";

import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { applicationStages, bookingStages, caseStages, paymentStatuses } from "@/content/admin";
import { useDb, type Db } from "@/lib/admin-store";
import { buildXlsx, type Sheet } from "@/lib/xlsx";
import { useExcelExport } from "../ExcelExport";
import { assignedArtists, itemFor, itemsLabel, totalNeeded } from "@/lib/booking-needs";
import { artistName, artistNames, Card, categoryName, categoryNames, inr, PageHeader, Stat, useCan } from "../ui";

const stageLabel = (list: readonly { id: string; label: string }[], id: string) => list.find((s) => s.id === id)?.label ?? id;

// The master workbook: one sheet per list (artists, bookings, payments, payouts,
// applications, resolution cases, activity), plus "which customer booked which artist".
export function masterWorkbook(db: Db): Sheet[] {
  return [
    {
      name: "Bookings",
      rows: [
        ["Ref", "Created", "Type", "Customer", "Phone", "Email", "Categories", "Needs", "Artists needed", "Event", "Date", "Time", "City", "Venue", "Budget", "Status", "Artists", "Quote", "Advance", "Delivery link", "Rating"],
        ...db.bookings.map((b) => [b.id, b.createdAt.slice(0, 10), b.audience, b.customer.name, b.customer.phone, b.customer.email, b.items.map((i) => categoryName(i.category)).join(", "), itemsLabel(b.items), totalNeeded(b.items), b.event, b.date, b.time, b.city, b.venue, b.budget, stageLabel(bookingStages, b.status), artistNames(db, assignedArtists(b.items)), b.quote, b.advance, b.delivery?.link, b.review?.rating]),
      ],
    },
    {
      name: "Artists",
      rows: [
        ["ID", "Name", "Phone", "Email", "Categories", "Services", "City", "Experience", "Languages", "Status", "Identity", "Payout UPI", "Joined", "Jobs done", "Photo"],
        ...db.artists.map((a) => [a.id, a.name, a.phone, a.email, categoryNames(a), a.services.join(", "), a.city, a.experience, a.languages.join(", "), a.status, a.kyc, a.payoutUpi, a.joinedAt.slice(0, 10), db.bookings.filter((b) => assignedArtists(b.items).includes(a.id) && ["completed", "delivered", "reviewed"].includes(b.status)).length, a.photo]),
      ],
    },
    {
      name: "Customer x artist",
      // One row for each artist on a booking.
      rows: [["Customer", "Booking", "Date", "Service", "Artist", "Status"], ...db.bookings.flatMap((b) => assignedArtists(b.items).map((a) => [b.customer.name, b.id, b.date, itemFor(b.items, a)?.service, artistName(db, a), stageLabel(bookingStages, b.status)]))],
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
      name: "Applications",
      rows: [["ID", "Submitted", "Name", "Phone", "Email", "Categories", "City", "Experience", "Status", "Meeting", "Links", "Photo"], ...db.applications.map((a) => [a.id, a.submittedAt.slice(0, 10), a.name, a.phone, a.email, categoryNames(a), a.city, a.experience, stageLabel(applicationStages, a.status), a.meeting?.at.slice(0, 16).replace("T", " "), a.links.join(" "), a.photo])],
    },
    {
      name: "Disputes",
      rows: [["Case", "Raised", "Raised by", "Role", "Phone", "Email", "Booking", "With (outside AOD)", "Issue", "Happened on", "Wants", "Status", "Decision"], ...db.cases.map((c) => [c.id, c.createdAt.slice(0, 10), c.name, c.role, c.phone, c.email, c.bookingRef, c.otherParty, c.issue, c.incidentDate, c.outcome, stageLabel(caseStages, c.status), c.resolution])],
    },
    {
      name: "Newsletter subscribers",
      rows: [["ID", "Email", "Status", "Signed up on", "Signed up", "Confirmed", "Unsubscribed"], ...db.subscribers.map((s) => [s.id, s.email, s.status, s.source, s.createdAt.slice(0, 10), s.confirmedAt?.slice(0, 10), s.unsubscribedAt?.slice(0, 10)])],
    },
    {
      name: "Blog posts",
      rows: [["ID", "Title", "Address", "Status", "Published", "Tags", "Author"], ...db.posts.map((p) => [p.id, p.title, `/blog/${p.slug}`, p.status, p.publishedAt?.slice(0, 10), p.tags.join(", "), p.author])],
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
  // Every download is password-protected (ExcelExport.tsx).
  const { exportExcel, dialog } = useExcelExport();
  if (!db) return null;

  const live = db.bookings.filter((b) => b.status !== "cancelled");
  const quoted = db.bookings.filter((b) => b.quote);
  const verified = db.payments.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
  const booked = db.bookings.filter((b) => ["confirmed", "completed", "delivered", "reviewed"].includes(b.status)).reduce((n, b) => n + (b.quote ?? 0), 0);
  const cancelled = db.bookings.filter((b) => b.status === "cancelled").length;
  const reviews = db.bookings.filter((b) => b.review);
  const count = <K extends string>(keys: K[]) => keys.reduce<Record<string, number>>((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
  // Each category an order needs counts once for that order.
  const byCategory = Object.entries(count(live.flatMap((b) => b.items.map((i) => categoryName(i.category))))).sort((a, b) => b[1] - a[1]);
  const byCity = Object.entries(count(live.map((b) => b.city))).sort((a, b) => b[1] - a[1]);
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {dialog}
      <PageHeader
        title="Reports & exports"
        text="How the business is doing, and every list as an Excel file."
        actions={
          allowed("export") && (
            <button
              type="button"
              onClick={() => exportExcel(`aod-master-${stamp}.xlsx`, () => buildXlsx(masterWorkbook(db)))}
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
        <Stat label="Bookings" value={db.bookings.length} note={`${db.bookings.filter((b) => b.audience === "Business").length} for businesses`} />
        <Stat label="Cancellations" value={db.bookings.length ? `${Math.round((cancelled / db.bookings.length) * 100)}%` : "—"} note={`${cancelled} of ${db.bookings.length} bookings`} />
        <Stat label="Reviews" value={reviews.length ? `${(reviews.reduce((n, b) => n + b.review!.rating, 0) / reviews.length).toFixed(1)} / 5` : "—"} note={`${reviews.length} reviews`} />
        <Stat label="Active artists" value={db.artists.filter((a) => a.status === "active").length} note={`${db.artists.length} in total`} />
        <Stat label="Applications" value={db.applications.length} note={`${db.applications.filter((a) => a.status === "approved").length} approved`} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card title="Bookings by category">
          <Bars rows={byCategory.map(([label, value]) => ({ label, value }))} />
        </Card>
        <Card title="Bookings by city">
          <Bars rows={byCity.map(([label, value]) => ({ label, value }))} />
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
                  <button type="button" onClick={() => exportExcel(`aod-${s.name.toLowerCase().replace(/\W+/g, "-")}-${stamp}.xlsx`, () => buildXlsx([s]))} className="text-sm font-medium text-brand hover:text-brand-hover">
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
