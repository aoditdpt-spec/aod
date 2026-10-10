"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { caseSteps, resolution } from "@/content/resolution";
import { backendEnabled } from "@/lib/backend";
import { escalateCase, trackCase, type TrackedCase } from "@/server/actions/resolution";
import { field } from "./CaseForm";

const input = `mt-1.5 ${field}`;

const fmt = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Shown in the preview (no backend) so the page can be seen working. Labelled "Sample".
const sampleCase: TrackedCase = {
  id: "RC-1001",
  createdAt: new Date(Date.now() - 4 * 86400_000).toISOString(),
  role: "customer",
  issue: "Files not delivered or incomplete",
  bookingRef: "B-1207",
  incidentDate: new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10),
  outcome: "Replacement artist or re-shoot",
  status: "investigating",
  steps: [
    { status: "received", at: new Date(Date.now() - 4 * 86400_000).toISOString() },
    { status: "acknowledged", at: new Date(Date.now() - 3 * 86400_000).toISOString() },
    { status: "investigating", at: new Date(Date.now() - 2 * 86400_000).toISOString() },
  ],
};

// Track a case with its number and the email it was raised with; escalate it from here.
export function TrackCase() {
  const params = useSearchParams();
  const [id, setId] = useState((params.get("id") ?? "").toUpperCase());
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [found, setFound] = useState<{ c: TrackedCase; sample: boolean } | null>(null);

  const ready = /^RC-?\d+$/i.test(id.trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  async function look() {
    setError("");
    if (!backendEnabled) return setError("preview");
    setBusy(true);
    const res = await trackCase(id.trim().replace(/^RC-?/i, "RC-"), email);
    setBusy(false);
    if (res.ok) setFound({ c: res.case, sample: false });
    else setError(res.error);
  }

  // Keep a tracked case up to date while it's open: check again every minute, and when the tab
  // comes back into view. (Cases have no live channel: the person tracking isn't signed in.)
  const foundId = found && !found.sample ? found.c.id : null;
  useEffect(() => {
    if (!foundId) return;
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void trackCase(foundId, email).then((res) => {
        if (res.ok) setFound({ c: res.case, sample: false });
      });
    };
    const timer = setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [foundId, email]);

  if (found) {
    return (
      <CaseView
        c={found.c}
        sample={found.sample}
        email={email}
        onBack={() => setFound(null)}
        onEscalated={async () => {
          const res = await trackCase(found.c.id, email);
          if (res.ok) setFound({ c: res.case, sample: false });
        }}
      />
    );
  }

  return (
    <div className="rounded-panel border border-line bg-white p-6 sm:p-8">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) void look();
        }}
        className="grid gap-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
      >
        <label className="block text-sm font-medium text-ink">
          Case number
          <input value={id} onChange={(e) => setId(e.target.value.toUpperCase())} placeholder="RC-1001" className={input} />
        </label>
        <label className="block text-sm font-medium text-ink">
          Email you raised it with
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={input} />
        </label>
        <button type="submit" disabled={!ready || busy} className="h-[3.125rem] rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40">
          {busy ? "Looking…" : "Find case"}
        </button>
      </form>

      {error === "preview" ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p>Case tracking starts once the Resolution Centre is connected. Until then, ask AOD for an update on WhatsApp.</p>
          <button type="button" onClick={() => setFound({ c: sampleCase, sample: true })} className="mt-3 font-medium text-brand hover:underline">
            See what a tracked case looks like
          </button>
        </div>
      ) : error ? (
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      ) : null}
      <p className="mt-6 text-sm text-muted">
        No case yet?{" "}
        <Link href="/resolve/new" className="font-medium text-brand hover:underline">
          Raise one
        </Link>
        .
      </p>
    </div>
  );
}

