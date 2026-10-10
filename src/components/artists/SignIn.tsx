"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Smartphone } from "lucide-react";
import { useState } from "react";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { backendEnabled } from "@/lib/backend";
import { reloadPortal, usePortalState } from "@/lib/artist-live";
import { requestCode, verifyCode } from "@/server/actions/auth";
import { Field, inputBase, inputClass } from "./form";

type Method = "phone" | "email";

const validPhone = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""));
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

// One-time-code sign-in. Live: a code emailed to the address the artist applied with (only
// emails AOD knows, as an artist or an applicant). Preview: by WhatsApp or email, but no code is
// sent and any 6 digits open the dashboard.
export function SignIn() {
  return backendEnabled ? <LiveSignIn /> : <PreviewSignIn />;
}

function LiveSignIn() {
  const router = useRouter();
  const portal = usePortalState();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (portal.status === "ready" && portal.data) {
    return (
      <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(40,28,21,0.06)] sm:p-8">
        <h2 className="text-2xl font-normal">Welcome back</h2>
        <p className="mt-2 text-sm text-body">Signed in as {portal.data.email}.</p>
        <Link href="/artists/dashboard" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-medium text-white hover:bg-brand-hover">
          Open your portal <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(40,28,21,0.06)] sm:p-8">
      <h2 className="text-2xl font-normal">Sign in</h2>
      <form
        noValidate
        className="mt-6 space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setError(null);
          setBusy(true);
          if (!sent) {
            const res = await requestCode(email, "artist");
            setBusy(false);
            if (res.ok) setSent(true);
            else setError(res.error);
            return;
          }
          const res = await verifyCode(email, code);
          if (!res.ok) {
            setBusy(false);
            setError(res.error);
            return;
          }
          await reloadPortal();
          router.push("/artists/dashboard");
        }}
      >
        <Field label="Email address" error={!sent ? error : null} hint={!sent ? "The email you applied with." : undefined}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!sent && !!error}
            className={`${inputClass} disabled:bg-wash`}
          />
        </Field>
        {sent && (
          <Field
            label="6-digit code"
            error={error}
            hint={
              <>
                Sent to {email}. Check spam if it isn&apos;t there in a minute.{" "}
                <button type="button" onClick={() => (setSent(false), setCode(""))} className="font-medium text-brand underline underline-offset-2">
                  Change
                </button>
              </>
            }
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              autoFocus
              aria-invalid={!!error}
              className={`${inputClass} text-center text-xl tracking-[0.5em]`}
            />
          </Field>
        )}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-medium text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? "Please wait…" : sent ? (
            <>
              Verify and sign in <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" aria-hidden /> Send code by email
            </>
          )}
        </button>
      </form>
      <p className="mt-6 border-t border-line pt-5 text-sm text-body">
        New to AOD?{" "}
        <Link href="/artists/apply" className="font-medium text-brand underline underline-offset-4 hover:text-brand-hover">
          Apply to join
        </Link>
      </p>
    </div>
  );
}

function PreviewSignIn() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("phone");
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function send() {
    const ok = method === "phone" ? validPhone(contact) : validEmail(contact);
    if (!ok) {
      setError(method === "phone" ? "Enter a 10-digit Indian mobile number." : "Enter a valid email address.");
      return;
    }
    setError(null);
    setSent(true);
  }

  function verify() {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    router.push("/artists/dashboard");
  }

  return (
    <div className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(40,28,21,0.06)] sm:p-8">
      <h2 className="text-2xl font-normal">Sign in</h2>

      <div role="tablist" aria-label="Sign in with" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-wash p-1">
        {(
          [
            ["phone", "Phone", Smartphone],
            ["email", "Email", Mail],
          ] as const
        ).map(([value, label, I]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={method === value}
            onClick={() => {
              setMethod(value);
              setContact("");
              setSent(false);
              setCode("");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              method === value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
            }`}
          >
            <I className="h-4 w-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (sent) verify();
          else send();
        }}
      >
        {method === "phone" ? (
          <Field label="Mobile number" error={!sent ? error : null} hint="The number you use on WhatsApp.">
            <div className="mt-1.5 flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-wash px-3 text-sm text-muted">+91</span>
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={sent}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98250 12345"
                aria-invalid={!sent && !!error}
                className={`${inputBase} rounded-l-none disabled:bg-wash`}
              />
            </div>
          </Field>
        ) : (
          <Field label="Email address" error={!sent ? error : null}>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={sent}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!sent && !!error}
              className={`${inputClass} disabled:bg-wash`}
            />
          </Field>
        )}

        {sent && (
          <Field
            label="6-digit code"
            error={error}
            hint={
              <>
                {method === "phone" ? "Sent on WhatsApp to +91 " : "Sent to "}
                {contact}.{" "}
                <button type="button" onClick={() => setSent(false)} className="font-medium text-brand underline underline-offset-2">
                  Change
                </button>
              </>
            }
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              autoFocus
              aria-invalid={!!error}
              className={`${inputClass} text-center text-xl tracking-[0.5em]`}
            />
          </Field>
        )}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-medium text-white hover:bg-brand-hover"
        >
          {sent ? (
            <>
              Verify and sign in <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          ) : method === "phone" ? (
            <>
              <WhatsAppIcon className="h-4 w-4" /> Send code on WhatsApp
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" aria-hidden /> Send code by email
            </>
          )}
        </button>

        {sent && (
          <p className="rounded-lg bg-wash p-3 text-xs text-muted" role="status">
            Preview: no code is actually sent. Enter any 6 digits to open the dashboard.
          </p>
        )}
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-body">
        New to AOD?{" "}
        <Link href="/artists/apply" className="font-medium text-brand underline underline-offset-4 hover:text-brand-hover">
          Apply to join
        </Link>
      </p>
    </div>
  );
}
