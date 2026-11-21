"use client";

import Link from "@/components/ui/AppLink";
import { useState, useSyncExternalStore } from "react";
import { caseForm as f, type Side } from "@/data/dispute-form";
import { disputePage } from "@/data/pages";
import { act } from "@/lib/app-db";
import { backendEnabled } from "@/lib/backend";
import { createCase } from "@/server/actions/resolution";
import { Dots } from "@/components/ui/Dots";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";

// Raise a dispute, as on aod.co.in: which side you're on, what it's about, whether it was booked
// through AOD (then its number) or not (then who it's with and how to reach them), what happened,
// what would settle it, evidence links and your details. "?ref=AOD-…" (My Bookings) fills in the
// booking number; "?role=artist|customer|business" picks the side and "?aod=yes|no" answers "Was It
// Booked Through AOD?" (the Dispute Desk page's buttons, as on aod.co.in). Live: saved as a case
// (DC-1001…, createCase in src/server/actions/resolution.ts, which checks every field) and emailed
// to the team and the person. Test mode: nothing is required, and the case is kept in this browser,
// where the admin's Dispute Desk shows it.

const input = "h-12 w-full rounded-lg border border-line bg-paper px-4 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";
const label = "mb-2 block text-sm text-muted";
const chip = (on: boolean) => `min-h-12 rounded-lg border px-4 py-2.5 text-left text-[15px] transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`;

const noop = () => () => {};
function useParam(name: string) {
  return useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get(name) ?? "", () => "");
}

