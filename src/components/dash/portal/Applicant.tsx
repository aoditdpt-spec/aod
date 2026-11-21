"use client";

import Link from "@/components/ui/AppLink";
import { ago, appStages, shortDate, type Application } from "@/lib/app-db";
import { completeness } from "./CompleteProfile";
import { meetingWhenPlain } from "./time";
import { btnMain } from "../ui";

// The portal for someone who has applied but isn't approved yet, as on aod.co.in: where their
// application is (sent, portfolio review, meeting with its time, trial booking, approved), what
// AOD checks, and Complete Your Details (Profile page), where they submit it for review.

const texts: Record<string, string> = {
  review: "Our team is reviewing your portfolio. We'll message you if we need anything else.",
  meeting: "A short meeting to get to know you. The team confirms the time with you.",
  trial: "Your trial booking is being arranged. AOD will share the event details with you.",
  rejected: "AOD's team has emailed you about the decision.",
};

export function ApplicantDashboard({ app }: { app: Application }) {
  const order = ["review", "meeting", "trial", "approved"];
  const at = order.indexOf(app.stage);
  return (
    <>
      <div className="border-b border-line pb-7">
        <p className="text-sm text-muted">Application {app.id}</p>
        <h1 className="mt-1.5 text-[34px]">Hello, {app.name.split(" ")[0] || "There"}</h1>
        <p className="mt-3 max-w-xl text-muted">{app.stage === "rejected" ? "Application closed." : (texts[app.stage] ?? "")}</p>
      </div>

      <div className="mt-10 grid gap-14 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-4 text-[17px]">Your Application</h2>
          <ol className="text-sm">
            <li className="grid grid-cols-[20px_1fr_auto] gap-2.5 border-t border-line py-3">
              <span>✓</span>
              <span>Application Sent</span>
              <span className="text-muted">{shortDate(app.applied)}</span>
            </li>
            {appStages
              .filter((s) => s.id !== "rejected")
              .map((s, i) => {
                const done = app.stage !== "rejected" && i < at;
                const now = app.stage !== "rejected" && i === at;
                return (
                  <li key={s.id} className="grid grid-cols-[20px_1fr_auto] gap-2.5 border-t border-line py-3">
                    <span className={now ? "text-brand" : ""}>{done ? "✓" : now ? "●" : ""}</span>
                    <span className={done || now ? "" : "text-muted"}>{s.label}</span>
                    <span className="text-muted">{s.id === "meeting" && app.meetingAt ? meetingWhenPlain(app.meetingAt) : ""}</span>
                  </li>
                );
              })}
          </ol>
        </section>
        <section>
          <h2 className="mb-4 text-[17px]">Complete Your Details</h2>
          <p className="text-muted">{completeness(app)}% complete. Add your photo and a few questions about your work, then submit it for review.</p>
          <div className="mt-3 h-1 rounded-full bg-line">
            <i className="block h-full rounded-full bg-ink" style={{ width: `${completeness(app)}%` }} />
          </div>
          <Link href="/artists/profile" className={`${btnMain} mt-4`}>
            Complete Your Details
          </Link>
          {app.submittedAt && <p className="mt-3 text-sm text-muted">Sent for review {ago(app.submittedAt)}.</p>}
          <h2 className="mb-3 mt-10 text-[17px]">What AOD Checks</h2>
          <ul className="text-sm">
            {["Identity", "Profile Photo", "Portfolio", "Artist Agreement", "Payout Details (After The Trial)"].map((c) => (
              <li key={c} className="border-t border-line py-2.5">
                {c}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
