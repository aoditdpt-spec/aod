"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { roles, type Role } from "@/content/admin";
import { signIn, useBrowserReady, useSession } from "@/lib/admin-store";
import { fieldClass } from "./ui";

// Staff sign-in: email + password, then a 6-digit code (2-step verification).
// Preview: there are no real accounts yet, so any details work, and you pick the role to see
// what each role can do. Real staff accounts and 2FA come with Supabase Auth.
export function AdminSignIn() {
  const router = useRouter();
  const ready = useBrowserReady();
  const session = useSession();
  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && session) router.replace("/admin/dashboard");
  }, [ready, session, router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-wash p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Image src="/aod-wordmark.png" alt="AOD" width={708} height={200} priority className="h-7 w-auto" />
          <span className="rounded-md bg-night px-2 py-0.5 text-xs font-medium text-white">Admin</span>
        </div>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "password") {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) || password.length < 4) {
                setError("Enter your work email and password.");
                return;
              }
              setError(null);
              setStep("code");
              return;
            }
            if (!/^\d{6}$/.test(code)) {
              setError("Enter the 6-digit code from your authenticator app.");
              return;
            }
            const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            signIn({ name: `${name} (${roles.find((r) => r.id === role)?.label})`, email: email.trim(), role });
            router.replace("/admin/dashboard");
          }}
          className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(40,28,21,0.06)] sm:p-8"
        >
          {step === "password" ? (
            <>
              <h1 className="text-2xl font-medium">Staff sign in</h1>
              <p className="mt-1 text-sm text-muted">For the AOD team only.</p>
              <label className="mt-6 block text-sm font-medium text-ink">
                Work email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" className={`${fieldClass} mt-1.5 py-2.5`} />
              </label>
              <label className="mt-4 block text-sm font-medium text-ink">
                Password
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" className={`${fieldClass} mt-1.5 py-2.5`} />
              </label>
              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-ink">Preview as</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <label key={r.id} className={`cursor-pointer rounded-lg border p-2.5 text-xs ${role === r.id ? "border-brand bg-peach/40" : "border-line hover:border-brand/50"}`}>
                      <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="sr-only" />
                      <span className="block text-sm font-medium text-ink">{r.label}</span>
                      <span className="mt-0.5 block text-muted">{r.text}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-peach text-brand">
                <KeyRound className="h-5 w-5" aria-hidden />
              </span>
              <h1 className="mt-4 text-2xl font-medium">2-step verification</h1>
              <p className="mt-1 text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                aria-label="6-digit code"
                placeholder="••••••"
                className={`${fieldClass} mt-5 py-3 text-center text-xl tracking-[0.5em]`}
              />
            </>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand font-medium text-white hover:bg-brand-hover">
            {step === "password" ? "Continue" : "Verify and sign in"} <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            signIn({ name: "AOD Team (Owner)", email: "owner@example.com", role: "owner" });
            router.replace("/admin/dashboard");
          }}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg border border-line bg-white text-sm font-medium text-ink hover:border-ink"
        >
          Open the admin as Owner (see everything)
        </button>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Preview with sample data: there are no staff accounts yet, so any email, password and code work. Real accounts with 2-step
          verification come with the backend.
        </p>
      </div>
    </div>
  );
}