function CaseView({ c, sample, email, onBack, onEscalated }: { c: TrackedCase; sample: boolean; email: string; onBack: () => void; onEscalated: () => Promise<void> }) {
  const [escalating, setEscalating] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // How far along the four public steps the case has got, and when each was reached.
  const order = caseSteps.map((s) => s.id as string);
  const reached = Math.max(...[...c.steps.map((s) => s.status), c.status].map((s) => order.indexOf(s)));
  const when = (status: string) => [...c.steps].reverse().find((s) => s.status === status)?.at;
  const finished = c.status === "resolved" || c.status === "closed";
  const roleLabel = resolution.roles.find((r) => r.id === c.role)?.label;

  return (
    <div className="space-y-6">
      <div className="rounded-panel border border-line bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted">
              {sample && <span className="rounded-md bg-wash px-2 py-0.5 text-xs font-medium text-muted ring-1 ring-line">Sample</span>}
              Raised {fmt(c.createdAt)}
            </p>
            <h2 className="mt-1 text-2xl font-medium text-ink">Case {c.id}</h2>
            <p className="mt-1 text-body">{c.issue}</p>
          </div>
          <button type="button" onClick={onBack} className="text-sm font-medium text-brand hover:underline">
            Look up another case
          </button>
        </div>
        <dl className="mt-6 grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-4">
          {[
            ["Booking", c.bookingRef],
            ["Happened on", c.incidentDate ? fmt(c.incidentDate) : "—"],
            ["You asked for", c.outcome],
            ["Raised as", roleLabel],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted">{k}</dt>
              <dd className="mt-0.5 font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-panel border border-line bg-white p-6 sm:p-8">
        <h3 className="text-lg font-medium text-ink">Progress</h3>
        <ol className="mt-5 space-y-5">
          {caseSteps.map((s, i) => {
            // The step the case is on now (unless it's settled or escalated); earlier steps are ticked.
            const current = i === reached && !finished && c.status !== "escalated";
            const ticked = i <= reached && !current;
            const at = when(s.id);
            return (
              <li key={s.id} className="relative flex gap-4">
                {i < caseSteps.length - 1 && <span aria-hidden className={`absolute left-[0.8125rem] top-8 h-[calc(100%-0.75rem)] w-px ${i < reached ? "bg-brand" : "bg-line"}`} />}
                <span
                  className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${ticked ? "bg-brand text-white" : current ? "border-2 border-brand bg-white text-brand" : "border border-line bg-white text-muted"}`}
                >
                  {ticked ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                </span>
                <span>
                  <span className={`block font-medium ${i <= reached ? "text-ink" : "text-muted"}`}>
                    {s.label}
                    {at && i <= reached && <span className="ml-2 text-sm font-normal text-muted">{fmt(at)}</span>}
                    {current && <span className="ml-2 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Now</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{s.text}</span>
                </span>
              </li>
            );
          })}
          {c.status === "escalated" && (
            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-red-600 bg-white text-xs font-medium text-red-700">!</span>
              <span>
                <span className="block font-medium text-ink">
                  Escalated to the grievance officer
                  <span className="ml-2 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Now</span>
                </span>
                <span className="mt-0.5 block text-sm text-muted">The grievance officer is reviewing the case afresh and will reply by email.</span>
              </span>
            </li>
          )}
          {c.status === "closed" && (
            <li className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-night text-white">
                <Check className="h-4 w-4" aria-hidden />
              </span>
              <span className="block font-medium text-ink">Closed</span>
            </li>
          )}
        </ol>

        {c.resolution && (
          <div className="mt-6 rounded-xl bg-wash p-5">
            <p className="text-sm font-medium text-ink">AOD&apos;s decision</p>
            <p className="mt-1 text-body">{c.resolution}</p>
          </div>
        )}
      </div>

      {c.status !== "escalated" && (
        <div className="rounded-panel border border-line bg-white p-6 sm:p-8">
          <h3 className="text-lg font-medium text-ink">{resolution.escalateTitle}</h3>
          <p className="mt-1 text-body">Escalate the case and AOD&apos;s grievance officer reviews it afresh.</p>
          {!escalating ? (
            <button type="button" onClick={() => setEscalating(true)} className="mt-4 inline-flex h-11 items-center rounded-lg border border-line px-5 font-medium text-ink hover:border-ink">
              Escalate this case
            </button>
          ) : (
            <div className="mt-4">
              <label className="block text-sm font-medium text-ink">
                Why are you escalating?
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={input} />
              </label>
              {sample && <p className="mt-2 text-sm text-muted">This is a sample case, so nothing will be sent.</p>}
              {error && (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  disabled={sample || busy || reason.trim().length < 10}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    const res = await escalateCase(c.id, email, reason);
                    setBusy(false);
                    if (res.ok) {
                      setEscalating(false);
                      await onEscalated();
                    } else setError(res.error);
                  }}
                  className="inline-flex h-11 items-center rounded-lg bg-brand px-5 font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? "Sending…" : "Escalate"}
                </button>
                <button type="button" onClick={() => setEscalating(false)} className="text-sm font-medium text-muted hover:text-ink">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
