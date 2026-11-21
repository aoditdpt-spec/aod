"use client";

import { useState } from "react";
import { bookingRows, downloadCsv, toCsv } from "@/lib/csv";
import { buildXlsx } from "@/lib/xlsx";
import { useExcelExport } from "../ExcelExport";
import { act, ago, appStageLabel, catName, openStage, rupees, sameMonth, settingList, stages, useDb, type Staff } from "@/lib/app-db";
import { categories } from "@/data/site";
import { backendEnabled } from "@/lib/backend";
import { Head, Loading, Nums, Title, Toggle, btn, btnMain, field, label, sub, td, th } from "../ui";

// Reports And Exports: the month in numbers, orders by category and stage, and CSV downloads.
export function Reports() {
  const db = useDb();
  const { exportExcel, dialog } = useExcelExport();
  if (!db) return <Loading />;
  const revenue = db.payments.filter((p) => p.verified && sameMonth(p.at, db.today)).reduce((n, p) => n + p.amount, 0);
  const open = db.bookings.filter((b) => openStage(b.stage));
  const quoted = db.bookings.filter((b) => b.quote && b.stage !== "cancelled");
  const avg = quoted.length ? Math.round(quoted.reduce((n, b) => n + (b.quote ?? 0), 0) / quoted.length) : 0;
  // One sheet per list; the master workbook has them all.
  const sheets = [
    { name: "Bookings", rows: bookingRows(db) },
    { name: "Artists", rows: [["ID", "Name", "Craft", "Categories", "City", "Phone", "Email", "Active"], ...db.artists.map((a) => [a.id, a.name, a.craft, a.cats.map(catName).join(", "), a.city, a.phone, a.email, a.active ? "Yes" : "No"])] },
    { name: "Applications", rows: [["ID", "Name", "Craft", "City", "Stage", "Applied"], ...db.applications.map((a) => [a.id, a.name, a.craft, a.city, appStageLabel(a.stage), a.applied])] },
    { name: "Payments", rows: [["ID", "Order", "Customer", "Kind", "Amount", "UTR", "Verified", "At"], ...db.payments.map((p) => [p.id, p.booking, p.customer, p.kind, p.amount, p.utr, p.verified ? "Yes" : "No", p.at])] },
    { name: "Disputes", rows: [["Case", "About", "Raised By", "Side", "Booking", "Status", "Raised"], ...db.cases.map((c) => [c.id, c.about, c.name, c.role, c.outside ? `Not booked through AOD${c.otherParty ? ` (${c.otherParty})` : ""}` : c.booking, c.status, c.raisedAt])] },
  ];

  return (
    <>
      <Title title="Reports And Exports" text={backendEnabled ? undefined : "Sample figures in test mode."} />
      <Nums
        items={[
          { value: rupees(revenue), label: "Verified This Month" },
          { value: String(open.length), label: "Open Orders" },
          { value: String(db.bookings.filter((b) => b.stage === "completed").length), label: "Completed" },
          { value: rupees(avg), label: "Average Quote" },
          { value: String(db.artists.filter((a) => a.active).length), label: "Active Artists" },
        ]}
      />
      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <section>
          <Head title="Orders By Category" />
          <Bars rows={categories.map((c) => ({ label: c.name, n: db.bookings.filter((b) => b.cats.includes(c.slug)).length }))} />
        </section>
        <section>
          <Head title="Orders By Stage" />
          <Bars rows={stages.map((s) => ({ label: s.label, n: db.bookings.filter((b) => b.stage === s.id).length }))} />
        </section>
      </div>
      <Head title="Excel" className="mt-11">
        Password-Protected
      </Head>
      <div className="flex flex-wrap gap-2 border-t border-ink pt-4">
        <button type="button" className={btnMain} onClick={() => exportExcel(`aod-everything-${db.todayKey}.xlsx`, () => buildXlsx(sheets))}>
          Master Workbook
        </button>
        {sheets.map((sh) => (
          <button key={sh.name} type="button" className={btn} onClick={() => exportExcel(`aod-${sh.name.toLowerCase()}-${db.todayKey}.xlsx`, () => buildXlsx([sh]))}>
            {sh.name}
          </button>
        ))}
      </div>
      <Head title="CSV" className="mt-9">
        No Password (CSV Can&apos;t Hold One)
      </Head>
      <div className="flex flex-wrap gap-2 border-t border-ink pt-4">
        {sheets.map((sh) => (
          <button key={sh.name} type="button" className={btn} onClick={() => downloadCsv(`aod-${sh.name.toLowerCase()}-${db.todayKey}.csv`, toCsv(sh.rows))}>
            {sh.name}
          </button>
        ))}
      </div>
      {dialog}
    </>
  );
}

function Bars({ rows }: { rows: { label: string; n: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className="border-t border-ink">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[160px_1fr_28px] items-center gap-3 border-b border-line py-2.5">
          <span className="truncate">{r.label}</span>
          <span className="h-1.5 rounded-sm bg-wash">
            <i className="block h-full rounded-sm bg-ink" style={{ width: `${(r.n / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums">{r.n}</span>
        </li>
      ))}
    </ul>
  );
}

// Team And Roles: two roles, both with full access.
export function TeamRoles() {
  const db = useDb();
  const [f, setF] = useState({ name: "", email: "", role: "Admin" as Staff["role"] });
  if (!db) return <Loading />;
  return (
    <>
      <Title title="Team And Roles" text="Admins run AOD; Developers build and run the site. Both see everything." />
      <table className="mt-7 w-full border-collapse">
        <thead>
          <tr>
            <th className={th}>Member</th>
            <th className={th}>Role</th>
          </tr>
        </thead>
        <tbody>
          {db.staff.map((s) => (
            <tr key={s.id} className="hover:bg-wash">
              <td className={td}>
                {s.name}
                <small className={sub}>{s.email}</small>
              </td>
              <td className={td}>{s.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Head title="Add A Member" className="mt-11" />
      <form
        className="grid max-w-2xl gap-3 sm:grid-cols-[1fr_1fr_140px_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          act.addStaff(f.name, f.email, f.role);
          setF({ name: "", email: "", role: "Admin" });
        }}
      >
        <label>
          <span className={label}>Name</span>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} />
        </label>
        <label>
          <span className={label}>Work Email</span>
          <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" className={field} />
        </label>
        <label>
          <span className={label}>Role</span>
          <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Staff["role"] })} className={field}>
            <option>Admin</option>
            <option>Developer</option>
          </select>
        </label>
        <button className={`${btnMain} h-10`}>Add</button>
      </form>
    </>
  );
}

export function ActivityLog() {
  const db = useDb();
  if (!db) return <Loading />;
  return (
    <>
      <Title title="Activity Log" text="Every change, newest first." />
      <ul className="mt-7 border-t border-ink">
        {db.activity.map((a, i) => (
          <li key={i} className="flex flex-wrap justify-between gap-x-6 border-b border-line py-3">
            <span>{a.text}</span>
            <small className="text-muted">
              {a.by}, {ago(a.at)}
            </small>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Settings() {
  const db = useDb();
  if (!db) return <Loading />;
  return (
    <>
      <Title title="Settings" text="Which emails the team gets." />
      <ul className="mt-7 max-w-2xl border-t border-ink">
        {settingList.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-6 border-b border-line py-4">
            <span>
              {s.label}
              <small className="block text-[13px] text-muted">{s.text}</small>
            </span>
            <Toggle on={db.settings[s.id]} onChange={(on) => act.setSetting(s.id, on)} label={s.label} />
          </li>
        ))}
      </ul>
    </>
  );
}
