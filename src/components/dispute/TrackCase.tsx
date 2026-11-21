"use client";

import { useState, useSyncExternalStore } from "react";
import { caseForm as f } from "@/data/dispute-form";
import { act, ago, useDb } from "@/lib/app-db";
import { backendEnabled } from "@/lib/backend";
import { escalateCase, trackCase, type TrackedCase } from "@/server/actions/resolution";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";

// Track a dispute, as on aod.co.in: the case number and the email it was raised with show its
// progress and AOD's decision, and Escalate sends it to the grievance officer. It never shows the
// team's internal notes. Live: looked up on the server (trackCase), which needs both to match.
// Test mode: sample cases (raised without an email) open with any email.

const input = "h-12 w-full rounded-lg border border-line bg-paper px-4 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";
const noop = () => () => {};

type View = { id: string; about: string; outside: boolean; raisedAt: string; status: "new" | "replied" | "escalated" | "resolved"; decision?: string };

const fromTracked = (c: TrackedCase): View => ({
  id: c.id,
  about: c.issue,
  outside: !c.bookingRef,
  raisedAt: c.createdAt,
  status: c.status === "received" ? "new" : c.status === "escalated" ? "escalated" : c.status === "resolved" || c.status === "closed" ? "resolved" : "replied",
  decision: c.resolution,
});

export function TrackCase() {
  const db = useDb();
  const fromLink = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("case") ?? new URLSearchParams(window.location.search).get("id") ?? "", () => "");
  const [num, setNum] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [asked, setAsked] = useState(false);
  const [live, setLive] = useState<View | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const caseNo = (num ?? fromLink).trim().toUpperCase();
  const sample = db?.cases.find((c) => c.id === caseNo && (!c.email || !email.trim() || c.email === email.trim().toLowerCase()));
  const found: View | undefined = backendEnabled ? (live ?? undefined) : sample;

  async function look() {
    setAsked(true);
    if (!backendEnabled) return;
    setBusy(true);
    setError(null);
    const res = await trackCase(caseNo, email).catch(() => ({ ok: false as const, error: "Couldn't look up your case just now. Please try again in a minute." }));
    setBusy(false);
    if (res.ok) setLive(fromTracked(res.case));
    else {
      setLive(null);
      setError(res.error);
    }
  }

  async function escalate(id: string) {
    if (!backendEnabled) return act.escalate(id);
    const reason = window.prompt("Why are you escalating it? (a sentence or two)") ?? "";
    if (!reason.trim()) return;
    const res = await escalateCase(id, email, reason).catch(() => ({ ok: false as const, error: "Couldn't escalate just now. Please try again." }));
    if (!res.ok) return setError(res.error);
    setEscalated(true);
    void look();
  }

  return (
    <div className="max-w-3xl">
      <form
        className="grid gap-4 border-t border-ink pt-8 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          void look();
        }}
      >
        <label className="block">
          <span className="mb-2 block text-sm text-muted">Case Number</span>
          <input value={num ?? fromLink} onChange={(e) => setNum(e.target.value)} placeholder="DC-1004" className={input} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-muted">Email You Raised It With</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={input} />
        </label>
        <button disabled={busy} className={`${primaryButton} disabled:opacity-50`}>
          {busy ? "Looking…" : "Track"}
        </button>
      </form>

      {backendEnabled && error && <p className="mt-8 text-red-600">{error}</p>}
      {!backendEnabled && (asked || fromLink) && db && !found && <p className="mt-8 text-muted">No case matches that number and email.</p>}

      {(asked || (!backendEnabled && fromLink)) && found && (
        <div className="mt-12">
          <p className="text-sm text-muted">{found.outside ? "AOD Mediates" : "Booked Through AOD"}</p>
          <h2 className="mt-2 text-4xl">
            {found.id} · {found.about}
          </h2>
          <p className="mt-2 text-muted">Raised {ago(found.raisedAt)}</p>
          <ol className="mt-10 space-y-6">
            {(found.outside ? f.stepsOutside : f.steps).map((s, i) => {
              const at = found.status === "resolved" ? 2 : found.status === "new" ? 0 : 1;
              return (
                <li key={s.id} className="grid grid-cols-[28px_1fr] gap-4">
                  <span className={`mt-1 grid h-6 w-6 place-items-center rounded-full text-xs ${i <= at ? "bg-ink text-paper" : "border border-line text-muted"}`}>{i + 1}</span>
                  <span>
                    <span className={`block font-medium ${i <= at ? "" : "text-muted"}`}>{s.label}</span>
                    <span className="mt-1 block text-sm text-muted">{s.text}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          {(found.status === "escalated" || escalated) && <p className="mt-8 rounded-lg bg-wash p-4">Escalated: AOD&apos;s grievance officer is reviewing the case afresh.</p>}
          {found.decision && (
            <section className="mt-10 border-t border-line pt-6">
              <h3 className="text-2xl">AOD&apos;s Decision</h3>
              <p className="mt-3 whitespace-pre-line text-ink/80">{found.decision}</p>
            </section>
          )}
          {found.status !== "escalated" && !escalated && (
            <div className="mt-10 border-t border-line pt-6">
              <p className="text-muted">Not happy with the outcome? The grievance officer reviews it afresh.</p>
              <button type="button" onClick={() => void escalate(found.id)} className={`${secondaryButton} mt-4`}>
                Escalate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
