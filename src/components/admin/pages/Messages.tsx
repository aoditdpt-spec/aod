"use client";

import { Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { templates, type TemplateId } from "@/content/admin";
import { useDb } from "@/lib/admin-store";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { CopyButton } from "@/components/pay/CopyButton";
import { payLink, usePayBase } from "@/components/pay/PayLinkBuilder";
import { artistName, Card, fieldClass, fmtDate, inr, Labelled, PageHeader, useCan, whatsappTo } from "../ui";

const groups = [
  { to: "customer", label: "To customers" },
  { to: "artist", label: "To artists" },
  { to: "applicant", label: "To applicants" },
] as const;

// Which automatic message goes when, once the WhatsApp Business Platform is connected.
const automatic = [
  ["Booking request received", "Customer", "Instantly, with the request summary"],
  ["Availability check", "Artist", "When the team assigns or shortlists an artist"],
  ["Quote", "Customer", "When the quote is saved"],
  ["Payment reminder", "Customer", "Before the payment hold expires"],
  ["Booking confirmed", "Customer + artist", "When the payment is verified"],
  ["Event reminder", "Customer + artist", "The day before the event"],
  ["Delivery link", "Customer", "When the delivery link is saved"],
  ["Link expiring", "Customer", "5 days before the delivery link expires"],
  ["Review request", "Customer", "2 days after delivery"],
  ["Application update", "Applicant", "On every status change"],
];

// Message templates with the details filled in from a booking or application, sent from the
// team's WhatsApp until the WhatsApp Business Platform sends them automatically.
export function Messages() {
  const db = useDb();
  const allowed = useCan();
  const base = usePayBase();
  const [templateId, setTemplateId] = useState<TemplateId>("quote");
  const [recordId, setRecordId] = useState("");
  const [edited, setEdited] = useState<string | null>(null);
  const t = templates.find((x) => x.id === templateId)!;

  const recipient = useMemo(() => {
    if (!db) return null;
    if (t.to === "applicant") {
      const a = db.applications.find((x) => x.id === recordId) ?? db.applications[0];
      if (!a) return null;
      return { id: a.id, name: a.name, phone: a.phone, email: a.email, vars: { applicant: a.name.split(" ")[0], meeting: a.meeting ? fmtDate(a.meeting.at, true) : "{meeting}" } as Record<string, string> };
    }
    const b = db.bookings.find((x) => x.id === recordId) ?? db.bookings[0];
    if (!b) return null;
    const artist = db.artists.find((a) => a.id === b.artistId);
    const due = b.advance ?? b.quote;
    const vars: Record<string, string> = {
      customer: b.customer.name.split(" ")[0],
      service: b.service,
      event: b.event.toLowerCase(),
      date: fmtDate(b.date),
      city: b.city,
      ref: b.id,
      amount: inr(due),
      quote: inr(b.quote),
      budget: b.budget,
      paylink: base ? payLink(base, { amount: due, forText: `${b.service}, ${fmtDate(b.date)}`, ref: b.id, name: b.customer.name }) : "",
      artist: artistName(db, b.artistId),
      delivery: b.delivery?.link ?? "{delivery}",
      expiry: b.delivery ? fmtDate(b.delivery.expires) : "{expiry}",
    };
    return t.to === "artist"
      ? { id: b.id, name: artist?.name ?? "No artist assigned", phone: artist?.phone ?? "", email: artist?.email ?? "", vars }
      : { id: b.id, name: b.customer.name, phone: b.customer.phone, email: b.customer.email, vars };
  }, [db, t, recordId, base]);

  if (!db) return null;
  const filled = recipient ? t.text.replace(/\{(\w+)\}/g, (_, k: string) => recipient.vars[k] ?? `{${k}}`) : t.text;
  const text = edited ?? filled;
  const records = t.to === "applicant" ? db.applications.map((a) => ({ id: a.id, label: `${a.id} · ${a.name}` })) : db.bookings.map((b) => ({ id: b.id, label: `${b.id} · ${b.customer.name} · ${b.service}` }));

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" text="Ready-made WhatsApp messages with the booking details filled in. Edit before sending if needed." />
      <div className="grid items-start gap-6 xl:grid-cols-[20rem_1fr]">
        <Card title="Templates">
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.to}>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">{g.label}</p>
                <ul className="space-y-0.5">
                  {templates
                    .filter((x) => x.to === g.to)
                    .map((x) => (
                      <li key={x.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTemplateId(x.id);
                            setEdited(null);
                            if (x.to !== t.to) setRecordId("");
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${x.id === templateId ? "bg-peach/60 font-medium text-ink" : "text-body hover:bg-wash"}`}
                        >
                          {x.name}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title={t.name}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Labelled label={t.to === "applicant" ? "Application" : "Booking"}>
                <select
                  value={recipient?.id ?? ""}
                  onChange={(e) => {
                    setRecordId(e.target.value);
                    setEdited(null);
                  }}
                  className={fieldClass}
                >
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Labelled>
              <Labelled label="Sends to">
                <p className="py-2 text-sm text-ink">
                  {recipient?.name} {recipient?.phone && <span className="text-muted">· {recipient.phone}</span>}
                </p>
              </Labelled>
            </div>
            <Labelled label="Message" className="mt-4">
              <textarea value={text} onChange={(e) => setEdited(e.target.value)} rows={6} className={`${fieldClass} leading-relaxed`} />
            </Labelled>
            {/\{\w+\}/.test(text) && <p className="mt-2 text-xs text-amber-800">Some details are missing for this record (shown in braces). Fill them in before sending.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={recipient?.phone && allowed("messages.send") ? whatsappTo(recipient.phone, text) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!recipient?.phone || !allowed("messages.send")}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover ${recipient?.phone && allowed("messages.send") ? "" : "pointer-events-none opacity-40"}`}
              >
                <WhatsAppIcon className="h-4 w-4" /> Open in WhatsApp
              </a>
              {recipient?.email && (
                <a
                  href={`mailto:${recipient.email}?subject=${encodeURIComponent(`Artists on Demand · ${t.name}`)}&body=${encodeURIComponent(text)}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3.5 text-sm font-medium text-ink hover:border-ink"
                >
                  <Mail className="h-4 w-4" aria-hidden /> Email
                </a>
              )}
              <CopyButton text={text} label="Copy text" className="h-9" />
            </div>
          </Card>

          <Card title="Automatic messages (after the WhatsApp Business Platform is connected)">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">Message</th>
                    <th scope="col" className="py-2 pr-4 font-medium">To</th>
                    <th scope="col" className="py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {automatic.map(([m, to, when]) => (
                    <tr key={m} className="border-b border-line/70 last:border-0">
                      <td className="py-2 pr-4 text-ink">{m}</td>
                      <td className="py-2 pr-4 text-body">{to}</td>
                      <td className="py-2 text-body">{when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
