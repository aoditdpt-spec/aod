"use client";

import { CalendarClock, CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { applicationStages } from "@/content/admin";
import { categories, cities } from "@/content/site";
import { currentUser, newId, update, useDb, type Application, type ApplicationStatus } from "@/lib/admin-store";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { DataTable, type Column } from "../DataTable";
import {
  ActionButton,
  ago,
  categoryName,
  Details,
  Drawer,
  DrawerSection,
  fieldBase,
  fieldClass,
  fillTemplate,
  fmtDate,
  Labelled,
  NotesBox,
  PageHeader,
  StageBadge,
  StatusBadge,
  toLocalInput,
  useCan,
  whatsappTo,
} from "../ui";
import { useOpen } from "../useOpen";

const columns: Column<Application>[] = [
  { key: "name", label: "Applicant", render: (a) => a.name, value: (a) => a.name },
  { key: "category", label: "Category", render: (a) => categoryName(a.category), value: (a) => categoryName(a.category) },
  { key: "city", label: "City", render: (a) => a.city, value: (a) => a.city, hideOnMobile: true },
  { key: "experience", label: "Experience", render: (a) => a.experience, value: (a) => a.experience, hideOnMobile: true },
  { key: "submitted", label: "Submitted", render: (a) => ago(a.submittedAt), value: (a) => a.submittedAt, hideOnMobile: true },
  { key: "meeting", label: "Meeting", render: (a) => (a.meeting ? fmtDate(a.meeting.at, true) : "—"), value: (a) => a.meeting?.at ?? "", hideOnMobile: true },
  { key: "status", label: "Status", render: (a) => <StageBadge stages={applicationStages} id={a.status} />, value: (a) => applicationStages.find((s) => s.id === a.status)?.label },
];

export function Applications() {
  const db = useDb();
  const [openId, setOpen] = useOpen();
  if (!db) return null;
  const open = db.applications.find((a) => a.id === openId) ?? null;
  const counts = applicationStages.map((s) => ({ ...s, n: db.applications.filter((a) => a.status === s.id).length }));

  return (
    <div className="space-y-6">
      <PageHeader title="Artist applications" text="Review applications, meet artists in person, run the trial booking, then approve. Approving adds the artist to the directory." />
      <ul className="flex flex-wrap gap-2 text-sm">
        {counts.map((c) => (
          <li key={c.id} className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5">
            <StageBadge stages={applicationStages} id={c.id} />
            <span className="font-medium text-ink">{c.n}</span>
          </li>
        ))}
      </ul>
      <DataTable
        rows={db.applications}
        columns={columns}
        getId={(a) => a.id}
        onOpen={(a) => setOpen(a.id)}
        exportName="applications"
        initialSort={{ key: "submitted", dir: "desc" }}
        filters={[
          { label: "Status", options: applicationStages.map((s) => ({ value: s.id, label: s.label })), test: (a, v) => a.status === v },
          { label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })), test: (a, v) => a.category === v },
          { label: "City", options: cities.map((c) => ({ value: c, label: c })), test: (a, v) => a.city === v },
        ]}
      />
      {open && <ApplicationDrawer key={open.id} app={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function ApplicationDrawer({ app, onClose }: { app: Application; onClose: () => void }) {
  const allowed = useCan();
  const [meetingAt, setMeetingAt] = useState(app.meeting ? toLocalInput(app.meeting.at) : "");
  const [place, setPlace] = useState(app.meeting?.place ?? "AOD office, Ahmedabad");
  const [reason, setReason] = useState("");
  const editable = allowed("applications.edit");

  const setStatus = (status: ApplicationStatus, text: string, extra?: (a: Application) => void) =>
    update(
      "Applications",
      text,
      (db) => {
        const a = db.applications.find((x) => x.id === app.id)!;
        a.status = status;
        extra?.(a);
      },
      app.id,
    );

  const approve = () =>
    update(
      "Applications",
      `Approved ${app.name} and added them to the artist directory`,
      (db) => {
        const a = db.applications.find((x) => x.id === app.id)!;
        const id = newId("ART");
        a.status = "approved";
        a.artistId = id;
        db.artists.unshift({
          id,
          name: a.name,
          phone: a.phone,
          email: a.email,
          city: a.city,
          category: a.category,
          services: a.services,
          experience: a.experience,
          languages: a.languages,
          joinedAt: new Date().toISOString(),
          status: "active",
          kyc: a.kyc === "verified" ? "verified" : "pending",
          payoutUpi: "",
          blockedDates: [],
          notes: [{ at: new Date().toISOString(), by: currentUser(), text: `Approved from application ${a.id}.` }],
        });
      },
      app.id,
    );

  const meetingText = app.meeting ? fmtDate(app.meeting.at, true) : meetingAt ? fmtDate(meetingAt, true) : "{meeting}";
  const vars = { applicant: app.name.split(" ")[0], meeting: meetingText };

  return (
    <Drawer
      open
      onClose={onClose}
      title={app.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          {app.id} · {categoryName(app.category)} · {app.city} <StageBadge stages={applicationStages} id={app.status} />
        </span>
      }
      footer={
        <>
          <a href={whatsappTo(app.phone, `Hi ${vars.applicant}, `)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <a href={`tel:${app.phone.replace(/\s/g, "")}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink">
            Call
          </a>
        </>
      }
    >
      <DrawerSection title="Applicant">
        <Details
          rows={[
            ["Phone", app.phone],
            ["Email", app.email],
            ["Services", app.services.join(", ")],
            ["Experience", app.experience],
            ["Languages", app.languages.join(", ")],
            ["Submitted", fmtDate(app.submittedAt, true)],
            [
              "Identity",
              app.kyc === "verified" ? (
                <StatusBadge tone="good">Verified (DigiLocker)</StatusBadge>
              ) : (
                <span className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="wait">Not verified</StatusBadge>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => update("Applications", `Marked ${app.name}'s identity as verified`, (db) => void (db.applications.find((x) => x.id === app.id)!.kyc = "verified"), app.id)}
                      className="text-xs font-medium text-brand underline underline-offset-2"
                    >
                      Mark verified
                    </button>
                  )}
                </span>
              ),
            ],
          ]}
        />
        <p className="mt-4 rounded-lg bg-wash p-3 text-sm text-body">{app.bio}</p>
      </DrawerSection>

      <DrawerSection title="Portfolio">
        <ul className="space-y-2">
          {app.links.map((l) => {
            const c = checkPortfolioLink(l);
            return (
              <li key={l}>
                <a href={l} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-sm hover:border-brand">
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{c.ok ? c.label : "Link"}</span>
                    <span className="block truncate text-xs text-muted">{l}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                </a>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">Uploaded photos, videos and resumes will open here from private storage once the backend is connected.</p>
      </DrawerSection>

      {app.status !== "approved" && app.status !== "rejected" && (
        <DrawerSection title="Next step">
          <div className="space-y-4">
            {app.status === "submitted" && (
              <ActionButton permission="applications.edit" onClick={() => setStatus("review", `Started reviewing ${app.name}`)}>
                Start review
              </ActionButton>
            )}
            {(app.status === "submitted" || app.status === "review" || app.status === "meeting") && (
              <div className="rounded-xl border border-line p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-ink">
                  <CalendarClock className="h-4 w-4 text-brand" aria-hidden /> {app.meeting ? "Reschedule the meeting" : "Schedule the in-person meeting"}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Labelled label="Date and time">
                    <input type="datetime-local" value={meetingAt} onChange={(e) => setMeetingAt(e.target.value)} className={fieldClass} />
                  </Labelled>
                  <Labelled label="Place">
                    <input value={place} onChange={(e) => setPlace(e.target.value)} className={fieldClass} />
                  </Labelled>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton
                    permission="applications.edit"
                    disabled={!meetingAt}
                    onClick={() =>
                      setStatus("meeting", `Scheduled a meeting with ${app.name} on ${fmtDate(meetingAt, true)}`, (a) => {
                        a.meeting = { at: new Date(meetingAt).toISOString(), place };
                      })
                    }
                  >
                    Save meeting
                  </ActionButton>
                  {meetingAt && (
                    <a
                      href={whatsappTo(app.phone, fillTemplate("application_meeting", { ...vars, meeting: `${fmtDate(meetingAt, true)} (${place})` }))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-sm font-medium text-ink hover:border-ink"
                    >
                      <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Send invite
                    </a>
                  )}
                </div>
              </div>
            )}
            {app.status === "meeting" && (
              <ActionButton permission="applications.edit" variant="secondary" onClick={() => setStatus("trial", `Met ${app.name}; moved to trial booking`)}>
                <ShieldCheck className="h-4 w-4" aria-hidden /> Met in person → trial booking
              </ActionButton>
            )}
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <ActionButton permission="applications.edit" onClick={approve}>
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Approve
              </ActionButton>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (kept internal)" className={`${fieldBase} min-w-0 flex-1`} disabled={!editable} />
              <ActionButton
                permission="applications.edit"
                variant="danger"
                onClick={() =>
                  setStatus("rejected", `Didn't select ${app.name}${reason ? `: ${reason}` : ""}`, (a) => {
                    if (reason) a.notes.unshift({ at: new Date().toISOString(), by: currentUser(), text: `Not selected: ${reason}` });
                  })
                }
              >
                <XCircle className="h-4 w-4" aria-hidden /> Not select
              </ActionButton>
            </div>
          </div>
        </DrawerSection>
      )}

      {(app.status === "approved" || app.status === "rejected") && (
        <DrawerSection title="Let them know">
          <a
            href={whatsappTo(app.phone, fillTemplate(app.status === "approved" ? "application_approved" : "application_rejected", vars))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover"
          >
            <WhatsAppIcon className="h-4 w-4" /> Send the {app.status === "approved" ? "welcome" : "decision"} message
          </a>
        </DrawerSection>
      )}

      <DrawerSection title="Team notes">
        <NotesBox
          notes={app.notes}
          permission="applications.edit"
          onAdd={(text) => update("Applications", `Added a note to ${app.name}`, (db) => void db.applications.find((x) => x.id === app.id)!.notes.unshift({ at: new Date().toISOString(), by: currentUser(), text }), app.id)}
        />
      </DrawerSection>
    </Drawer>
  );
}