export function CaseForm() {
  const ref = useParam("ref");
  const roleParam = useParam("role");
  const aodParam = useParam("aod");
  const [sideState, setSide] = useState<Side | "" | null>(null);
  const side: Side | "" = sideState ?? (["artist", "customer", "business"].includes(roleParam) ? (roleParam as Side) : "");
  const [about, setAbout] = useState("");
  const [through, setThrough] = useState<boolean | null>(null);
  const [booking, setBooking] = useState<string | null>(null);
  const [other, setOther] = useState({ who: "", contact: "" });
  const [details, setDetails] = useState("");
  const [outcome, setOutcome] = useState("");
  const [evidence, setEvidence] = useState("");
  const [me, setMe] = useState({ name: "", email: "", phone: "" });
  const [agree, setAgree] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // the hidden spam-trap field

  const bookingRef = booking ?? ref;
  const isThrough = through ?? (ref || aodParam === "yes" ? true : aodParam === "no" ? false : null);
  const issues = side ? (disputePage.roles[["artist", "customer", "business"].indexOf(side)]?.issues ?? []) : [];
  const outcomes = side ? (isThrough === false ? f.outcomesOutside : f.outcomes)[side] : [];

  if (sent)
    return (
      <div className="max-w-3xl" role="status">
        <h2 className="text-4xl sm:text-5xl">
          <Dots>Dispute Raised.</Dots>
        </h2>
        <p className="mt-6 text-2xl font-medium tabular-nums">
          <span className="text-muted">Case</span> {sent}
        </p>
        <p className="mt-4 text-lg text-muted">The Dispute Desk replies within 48 hours. Keep your case number to track it.</p>
        <div className="mt-10 flex flex-wrap gap-3 max-sm:*:flex-1">
          <Link href={`/resolve/track?case=${sent}`} className={primaryButton}>
            Track This Dispute
          </Link>
        </div>
        {backendEnabled ? (
          <p className="mt-6 text-sm text-muted">We&apos;ve emailed you a copy. To add photos or chats, reply to that email.</p>
        ) : (
          <p className="mt-6 text-sm text-muted">Test mode: kept in this browser only. The admin&apos;s Dispute Desk shows it.</p>
        )}
      </div>
    );

  return (
    <form
      className="max-w-3xl space-y-10"
      onSubmit={async (e) => {
        e.preventDefault();
        if (backendEnabled) {
          if (busy) return;
          setBusy(true);
          setError(null);
          const res = await createCase({
            role: side || "customer",
            issue: about,
            throughAod: isThrough !== false,
            bookingRef: bookingRef.trim(),
            otherParty: [other.who.trim(), other.contact.trim()].filter(Boolean).join(" · "),
            incidentDate: "",
            description: details.trim(),
            outcome,
            evidence: evidence.trim() ? [evidence.trim()] : [],
            name: me.name.trim(),
            phone: me.phone.trim(),
            email: me.email.trim().toLowerCase(),
            agree,
            website,
          }).catch(() => ({ ok: false as const, error: "Couldn't send your case just now. Please try again in a minute." }));
          setBusy(false);
          if (!res.ok) {
            if (!side) return setError("Choose which side you're on.");
            if (isThrough === null) return setError("Say whether it was booked through AOD.");
            return setError(res.error);
          }
          setSent(res.id);
          window.scrollTo({ top: 0 });
          return;
        }
        const id = act.raiseCase({
          role: side === "artist" ? "Artist" : side === "business" ? "Business" : "Customer",
          name: me.name.trim() || "Someone",
          about: about || "Something Else",
          booking: isThrough === false ? "Booked outside AOD" : bookingRef.trim() || "Not given",
          outside: isThrough === false,
          otherParty: isThrough === false ? [other.who, other.contact].filter(Boolean).join(", ") : undefined,
          email: me.email.trim().toLowerCase(),
          details: [details.trim(), evidence.trim() && `Evidence: ${evidence.trim()}`, me.phone.trim() && `Phone: ${me.phone.trim()}`].filter(Boolean).join("\n\n"),
          outcome,
        });
        setSent(id);
        window.scrollTo({ top: 0 });
      }}
    >
      <Field title="Which Side Are You On?">
        <div className="grid gap-2 sm:grid-cols-3">
          {f.sides.map((s) => (
            <button key={s.id} type="button" aria-pressed={side === s.id} onClick={() => (setSide(s.id), setAbout(""), setOutcome(""))} className={chip(side === s.id)}>
              <span className="block font-medium">{s.label}</span>
              <span className={`mt-1 block text-sm ${side === s.id ? "text-paper/70" : "text-muted"}`}>{s.hint}</span>
            </button>
          ))}
        </div>
      </Field>

      {side && (
        <Field title="What Is It About?">
          <div className="flex flex-wrap gap-2">
            {[...issues, "Something Else"].map((i) => (
              <button key={i} type="button" aria-pressed={about === i} onClick={() => setAbout(i)} className={chip(about === i)}>
                {i}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field title={f.throughAod.question}>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" aria-pressed={isThrough === true} onClick={() => setThrough(true)} className={chip(isThrough === true)}>
            {f.throughAod.yes}
          </button>
          <button type="button" aria-pressed={isThrough === false} onClick={() => setThrough(false)} className={chip(isThrough === false)}>
            {f.throughAod.no}
          </button>
        </div>
        {isThrough === true && (
          <label className="mt-6 block">
            <span className={label}>AOD Booking Or Request Number</span>
            <input value={bookingRef} onChange={(e) => setBooking(e.target.value)} placeholder="AOD-PH-261001" className={input} />
            <span className="mt-2 block text-sm text-muted">{f.bookingRefHint}</span>
          </label>
        )}
        {isThrough === false && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Who Is The Dispute With?</span>
              <input value={other.who} onChange={(e) => setOther({ ...other, who: e.target.value })} className={input} />
            </label>
            <label className="block">
              <span className={label}>How Can AOD Reach Them?</span>
              <input value={other.contact} onChange={(e) => setOther({ ...other, contact: e.target.value })} placeholder="Phone or email" className={input} />
            </label>
            <p className="text-sm text-muted sm:col-span-2">{f.otherPartyHint}</p>
          </div>
        )}
      </Field>

      <Field title="What Happened?">
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={5} placeholder="What was agreed, what the other side did or didn't do, and when." aria-label="What happened" className={`${input} h-auto py-3`} />
      </Field>

      {side && (
        <Field title="What Would Settle It?">
          <div className="flex flex-wrap gap-2">
            {outcomes.map((o) => (
              <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(o)} className={chip(outcome === o)}>
                {o}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field title="Evidence (Optional)">
        <input value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="drive.google.com/…" aria-label="Evidence links" className={input} />
        <span className="mt-2 block text-sm text-muted">{f.evidenceHint}</span>
      </Field>

      <Field title="Your Details">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <label>
            <span className={label}>Your Name</span>
            <input value={me.name} onChange={(e) => setMe({ ...me, name: e.target.value })} autoComplete="name" className={input} />
          </label>
          <label>
            <span className={label}>Phone Number</span>
            <input value={me.phone} onChange={(e) => setMe({ ...me, phone: e.target.value })} inputMode="tel" autoComplete="tel" className={input} />
          </label>
          <label className="col-span-2">
            <span className={label}>Email</span>
            <input value={me.email} onChange={(e) => setMe({ ...me, email: e.target.value })} type="email" autoComplete="email" className={input} />
          </label>
        </div>
      </Field>

      <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-line p-5 has-[:checked]:border-ink">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--ink)]" />
        <span>What I&apos;ve written is true, and AOD may contact the other side about this dispute.</span>
      </label>

      <div className="flex flex-wrap gap-3 max-sm:*:flex-1">
        <Link href="/resolve" className={secondaryButton}>
          Back
        </Link>
        <button disabled={busy} className={`${primaryButton} disabled:opacity-50`}>
          {busy ? "Sending…" : "Raise Dispute"}
        </button>
      </div>
      {/* The spam trap: hidden, so autofill and people never reach it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input tabIndex={-1} autoComplete="off" name="aod-hp" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {!backendEnabled && <p className="text-sm text-muted">Test mode: nothing is required, and the case stays in this browser.</p>}
    </form>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="mb-5 text-2xl">{title}</h2>
      {children}
    </section>
  );
}
