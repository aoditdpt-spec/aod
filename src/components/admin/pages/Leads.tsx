"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useState } from "react";
import { leadSources, leadStatuses } from "@/content/admin";
import { cities } from "@/content/site";
import { currentUser, newId, update, useDb, type Lead, type LeadStatus } from "@/lib/admin-store";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { DataTable, type Column } from "../DataTable";
import { ActionButton, ago, Details, Drawer, DrawerSection, fieldClass, fmtDate, Labelled, NotesBox, PageHeader, StageBadge, useCan, whatsappTo } from "../ui";
import { useOpen } from "../useOpen";
import { NewBooking } from "./Bookings";

const columns: Column<Lead>[] = [
  { key: "name", label: "Lead", render: (l) => l.name, value: (l) => l.name },
  { key: "need", label: "Looking for", render: (l) => <span className="line-clamp-1">{l.need}</span>, value: (l) => l.need },
  { key: "source", label: "Source", render: (l) => l.source, value: (l) => l.source, hideOnMobile: true },
  { key: "type", label: "Type", render: (l) => l.type, value: (l) => l.type, hideOnMobile: true },
  { key: "city", label: "City", render: (l) => l.city, value: (l) => l.city, hideOnMobile: true },
  { key: "created", label: "Came in", render: (l) => ago(l.createdAt), value: (l) => l.createdAt, hideOnMobile: true },
  { key: "status", label: "Status", render: (l) => <StageBadge stages={leadStatuses} id={l.status} />, value: (l) => leadStatuses.find((s) => s.id === l.status)?.label },
];

export function Leads() {
  const db = useDb();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [openId, setOpen] = useOpen();
  const [converting, setConverting] = useState<Lead | null>(null);
  if (!db) return null;
  const open = db.leads.find((l) => l.id === openId) ?? null;
  const adding = params.get("new") === "1";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        text="Every enquiry in one list: website, WhatsApp, the business form, Instagram and calls. Turn a lead into a booking when they're ready."
        actions={
          <ActionButton permission="leads.edit" onClick={() => router.push(`${pathname}?new=1`, { scroll: false })}>
            <Plus className="h-4 w-4" aria-hidden /> Add lead
          </ActionButton>
        }
      />
      <DataTable
        rows={db.leads}
        columns={columns}
        getId={(l) => l.id}
        onOpen={(l) => setOpen(l.id)}
        exportName="leads"
        initialSort={{ key: "created", dir: "desc" }}
        filters={[
          { label: "Status", options: leadStatuses.map((s) => ({ value: s.id, label: s.label })), test: (l, v) => l.status === v },
          { label: "Source", options: leadSources.map((s) => ({ value: s, label: s })), test: (l, v) => l.source === v },
          { label: "Type", options: [{ value: "Personal", label: "Personal" }, { value: "Business", label: "Business" }], test: (l, v) => l.type === v },
        ]}
      />
      {open && <LeadDrawer key={open.id} lead={open} onClose={() => setOpen(null)} onConvert={() => setConverting(open)} />}
      {adding && <AddLead onClose={() => router.push(pathname, { scroll: false })} onAdded={(id) => router.push(`${pathname}?open=${id}`, { scroll: false })} />}
      {converting && (
        <NewBooking
          from={{ name: converting.name, phone: converting.phone, need: converting.need, city: converting.city, type: converting.type, leadId: converting.id }}
          onClose={() => setConverting(null)}
          onCreated={(id) => router.push(`/admin/bookings?open=${id}`)}
        />
      )}
    </div>
  );
}

function LeadDrawer({ lead, onClose, onConvert }: { lead: Lead; onClose: () => void; onConvert: () => void }) {
  const editable = useCan()("leads.edit");
  const setStatus = (status: LeadStatus) => update("Leads", `Marked ${lead.name} as ${leadStatuses.find((s) => s.id === status)?.label}`, (db) => void (db.leads.find((l) => l.id === lead.id)!.status = status), lead.id);
  return (
    <Drawer
      open
      onClose={onClose}
      title={lead.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {lead.id} · {lead.source} · {lead.type} <StageBadge stages={leadStatuses} id={lead.status} />
        </span>
      }
      footer={
        <>
          <a href={whatsappTo(lead.phone, `Hi ${lead.name.split(" ")[0]}, this is Team AOD about your enquiry: `)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink">
            Call
          </a>
          {lead.bookingId ? (
            <Link href={`/admin/bookings?open=${lead.bookingId}`} className="ml-auto inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink">
              Open booking {lead.bookingId}
            </Link>
          ) : (
            <ActionButton permission="bookings.edit" className="ml-auto" onClick={onConvert}>
              Turn into booking
            </ActionButton>
          )}
        </>
      }
    >
      <DrawerSection title="Enquiry">
        <Details rows={[["Looking for", lead.need], ["Phone", lead.phone], ["City", lead.city], ["Came in", fmtDate(lead.createdAt, true)]]} />
      </DrawerSection>
      <DrawerSection title="Status">
        <div className="flex flex-wrap gap-2">
          {leadStatuses.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={!editable || lead.status === s.id}
              onClick={() => setStatus(s.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${lead.status === s.id ? "border-brand bg-peach/50 font-medium text-ink" : "border-line text-body hover:border-ink disabled:opacity-40"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </DrawerSection>
      <DrawerSection title="Follow-up notes">
        <NotesBox notes={lead.notes} permission="leads.edit" onAdd={(text) => update("Leads", `Added a note to ${lead.name}`, (db) => void db.leads.find((l) => l.id === lead.id)!.notes.unshift({ at: new Date().toISOString(), by: currentUser(), text }), lead.id)} />
      </DrawerSection>
    </Drawer>
  );
}

function AddLead({ onClose, onAdded }: { onClose: () => void; onAdded: (id: string) => void }) {
  const [f, setF] = useState({ name: "", phone: "", source: "WhatsApp", type: "Personal" as "Personal" | "Business", need: "", city: cities[0] });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ok = f.name.trim() && f.phone.replace(/\D/g, "").length >= 10 && f.need.trim();
  return (
    <Drawer
      open
      onClose={onClose}
      title="Add a lead"
      subtitle="Enquiries from calls, WhatsApp or walk-ins. Website and WhatsApp leads arrive by themselves once the backend is connected."
      footer={
        <ActionButton
          permission="leads.edit"
          disabled={!ok}
          onClick={() => {
            const id = newId("L");
            update("Leads", `Added lead ${f.name}`, (db) => void db.leads.unshift({ id, createdAt: new Date().toISOString(), ...f, name: f.name.trim(), need: f.need.trim(), status: "new", notes: [] }), id);
            onAdded(id);
          }}
        >
          Add lead
        </ActionButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Labelled label="Name or company">
          <input value={f.name} onChange={set("name")} className={fieldClass} />
        </Labelled>
        <Labelled label="Phone">
          <input value={f.phone} onChange={set("phone")} inputMode="tel" className={fieldClass} />
        </Labelled>
        <Labelled label="Source">
          <select value={f.source} onChange={set("source")} className={fieldClass}>
            {leadSources.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Labelled>
        <Labelled label="Type">
          <select value={f.type} onChange={set("type")} className={fieldClass}>
            <option>Personal</option>
            <option>Business</option>
          </select>
        </Labelled>
        <Labelled label="City">
          <select value={f.city} onChange={set("city")} className={fieldClass}>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Labelled>
        <Labelled label="Looking for" className="sm:col-span-2">
          <textarea value={f.need} onChange={set("need")} rows={3} className={fieldClass} />
        </Labelled>
      </div>
    </Drawer>
  );
}
