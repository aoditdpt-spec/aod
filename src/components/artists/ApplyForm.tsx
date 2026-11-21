"use client";

import Link from "@/components/ui/AppLink";
import { portalLive } from "@/lib/app-db";
import { experienceLevels } from "@/data/work-questions";
import { createApplication } from "@/server/actions/public";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { categories, cities } from "@/data/site";
import { APPS, type SentApplication } from "@/lib/app-db";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { setPortalEmail } from "@/lib/portal-session";
import { backendEnabled } from "@/lib/backend";
import { requestCode, verifyCode } from "@/server/actions/auth";
import { Dots } from "@/components/ui/Dots";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";

// Joining AOD as an artist, in two steps (on request, 2026-11-19: "that easy"):
//   1  name, phone and email, then a 6-digit code emailed to them (Send OTP), confirmed to go on
//   2  location, category (and which kind), experience and a portfolio link
// That creates the profile. Everything else (photo, date of birth, languages, the category's own
// work questions, about, the declaration) is asked later, in the artist portal under Profile →
// Complete Your Details. Joining is only through here (no WhatsApp). The answers so far are kept as
// a draft in this browser; a draft from an earlier visit says whose it is, with "Not You? Start
// Again". Live: the email is confirmed with the emailed code (which signs them in), and Create
// Profile saves the application (createApplication in src/server/actions/public.ts) with every
// field required, both links included; then Complete Your Details opens in the portal. Test mode
// (no Supabase keys): nothing is required, and the profile is kept in this browser
// (localStorage `aod-mock-applications`), where the admin's Applications page shows it.

const steps = ["Your Name And Contact", "Your Work"];
const experience = experienceLevels;
const DRAFT = "aod-apply-draft";

const blank = { name: "", phone: "", email: "", city: "", cat: "", kind: "", experience: "", instagram: "", link: "" };
type Form = typeof blank;

const input = "h-12 w-full rounded-lg border border-line bg-paper px-4 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";
const fieldLabel = "mb-2 block text-sm text-muted";
const chip = (on: boolean) => `min-h-11 rounded-lg border px-4 py-2 text-left text-[15px] transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"}`;

