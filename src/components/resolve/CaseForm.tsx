"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, X } from "lucide-react";
import { resolution, type CaseRole } from "@/content/resolution";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { backendEnabled } from "@/lib/backend";
import { siteHref } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";
import { createCase } from "@/server/actions/resolution";

export const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 font-normal text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-brand";
const input = `mt-1.5 ${field}`;

const isRole = (v: string | null): v is CaseRole => resolution.roles.some((r) => r.id === v);
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const linkOk = (l: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(l.trim());

// The "Raise a case" form. `?role=` and `?ref=` pre-fill it (links from My bookings and the
// artist portal). Every field is required except evidence links. It only says "received" once
// the case is saved; until the backend is connected it hands the case to WhatsApp instead.
export function CaseForm() {
  const params = useSearchParams();
  const [role, setRole] = useState<CaseRole | null>(isRole(params.get("role")) ? (params.get("role") as CaseRole) : null);
  const [f, setF] = useState({
    issue: "",
    bookingRef: (params.get("ref") ?? "").slice(0, 60),
    incidentDate: "",
    description: "",
    outcome: "",
    name: "",
    phone: "",
    email: "",
    website: "",
  });
  const [evidence, setEvidence] = useState<string[]>([""]);
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<{ kind: "idle" | "saving" } | { kind: "saved"; id: string } | { kind: "error"; error: string } | { kind: "preview" }>({ kind: "idle" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const issues = role ? resolution.issues[role] : [];
  const links = evidence.map((l) => l.trim()).filter(Boolean);
  const missing = [
    !role && "who you are",
    !issues.includes(f.issue) && "what went wrong",
    f.bookingRef.trim().length < 3 && "the booking number",
    (!f.incidentDate || f.incidentDate > today()) && "the date it happened",
    f.description.trim().length < 20 && "what happened (a few sentences)",
    !f.outcome && "what you'd like done",
    links.some((l) => !linkOk(l)) && "full evidence links (https://…)",
    f.name.trim().length < 2 && "your name",
    f.phone.replace(/\D/g, "").length < 10 && "your phone number",
    !emailOk(f.email) && "your email",
    !agree && "the confirmation",
  ].filter(Boolean) as string[];

  const roleLabel = resolution.roles.find((r) => r.id === role)?.label ?? "";
  const message = [
    "Hi AOD, I'd like to raise a case with the Resolution Centre.",
    `Who: ${f.name.trim()} (${roleLabel})`,
    `Booking: ${f.bookingRef.trim()}`,
    `What went wrong: ${f.issue}`,
    `When: ${f.incidentDate}`,
    `What happened: ${f.description.trim()}`,
    `I'd like: ${f.outcome}`,
    ...links.map((l) => `Evidence: ${l}`),
    `Phone: ${f.phone.trim()}`,
    `Email: ${f.email.trim()}`,
  ].join("\n");

  async function submit() {
    if (missing.length || !role) return;
    if (!backendEnabled) return setState({ kind: "preview" });
    setState({ kind: "saving" });
    const res = await createCase({ role, ...f, evidence: links, agree });
    setState(res.ok ? { kind: "saved", id: res.id } : { kind: "error", error: res.error });
  }

  if (state.kind === "saved") {
    return (
      <div className="rounded-panel border border-line bg-white p-8 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-medium text-ink">Case {state.id} received</h2>
        <p className="mx-auto mt-2 max-w-md text-body">
          AOD will reply by email to <strong className="font-medium">{f.email.trim()}</strong> within 48 hours. Keep the case number to follow it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/resolve/track?id=${state.id}`} className="inline-flex h-12 items-center rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover">
            Track this case
          </Link>
          <a
            href={whatsappUrl(`Hi AOD, adding photos and chats to case ${state.id}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-line px-6 font-medium text-ink hover:border-ink"
          >
            <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Send photos on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-6"
    >
      {/* 1. Who */}
      <fieldset className="rounded-panel border border-line bg-white p-6 sm:p-8">
        <legend className="sr-only">Who you are</legend>
        <p className="flex items-center gap-3 text-lg font-medium text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white">1</span> Who are you?
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {resolution.roles.map((r) => (
            <label
              key={r.id}
              className={`cursor-pointer rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${role === r.id ? "border-brand bg-peach/40" : "border-line hover:border-ink"}`}
            >
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={role === r.id}
                onChange={() => {
                  setRole(r.id);
                  setF((x) => ({ ...x, issue: resolution.issues[r.id].includes(x.issue) ? x.issue : "" }));
                }}
                className="sr-only"
              />
              <span className="block font-medium text-ink">{r.label}</span>
              <span className="mt-0.5 block text-sm text-muted">{r.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 2. What happened */}
      <fieldset disabled={!role} className="rounded-panel border border-line bg-white p-6 transition-opacity disabled:opacity-50 sm:p-8">
        <legend className="sr-only">What happened</legend>
        <p className="flex items-center gap-3 text-lg font-medium text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white">2</span> What happened?
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            What went wrong
            <select value={f.issue} onChange={set("issue")} className={input} required>
              <option value="" disabled>
                {role ? "Choose one" : "Pick who you are first"}
              </option>
              {issues.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            When it happened
            <input type="date" max={today()} value={f.incidentDate} onChange={set("incidentDate")} className={input} required />
          </label>
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            Booking or request number
            <input value={f.bookingRef} onChange={set("bookingRef")} placeholder="B-1215 or AOD-1215" className={input} required />
            <span className="mt-1.5 block text-xs font-normal text-muted">{resolution.bookingRefHint}</span>
          </label>
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            Tell AOD what happened
            <textarea
              value={f.description}
              onChange={set("description")}
              rows={5}
              placeholder="What was agreed, what happened instead, and anything you've already tried."
              className={input}
              required
            />
            <span className="mt-1.5 block text-xs font-normal text-muted">{f.description.trim().length < 20 ? "A few sentences, at least 20 characters." : `${f.description.trim().length} characters`}</span>
          </label>
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            What would you like AOD to do?
            <select value={f.outcome} onChange={set("outcome")} className={input} required>
              <option value="" disabled>
                Choose one
              </option>
              {resolution.outcomes.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-ink">
              Evidence links <span className="font-normal text-muted">(if you have any)</span>
            </p>
            <p className="mt-1 text-xs text-muted">{resolution.evidenceHint}</p>
            <div className="mt-2 space-y-2">
              {evidence.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={l}
                    onChange={(e) => setEvidence((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                    inputMode="url"
                    placeholder="https://drive.google.com/…"
                    aria-label={`Evidence link ${i + 1}`}
                    aria-invalid={l.trim() !== "" && !linkOk(l)}
                    className={`${field} aria-[invalid=true]:border-red-500`}
                  />
                  {evidence.length > 1 && (
                    <button type="button" onClick={() => setEvidence((list) => list.filter((_, j) => j !== i))} aria-label="Remove link" className="shrink-0 rounded-xl border border-line px-3 text-muted hover:border-ink hover:text-ink">
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {evidence.length < 5 && (
              <button type="button" onClick={() => setEvidence((list) => [...list, ""])} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                <Plus className="h-4 w-4" aria-hidden /> Add another link
              </button>
            )}
          </div>
        </div>
      </fieldset>

      {/* 3. Contact */}
      <fieldset disabled={!role} className="rounded-panel border border-line bg-white p-6 transition-opacity disabled:opacity-50 sm:p-8">
        <legend className="sr-only">Your details</legend>
        <p className="flex items-center gap-3 text-lg font-medium text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white">3</span> Your details
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <label className="block text-sm font-medium text-ink">
            Your name
            <input value={f.name} onChange={set("name")} autoComplete="name" className={input} required />
          </label>
          <label className="block text-sm font-medium text-ink">
            Phone (WhatsApp)
            <input value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="+91 …" className={input} required />
          </label>
          <label className="block text-sm font-medium text-ink">
            Email
            <input type="email" value={f.email} onChange={set("email")} autoComplete="email" className={input} required />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">AOD replies by email. You&apos;ll need this email and the case number to track the case.</p>
        {/* Honeypot: hidden from people, filled in by bots. */}
        <input value={f.website} onChange={set("website")} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <label className="mt-5 flex items-start gap-3 text-sm text-body">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand" />
          <span>
            These details are true. AOD may share them with the other side of the booking to resolve the case (see the{" "}
            <a href={siteHref("/privacy")} className="text-brand hover:underline">
              privacy policy
            </a>
            ).
          </span>
        </label>
      </fieldset>

      {state.kind === "preview" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p>{resolution.previewNotice}</p>
          <a href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-whatsapp px-5 font-medium text-white hover:bg-whatsapp-hover">
            <WhatsAppIcon className="h-4 w-4" /> Send the case on WhatsApp
          </a>
        </div>
      )}
      {state.kind === "error" && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {state.error}
          </p>
          <a href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-whatsapp px-5 font-medium text-white hover:bg-whatsapp-hover">
            <WhatsAppIcon className="h-4 w-4" /> Send it on WhatsApp instead
          </a>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={missing.length > 0 || state.kind === "saving"}
          className="inline-flex h-12 items-center rounded-lg bg-brand px-7 font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.kind === "saving" ? "Sending…" : "Raise the case"}
        </button>
        {missing.length > 0 && <p className="text-sm text-muted">Still needed: {missing.join(", ")}.</p>}
      </div>
    </form>
  );
}
