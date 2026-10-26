"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { approvalSteps, sampleStage } from "@/content/artist-portal";
import { backendEnabled } from "@/lib/backend";
import { useArtistProfile, usePortalMode, usePortalState } from "@/lib/artist-live";
import { sectionLink } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";
import { Badge, Panel } from "./form";
import { SendToAod } from "./SendToAod";

const fmt = (iso?: string, withTime = false) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) })
    : "";

// The Approval page: every step from the application to going live (approvalSteps in
// src/content/artist-portal.ts), done steps ticked with their dates, the current one marked, then
// what AOD has checked. Live: from the artist's or applicant's own record (an approved artist has
// every step done). Preview: the "Preview as" switch (live artist, or the sample applicant).
export function ApprovalSteps() {
  const live = usePortalState().data;
  const mode = usePortalMode();
  const { profile } = useArtistProfile();

  // Where they are: the application's status (an artist record means approved).
  const status = backendEnabled ? (live?.kind === "artist" ? "approved" : (live?.applicationStatus ?? "submitted")) : mode === "live" ? "approved" : sampleStage >= 1 ? "review" : "submitted";
  const closed = status === "rejected";
  const current = status === "approved" ? approvalSteps.length : Math.max(0, approvalSteps.findIndex((s) => s.id === status));
  const done = Math.min(current, approvalSteps.length);

  const when: Partial<Record<(typeof approvalSteps)[number]["id"], string>> = {
    submitted: live?.appliedAt ? `Sent ${fmt(live.appliedAt)}` : undefined,
    meeting: live?.meeting ? `${fmt(live.meeting.at, true)}${live.meeting.place ? ` · ${live.meeting.place}` : ""}` : undefined,
    approved: live?.approvedAt ? `Live since ${fmt(live.approvedAt)}` : undefined,
  };

  const identity = backendEnabled ? Boolean(live?.identityVerified) : mode === "live";
  const files = live?.portfolio.length ?? 0;
  const checks: { label: string; text: string; state: ReactNode }[] = [
    {
      label: "Identity",
      text: "Checked by the AOD team during your review and meeting. No Aadhaar card or number is needed.",
      state: identity ? <Badge tone="good">Verified</Badge> : <Badge tone="wait">Not yet</Badge>,
    },
    {
      label: "Profile photo",
      text: "A clear photo of your face, shown to the AOD team.",
      state: profile.photo ? <Badge tone="good">Added</Badge> : <Link href={sectionLink("/artists/profile")} className="text-sm font-medium text-brand hover:underline">Add one</Link>,
    },
    {
      label: "Portfolio",
      text: `${files} photo${files === 1 ? "" : "s"} or video${files === 1 ? "" : "s"} uploaded, ${profile.links.length} link${profile.links.length === 1 ? "" : "s"}.`,
      state: files + profile.links.length > 0 ? <Badge tone="good">Shared</Badge> : <Link href={sectionLink("/artists/portfolio")} className="text-sm font-medium text-brand hover:underline">Add work</Link>,
    },
    { label: "Artist agreement", text: "Rates, cancellations and conduct, shared by AOD to sign once you're approved.", state: <Badge>{status === "approved" ? "From AOD" : "After approval"}</Badge> },
    { label: "Payout details", text: "Bank account or UPI and PAN, added after your trial booking.", state: <Badge>After the trial</Badge> },
  ];

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Panel
        title={closed ? "Application closed" : status === "approved" ? "You're approved" : `Step ${current + 1} of ${approvalSteps.length}`}
        text={closed ? "AOD's team has emailed you about the decision." : status === "approved" ? "Every step is done. Welcome to AOD." : "Where your application stands right now."}
        action={backendEnabled ? undefined : <Badge>Sample</Badge>}
      >
        <ol className="relative">
          {approvalSteps.map((s, i) => {
            const isDone = i < done;
            const now = i === current && !closed;
            const last = i === approvalSteps.length - 1;
            return (
              <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!last && <span aria-hidden className={`absolute left-[0.9rem] top-8 h-[calc(100%-2rem)] w-0.5 ${isDone ? "bg-brand" : "bg-line"}`} />}
                <span
                  className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isDone ? "bg-brand text-white" : now ? "bg-white text-brand ring-2 ring-brand" : closed && i === current ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-wash text-muted ring-1 ring-line"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" aria-hidden /> : closed && i === current ? <X className="h-4 w-4" aria-hidden /> : i + 1}
                </span>
                <div className="pt-0.5">
                  <p className={`flex flex-wrap items-center gap-2 font-medium ${now ? "text-brand" : isDone ? "text-ink" : "text-muted"}`}>
                    {s.title}
                    {now && <Badge tone="brand">Now</Badge>}
                    {isDone && <span className="sr-only">(done)</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{s.text}</p>
                  {when[s.id] && (isDone || now) && <p className="mt-1 text-sm font-medium text-ink">{when[s.id]}</p>}
                </div>
              </li>
            );
          })}
        </ol>
        <a
          href={whatsappUrl("Hi AOD, I have a question about my artist application.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex text-sm font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
        >
          Have a question? Message us
        </a>
      </Panel>

      <div className="space-y-6">
      <SendToAod />
      <Panel title="What AOD checks" text="Verified by the AOD team, not by an app.">
        <ul className="divide-y divide-line">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <span>
                <span className="block text-sm font-medium text-ink">{c.label}</span>
                <span className="mt-0.5 block text-xs text-muted">{c.text}</span>
              </span>
              <span className="shrink-0">{c.state}</span>
            </li>
          ))}
        </ul>
      </Panel>
      </div>
    </div>
  );
}
