"use client";

import Link from "next/link";
import { useState } from "react";
import { caseStages } from "@/content/admin";
import { resolution } from "@/content/resolution";
import { currentUser, update, useDb, type CaseStatus, type ResolutionCase } from "@/lib/admin-store";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { DataTable, type Column } from "../DataTable";
import { ActionButton, ago, Details, Drawer, DrawerSection, fieldClass, fmtDate, NotesBox, PageHeader, StageBadge, Stat, StatusBadge, useCan, whatsappTo } from "../ui";
import { useOpen } from "../useOpen";

// Resolution Centre cases (raised on /resolve). AOD promises a reply within 48 hours and a
// decision within 30 days (src/content/resolution.ts), so each case shows how long is left.

const HOUR = 3600_000;
const open = (c: ResolutionCase) => c.status !== "resolved" && c.status !== "closed";
const roleLabel = (c: ResolutionCase) => resolution.roles.find((r) => r.id === c.role)?.label ?? c.role;

// The next deadline for a case: the 48-hour reply while it's new, then the 30-day decision.
export function caseDue(c: ResolutionCase) {
  if (!open(c)) return null;
  const start = new Date(c.createdAt).getTime();
  const replying = c.status === "received";
  const due = start + (replying ? 48 * HOUR : 30 * 24 * HOUR);
  const left = due - Date.now();
  const what = replying ? "Reply" : "Decision";
  if (left < 0) return { text: `${what} overdue`, tone: "bad" as const, overdue: true };
  const hours = Math.round(left / HOUR);
  return { text: `${what} due in ${hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} d`}`, tone: hours < 12 ? ("wait" as const) : ("neutral" as const), overdue: false };
}

const columns: Column<ResolutionCase>[] = [
  { key: "id", label: "Case", render: (c) => <span className="font-medium">{c.id}</span>, value: (c) => c.id },
  { key: "name", label: "Raised by", render: (c) => c.name, value: (c) => c.name },
  { key: "issue", label: "Issue", render: (c) => <span className="line-clamp-1">{c.issue}</span>, value: (c) => c.issue },
  { key: "booking", label: "Booking", render: (c) => c.bookingRef, value: (c) => c.bookingRef, hideOnMobile: true },
  { key: "created", label: "Raised", render: (c) => ago(c.createdAt), value: (c) => c.createdAt, hideOnMobile: true },
  {
    key: "due",
    label: "Due",
    render: (c) => {
      const d = caseDue(c);
      return d ? <StatusBadge tone={d.tone}>{d.text}</StatusBadge> : <span className="text-muted">—</span>;
    },
    value: (c) => caseDue(c)?.text ?? "",
    hideOnMobile: true,
  },
  { key: "status", label: "Status", render: (c) => <StageBadge stages={caseStages} id={c.status} />, value: (c) => caseStages.find((s) => s.id === c.status)?.label },
];

export function Resolution() {
  const db = useDb();
  const [openId, setOpen] = useOpen();
  if (!db) return null;
  const current = db.cases.find((c) => c.id === openId) ?? null;
  const active = db.cases.filter(open);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resolution cases"
        text={
          <>
            Problems with a booking, raised on the{" "}
            <Link href="/resolve" target="_blank" className="text-brand hover:underline">
              Resolution Centre
            </Link>{" "}
            by customers, businesses and artists. Reply within 48 hours and decide within 30 days; the person sees the status and the decision when they track the case, never the notes.
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Open cases" value={active.length} />
        <Stat label="Waiting for a reply" value={db.cases.filter((c) => c.status === "received").length} tone={db.cases.some((c) => c.status === "received") ? "alert" : undefined} note="Within 48 hours" />
        <Stat label="Escalated" value={db.cases.filter((c) => c.status === "escalated").length} tone={db.cases.some((c) => c.status === "escalated") ? "alert" : undefined} note="Grievance officer" />
        <Stat label="Overdue" value={active.filter((c) => caseDue(c)?.overdue).length} tone={active.some((c) => caseDue(c)?.overdue) ? "alert" : undefined} />
      </div>
      <DataTable
        rows={db.cases}
        columns={columns}
        getId={(c) => c.id}
        onOpen={(c) => setOpen(c.id)}
        exportName="resolution-cases"
        initialSort={{ key: "created", dir: "desc" }}
        filters={[
          { label: "Status", options: caseStages.map((s) => ({ value: s.id, label: s.label })), test: (c, v) => c.status === v },
          { label: "Raised by", options: resolution.roles.map((r) => ({ value: r.id, label: r.label })), test: (c, v) => c.role === v },
        ]}
      />
      {current && <CaseDrawer key={current.id} c={current} onClose={() => setOpen(null)} />}
    </div>
  );
}

function CaseDrawer({ c, onClose }: { c: ResolutionCase; onClose: () => void }) {
  const db = useDb();
  const editable = useCan()("cases.edit");
  const [decision, setDecision] = useState(c.resolution ?? "");
  const booking = db?.bookings.find((b) => b.id === c.bookingRef || b.requestRef === c.bookingRef);
  const due = caseDue(c);
  const first = c.name.split(" ")[0];

  const setStatus = (status: CaseStatus) =>
    update(
      "Resolution",
      `Marked case ${c.id} as ${caseStages.find((s) => s.id === status)?.label}`,
      (db) => {
        const x = db.cases.find((y) => y.id === c.id)!;
        x.status = status;
        x.history.push({ at: new Date().toISOString(), by: currentUser(), status });
      },
      c.id,
    );
  const saveDecision = () =>
    update("Resolution", `Wrote the decision on case ${c.id}`, (db) => void (db.cases.find((y) => y.id === c.id)!.resolution = decision.trim()), c.id);

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${c.id} · ${c.issue}`}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {c.name} · {roleLabel(c)} <StageBadge stages={caseStages} id={c.status} />
          {due && <StatusBadge tone={due.tone}>{due.text}</StatusBadge>}
        </span>
      }
      footer={
        <>
          <a
            href={whatsappTo(c.phone, `Hi ${first}, this is the AOD Resolution Centre about your case ${c.id}: `)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover"
          >
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <a
            href={`mailto:${c.email}?subject=${encodeURIComponent(`Your AOD case ${c.id}`)}`}
            className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink"
          >
            Email
          </a>
          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink">
            Call
          </a>
        </>
      }
    >
      <DrawerSection title="The case">
        <Details
          rows={[
            ["Booking", booking ? <Link href={`/admin/bookings?open=${booking.id}`} className="text-brand hover:underline">{c.bookingRef} ({booking.service}, {booking.customer.name})</Link> : c.bookingRef],
            ["Happened on", fmtDate(c.incidentDate)],
            ["Wants", c.outcome],
            ["Raised", fmtDate(c.createdAt, true)],
            ["Phone", c.phone],
            ["Email", c.email],
          ]}
        />
        <p className="mt-4 whitespace-pre-line rounded-lg bg-wash p-4 text-sm text-ink">{c.description}</p>
        {c.evidence.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {c.evidence.map((l) => (
              <li key={l}>
                <a href={l} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection title="Status">
        <div className="flex flex-wrap gap-2">
          {caseStages.map((s) => {
            const needsDecision = s.id === "resolved" && !c.resolution;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!editable || c.status === s.id || needsDecision}
                title={needsDecision ? "Write the decision first" : undefined}
                onClick={() => setStatus(s.id)}
                className={`rounded-lg border px-3 py-1.5 text-sm ${c.status === s.id ? "border-brand bg-peach/50 font-medium text-ink" : "border-line text-body hover:border-ink disabled:opacity-40"}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <ul className="mt-4 space-y-1 text-xs text-muted">
          {[...c.history].reverse().map((h, i) => (
            <li key={i}>
              {fmtDate(h.at, true)} · {caseStages.find((s) => s.id === h.status)?.label} · {h.by}
            </li>
          ))}
        </ul>
      </DrawerSection>

      <DrawerSection title="Decision (shown to them)">
        <textarea
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          disabled={!editable}
          rows={3}
          placeholder="What AOD decided and why, e.g. a ₹3,000 refund on the 2nd because the artist arrived 90 minutes late."
          className={fieldClass}
        />
        <ActionButton permission="cases.edit" variant="secondary" className="mt-2" disabled={decision.trim() === (c.resolution ?? "") || decision.trim().length < 10} onClick={saveDecision}>
          Save decision
        </ActionButton>
      </DrawerSection>

      <DrawerSection title="Internal notes">
        <NotesBox
          notes={c.notes}
          permission="cases.edit"
          onAdd={(text) => update("Resolution", `Added a note to case ${c.id}`, (db) => void db.cases.find((y) => y.id === c.id)!.notes.unshift({ at: new Date().toISOString(), by: currentUser(), text }), c.id)}
        />
      </DrawerSection>
    </Drawer>
  );
}
