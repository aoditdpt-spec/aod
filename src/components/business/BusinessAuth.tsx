"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { businessCopy, companyLinkError, companyLinkLabel, companyLinkOf, companyLinkPlaceholder, companyTypes, type Company } from "@/content/business-portal";
import { cities } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { businessCompanyStore } from "@/lib/business-store";
import { Spinner } from "@/components/ui/Spinner";
import { Field, inputBase, inputClass } from "@/components/artists/form";
import { requestCode, verifyCode } from "@/server/actions/auth";
import { myCompany, registerCompany, type CompanyInput } from "@/server/actions/business";

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const validPhone = (v: string) => {
  const d = v.replace(/\D/g, "");
  return /^(?:91|0)?[6-9]\d{9}$/.test(d) || (d.length >= 8 && d.length <= 15);
};

const empty: CompanyInput = { name: "", type: "", typeOther: "", contactName: "", email: "", phone: "", city: "", website: "", trap: "" };

// Sign in or create a company account. Both use the emailed 6-digit code (live) or any six digits
// (the preview). Creating an account first confirms the email, then saves the company.
export function BusinessAuth({ onSignedIn }: { onSignedIn: (company: Company) => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [form, setForm] = useState<CompanyInput>(empty);
  const set = (patch: Partial<CompanyInput>) => setForm((f) => ({ ...f, ...patch }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"details" | "code">("details");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const email = form.email.trim().toLowerCase();

  function problems(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!validEmail(email)) e.email = "Enter your company email.";
    if (mode === "up") {
      if (form.name.trim().length < 2) e.name = "Enter your company name.";
      if (!form.type) e.type = "Choose what describes your company.";
      else if (form.type === "Other" && (form.typeOther ?? "").trim().length < 2) e.type = "Please specify what kind of company you are.";
      if (form.contactName.trim().length < 2) e.contactName = "Enter the contact person's name.";
      if (!validPhone(form.phone)) e.phone = "Enter a valid phone number.";
      if (!form.city) e.city = "Choose your city.";
      const link = companyLinkOf(form.website);
      if (!link) e.website = link === null ? "Check the link, e.g. yourcompany.in or linkedin.com/company/…" : companyLinkError;
    }
    return e;
  }

  async function sendCode(ev: React.FormEvent) {
    ev.preventDefault();
    const e = problems();
    setErrors(e);
    if (Object.keys(e).length) return;
    setMessage(null);
    if (!backendEnabled) {
      // Preview: no email is sent.
      if (mode === "in" && !businessCompanyStore.get()) {
        setMessage("No company account on this browser yet. Create one first.");
        return;
      }
      setCode("");
      setStep("code");
      return;
    }
    setBusy(true);
    const res = await requestCode(email, mode === "in" ? "business" : "business-new").catch(() => ({ ok: false as const, error: "Couldn't send the code just now. Please try again." }));
    setBusy(false);
    if (!res.ok) return setMessage(res.error);
    setCode("");
    setStep("code");
  }

  async function confirm(ev: React.FormEvent) {
    ev.preventDefault();
    if (!/^\d{6}$/.test(code)) return setMessage("Enter the 6-digit code.");
    setMessage(null);
    if (!backendEnabled) {
      const saved = businessCompanyStore.get();
      if (mode === "in" && saved) return onSignedIn(saved);
      const company: Company = {
        id: "BIZ-PREVIEW",
        name: form.name.trim(),
        type: form.type as Company["type"],
        typeOther: form.type === "Other" ? (form.typeOther ?? "").trim() : "",
        contactName: form.contactName.trim(),
        email,
        phone: form.phone.trim(),
        city: form.city,
        website: companyLinkOf(form.website) ?? "",
      };
      businessCompanyStore.set(company);
      return onSignedIn(company);
    }
    setBusy(true);
    const verified = await verifyCode(email, code).catch(() => ({ ok: false as const, error: "Couldn't check the code just now. Please try again." }));
    if (!verified.ok) {
      setBusy(false);
      return setMessage(verified.error);
    }
    try {
      if (mode === "up") {
        const res = await registerCompany({ ...form, email });
        if (!res.ok) return setMessage(res.error);
        return onSignedIn(res.company);
      }
      const company = await myCompany();
      if (!company) return setMessage("No company is registered with this email. Create an account first.");
      onSignedIn(company);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "in" ? businessCopy.signInTitle : businessCopy.signUpTitle;
  const text = mode === "in" ? businessCopy.signInText : businessCopy.signUpText;

  return (
    <section id="business-account" className="mx-auto w-full max-w-2xl scroll-mt-24 rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_6%,transparent)] sm:p-10">
      <div role="tablist" aria-label="Sign in or create an account" className="inline-flex rounded-xl bg-wash p-1">
        {(
          [
            ["in", "Sign in"],
            ["up", "Create account"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => {
              setMode(id);
              setStep("details");
              setErrors({});
              setMessage(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${mode === id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <h2 className="mt-6 text-2xl font-bold sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
      {!backendEnabled && <p className="mt-3 rounded-lg bg-peach/50 px-3 py-2 text-xs text-ink">Preview: no email is sent. Any 6 digits work, and the account stays in this browser.</p>}

      {step === "details" ? (
        <form noValidate onSubmit={sendCode} className="mt-6 space-y-5">
          {mode === "up" && (
            <>
              <Field label="Company name" error={errors.name}>
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="organization" aria-invalid={!!errors.name} className={inputClass} />
              </Field>
              <div>
                <p className="text-sm font-medium text-ink">We are a…</p>
                <div role="group" aria-label="Account type" className="mt-2 flex flex-wrap gap-2">
                  {companyTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={form.type === t}
                      onClick={() => set({ type: t })}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${form.type === t ? "border-brand bg-peach/50 font-medium text-ink" : "border-line text-body hover:border-brand/50"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {form.type === "Other" && (
                  <input
                    value={form.typeOther ?? ""}
                    onChange={(e) => set({ typeOther: e.target.value.slice(0, 40) })}
                    placeholder="Please specify, e.g. production house"
                    aria-label="Please specify what kind of company you are"
                    aria-invalid={!!errors.type}
                    autoFocus
                    className={`${inputClass} sm:max-w-sm`}
                  />
                )}
                {errors.type && <p className="mt-1.5 text-xs text-red-600">{errors.type}</p>}
              </div>
              <Field label="Contact person" error={errors.contactName}>
                <input value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} autoComplete="name" aria-invalid={!!errors.contactName} className={inputClass} />
              </Field>
            </>
          )}

          <Field label="Company email" error={errors.email} hint={mode === "up" ? "This is how your company signs in." : undefined}>
            <input
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className={inputClass}
            />
          </Field>

          {mode === "up" && (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone (WhatsApp preferred)" error={errors.phone}>
                  <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" autoComplete="tel" aria-invalid={!!errors.phone} className={inputClass} />
                </Field>
                <Field label="City" error={errors.city}>
                  <select value={form.city} onChange={(e) => set({ city: e.target.value })} aria-invalid={!!errors.city} className={inputClass}>
                    <option value="">Choose…</option>
                    {cities.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label={companyLinkLabel} error={errors.website}>
                <input
                  value={form.website}
                  onChange={(e) => set({ website: e.target.value })}
                  inputMode="url"
                  placeholder={companyLinkPlaceholder}
                  autoComplete="url"
                  aria-invalid={!!errors.website}
                  className={inputClass}
                />
              </Field>
              {/* Hidden spam trap: people never see or fill this. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Leave this empty
                  <input tabIndex={-1} autoComplete="off" value={form.trap ?? ""} onChange={(e) => set({ trap: e.target.value })} className={inputBase} />
                </label>
              </div>
            </>
          )}

          {message && (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          )}
          <button type="submit" disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover disabled:cursor-wait">
            {busy ? (
              <>
                <Spinner /> Sending the code…
              </>
            ) : (
              "Email me a code"
            )}
          </button>
        </form>
      ) : (
        <form noValidate onSubmit={confirm} className="mt-6 space-y-5">
          <p className="text-sm text-body">
            {backendEnabled ? "We emailed a 6-digit code to" : "Enter any 6 digits to continue as"} <strong>{email}</strong>.
          </p>
          <Field label="6-digit code">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              className={`${inputClass} max-w-[12rem] tracking-[0.3em]`}
            />
          </Field>
          {message && (
            <p className="text-sm text-red-600" role="alert">
              {message}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover disabled:cursor-wait">
              {busy ? (
                <>
                  <Spinner /> Checking…
                </>
              ) : mode === "up" ? (
                "Create my account"
              ) : (
                "Sign in"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("details");
                setMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Change details
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
