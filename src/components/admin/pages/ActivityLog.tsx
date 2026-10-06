"use client";

import Link from "next/link";
import { useDb, type Activity } from "@/lib/admin-store";
import { DataTable, type Column } from "../DataTable";
import { fmtDate, PageHeader } from "../ui";

// Where a record id leads.
const hrefFor = (target?: string) => {
  if (!target) return null;
  if (target.startsWith("B-")) return `/admin/bookings?open=${target}`;
  if (target.startsWith("APP-")) return `/admin/applications?open=${target}`;
  if (target.startsWith("ART-")) return `/admin/artists?open=${target}`;
  if (target.startsWith("PAY-")) return `/admin/payments?tab=all&open=${target}`;
  if (target.startsWith("L-")) return `/admin/leads?open=${target}`;
  return null;
};

const columns: Column<Activity>[] = [
  { key: "at", label: "When", render: (a) => fmtDate(a.at, true), value: (a) => a.at },
  { key: "by", label: "Who", render: (a) => a.by, value: (a) => a.by },
  { key: "area", label: "Area", render: (a) => a.area, value: (a) => a.area, hideOnMobile: true },
  { key: "text", label: "What happened", render: (a) => a.text, value: (a) => a.text },
  {
    key: "target",
    label: "Record",
    render: (a) => {
      const href = hrefFor(a.target);
      return href ? (
        <Link href={href} className="font-medium text-brand" onClick={(e) => e.stopPropagation()}>
          {a.target}
        </Link>
      ) : (
        a.target ?? "—"
      );
    },
    value: (a) => a.target ?? "",
    hideOnMobile: true,
  },
];

export function ActivityLog() {
  const db = useDb();
  if (!db) return null;
  const areas = [...new Set(db.activity.map((a) => a.area))].sort();
  const people = [...new Set(db.activity.map((a) => a.by))].sort();
  return (
    <div className="space-y-6">
      <PageHeader title="Activity log" text="Every change in the admin panel: who did what, and when. Kept for audits and to settle questions later." />
      <DataTable
        rows={db.activity}
        columns={columns}
        getId={(a) => a.id}
        exportName="activity"
        initialSort={{ key: "at", dir: "desc" }}
        filters={[
          { label: "Area", options: areas.map((a) => ({ value: a, label: a })), test: (a, v) => a.area === v },
          { label: "Who", options: people.map((p) => ({ value: p, label: p })), test: (a, v) => a.by === v },
        ]}
      />
    </div>
  );
}