export function ApplyForm() {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState<Form>(blank);
  const [sent, setSent] = useState<string | null>(null);
  const [fromDraft, setFromDraft] = useState("");
  // The email check after step 1: the email a code was sent to, the code, and the email confirmed.
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "code" | "verify" | "save">(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [website, setWebsite] = useState(""); // the hidden spam-trap field
  const codeBox = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);
  const top = useRef<HTMLDivElement>(null);
  const LAST = steps.length - 1;
  const cat = categories.find((c) => c.slug === f.cat);

  // The draft from an earlier visit, read once in the browser.
  useEffect(() => {
    let draft: { f: Form; step: number } | null = null;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT) ?? "null");
    } catch {}
    void Promise.resolve().then(() => {
      loaded.current = true;
      if (!draft?.f) return;
      setF({ ...blank, ...draft.f });
      // Back at step 1: the email is confirmed again before going on.
      setFromDraft(draft.f.name || "Someone");
    });
  }, []);
  useEffect(() => {
    if (!loaded.current || sent) return;
    try {
      localStorage.setItem(DRAFT, JSON.stringify({ f, step }));
    } catch {}
  }, [f, step, sent]);

  const go = (n: number) => {
    setDir(n > step ? 1 : -1);
    setStep(Math.max(0, Math.min(LAST, n)));
    if (top.current && top.current.getBoundingClientRect().top < 64) top.current.scrollIntoView({ block: "start" });
  };
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const startFresh = () => {
    try {
      localStorage.removeItem(DRAFT);
    } catch {}
    setF(blank);
    setStep(0);
    setFromDraft("");
  };

  const email = f.email.trim().toLowerCase();
  const confirmed = verified === email;
  const codeSent = !confirmed && codeFor === email;

  async function sendCode() {
    setBusy("code");
    setCodeError(null);
    setCode("");
    const res = backendEnabled
      ? await requestCode(email).catch(() => ({ ok: false as const, error: "Couldn't send the code just now. Please try again in a minute." }))
      : await new Promise<{ ok: true }>((done) => window.setTimeout(() => done({ ok: true }), 500));
    setBusy(null);
    if (!res.ok) return setCodeError(res.error);
    setCodeFor(email);
    window.setTimeout(() => codeBox.current?.focus(), 0);
  }

  // Step 1's button: Send OTP, then Verify And Continue (any code, or none, in test mode).
  async function confirmEmail() {
    if (confirmed) return go(1);
    if (!codeSent) return sendCode();
    if (backendEnabled) {
      if (!/^\d{6}$/.test(code)) return codeBox.current?.focus();
      setBusy("verify");
      setCodeError(null);
      const res = await verifyCode(email, code).catch(() => ({ ok: false as const, error: "Couldn't check the code just now. Please try again." }));
      setBusy(null);
      if (!res.ok) return setCodeError(res.error);
    }
    setVerified(email);
    go(1);
  }

  async function create() {
    if (backendEnabled) {
      setBusy("save");
      setSaveError(null);
      const res = await createApplication({ name: f.name, phone: f.phone, email, city: f.city, category: f.cat, kind: f.kind, experience: f.experience, instagram: f.instagram, link: f.link, website }).catch(() => ({
        ok: false as const,
        error: "Couldn't create your profile just now. Please try again in a minute.",
        verify: false,
      }));
      setBusy(null);
      if (!res.ok) {
        if ("verify" in res && res.verify) {
          setVerified(null);
          setCodeFor(null);
          go(0);
        }
        return setSaveError(res.error);
      }
      try {
        localStorage.removeItem(DRAFT);
      } catch {}
      void portalLive.reloadPortal();
      setSent(res.id);
      top.current?.scrollIntoView({ block: "start" });
      return;
    }
    let list: SentApplication[] = [];
    try {
      list = JSON.parse(localStorage.getItem(APPS) ?? "[]") as SentApplication[];
    } catch {}
    const id = `APP-${239 + list.length}`;
    const app: SentApplication = {
      id,
      name: f.name.trim(),
      email,
      phone: f.phone.trim(),
      city: f.city,
      cat: f.cat,
      craft: f.kind || (cat?.types.length === 1 ? cat.types[0] : cat?.name) || "",
      experience: f.experience,
      instagram: f.instagram.trim(),
      link: f.link.trim(),
      at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(APPS, JSON.stringify([...list, app]));
      localStorage.removeItem(DRAFT);
    } catch {}
    window.dispatchEvent(new Event(APPS));
    setPortalEmail(email || `${id.toLowerCase()}@example.com`); // signed in to the portal, to complete the profile
    setSent(id);
    top.current?.scrollIntoView({ block: "start" });
  }

  if (sent)
    return (
      <div ref={top} className="max-w-3xl scroll-mt-24" role="status">
        <h2 className="text-4xl sm:text-5xl">
          <Dots>Profile Created.</Dots>
        </h2>
        <p className="mt-6 text-2xl font-medium tabular-nums">
          <span className="text-muted">Ref</span> {sent}
        </p>
        <p className="mt-4 max-w-xl text-lg text-muted">Next, complete your details in the artist portal: your photo, what kind of artist you are, the services you offer and a few questions about your work, then send it for review.</p>
        <div className="mt-10 flex flex-wrap gap-3 max-sm:*:flex-1">
          <Link href="/artists/profile" className={primaryButton}>
            Complete Your Details
          </Link>
        </div>
      </div>
    );

  const linkCheck = f.link.trim() ? checkPortfolioLink(f.link) : null;

  return (
    <div ref={top} className="max-w-3xl scroll-mt-24">
      {fromDraft && (
        <p className="mb-6 text-muted">
          Continuing {fromDraft}&apos;s profile.{" "}
          <button type="button" onClick={startFresh} className="font-medium text-ink underline underline-offset-4">
            Not You? Start Again
          </button>
        </p>
      )}
      <div className="border-t border-ink pt-5">
        <p className="text-sm text-muted">
          Step {step + 1} Of {steps.length}
        </p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <i key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-ink" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <form
        className="mt-12"
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          if (step === LAST) void create();
          else void confirmEmail();
        }}
      >
        <div className="overflow-x-clip">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: 48 * dir }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 * dir }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-4xl sm:text-5xl">{steps[step]}</h2>
              <div className="mt-10 space-y-7">
                {step === 0 && (
                  <>
                    <label className="block">
                      <span className={fieldLabel}>Full Name</span>
                      <input value={f.name} onChange={set("name")} autoComplete="name" className={input} />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Phone Number</span>
                      <input value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" className={input} />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Email</span>
                      <input value={f.email} onChange={set("email")} type="email" autoComplete="email" className={input} />
                    </label>
                    {codeSent && (
                      <div className="rounded-xl bg-wash p-5 sm:p-6">
                        <p className="text-xl font-medium">Enter The OTP</p>
                        <p className="mt-1 text-muted">
                          We&apos;ve sent a 6-digit code to <span className="text-ink">{email || "your email"}</span>
                        </p>
                        <input
                          ref={codeBox}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          aria-label="6-digit code"
                          className={`${input} mt-4 max-w-56 text-xl tracking-[0.3em] tabular-nums`}
                        />
                        <button type="button" onClick={() => void sendCode()} disabled={Boolean(busy)} className="mt-3 text-sm font-medium underline underline-offset-4 hover:text-brand disabled:opacity-40">
                          Send A New Code
                        </button>
                      </div>
                    )}
                    {confirmed && <p className="text-sm text-muted">Email confirmed.</p>}
                    {codeError && (
                      <p role="alert" className="text-red-600">
                        {codeError}
                      </p>
                    )}
                  </>
                )}

                {step === 1 && (
                  <>
                    <label className="block">
                      <span className={fieldLabel}>Location</span>
                      <select value={f.city} onChange={set("city")} className={input}>
                        <option value="">Choose Your City</option>
                        {cities.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <div>
                      <span className={fieldLabel}>Category</span>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {categories.map((c) => (
                          <button key={c.slug} type="button" aria-pressed={f.cat === c.slug} onClick={() => setF({ ...f, cat: c.slug, kind: "" })} className={`${chip(f.cat === c.slug)} min-h-14`}>
                            {c.name}
                          </button>
                        ))}
                      </div>
                      {cat && cat.types.length > 1 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cat.types.map((t) => (
                            <button key={t} type="button" aria-pressed={f.kind === t} onClick={() => setF({ ...f, kind: t })} className={chip(f.kind === t)}>
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={fieldLabel}>Experience</span>
                      <div className="flex flex-wrap gap-2">
                        {experience.map((x) => (
                          <button key={x} type="button" aria-pressed={f.experience === x} onClick={() => setF({ ...f, experience: x })} className={chip(f.experience === x)}>
                            {x}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className={fieldLabel}>Portfolio</span>
                      <span className="flex h-12 items-center rounded-lg border border-line focus-within:border-ink">
                        <span className="pl-4 text-muted">instagram.com/</span>
                        <input value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value.replace(/^@/, "") })} placeholder="yourname" aria-label="Instagram username" className="h-full min-w-0 flex-1 bg-transparent pr-4 outline-none" />
                      </span>
                      {/* Both the Instagram username and the portfolio link will be required once the
                          backend is connected (on request, 2026-11-21; as aod.co.in's both-links
                          rule, hasBothLinks()). Test mode: both can stay empty. */}
                      <input value={f.link} onChange={set("link")} inputMode="url" placeholder="Portfolio link" aria-label="Portfolio link" className={`${input} mt-3`} />
                      {/* Checked as they type (src/lib/portfolio-links.ts, from aod.co.in); a note, not a block, in test mode. */}
                      {linkCheck && <span className={`mt-2 block text-sm ${linkCheck.ok ? "text-muted" : "text-red-600"}`}>{linkCheck.ok ? (linkCheck.warning ?? `Looks good: ${linkCheck.label}.`) : linkCheck.message}</span>}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-12 flex flex-wrap gap-3 max-sm:*:flex-1">
          {step > 0 && (
            <button type="button" onClick={() => go(step - 1)} className={secondaryButton}>
              Back
            </button>
          )}
          <button disabled={Boolean(busy)} className={`${primaryButton} disabled:opacity-50`}>
            {step === LAST ? (busy === "save" ? "Creating…" : "Create Profile") : busy === "code" ? "Sending…" : busy === "verify" ? "Checking…" : confirmed ? "Next" : codeSent ? "Verify And Continue" : "Send OTP"}
          </button>
        </div>
        {/* The spam trap: hidden, so autofill and people never reach it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <input tabIndex={-1} autoComplete="off" name="aod-hp" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        {saveError && (
          <p role="alert" className="mt-4 text-red-600">
            {saveError}
          </p>
        )}
      </form>
    </div>
  );
}
