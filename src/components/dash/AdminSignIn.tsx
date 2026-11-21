"use client";

import Image from "next/image";
import { MainSiteLink } from "@/components/ui/MainSiteLink";
import { useState, useSyncExternalStore } from "react";
import { backendEnabled } from "@/lib/backend";
import { adminSignOut, reloadAdmin, useAdminReady, useAdminSessionLive } from "@/lib/app-db";
import { requestCode, verifyCode } from "@/server/actions/auth";
import { btn, btnMain, field, label } from "./ui";

// The admin's sign-in, as on aod.co.in: a work email listed in Team And Roles, then a 6-digit code.
// Live: the code is emailed (only to an email on the team) and the session is the server's.
// Preview (no Supabase keys): no email is sent, any code works, and the session is kept in this
// browser (localStorage `aod-admin-session`) until Sign Out.

const KEY = "aod-admin-session";
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
export function setAdminSession(email: string) {
  if (backendEnabled) {
    if (!email) adminSignOut();
    return;
  }
  try {
    if (email) localStorage.setItem(KEY, email);
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
// The signed-in email; "" when signed out; null on the server and while hydrating (or loading).
export function useAdminSession(): string | null {
  const local = useSyncExternalStore(subscribe, read, () => null);
  const live = useAdminSessionLive();
  const ready = useAdminReady();
  if (!backendEnabled) return local;
  if (!ready) return null;
  return live?.email ?? "";
}

export function AdminSignIn() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-sm">
      <div className="w-full max-w-sm">
        <Image src="/aod-wordmark-sm.png" alt="AOD." width={78} height={22} priority unoptimized className="h-[22px] w-auto" />
        <h1 className="mt-8 text-[28px]">Team Sign In</h1>
        <p className="mt-2 text-muted">Your work email, listed in Team And Roles.</p>
        {step === "email" ? (
          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setError(null);
              if (backendEnabled) {
                setBusy(true);
                const res = await requestCode(email, "staff").catch(() => ({ ok: false as const, error: "Couldn't send the code just now. Please try again in a minute." }));
                setBusy(false);
                if (!res.ok) return setError(res.error);
              }
              setStep("code");
            }}
          >
            <label className="block">
              <span className={label}>Work Email</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@aod.co.in" className={field} />
            </label>
            <button disabled={busy} className={`${btnMain} w-full disabled:opacity-50`}>
              {busy ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              if (!backendEnabled) return setAdminSession(email.trim().toLowerCase() || "aditi@example.com");
              setBusy(true);
              setError(null);
              const res = await verifyCode(email, code).catch(() => ({ ok: false as const, error: "Couldn't check the code just now. Please try again." }));
              if (!res.ok) {
                setBusy(false);
                return setError(res.error);
              }
              await reloadAdmin();
              setBusy(false);
            }}
          >
            <p className="text-muted">
              We&apos;ve sent a 6-digit code to <span className="text-ink">{email}</span>
            </p>
            <label className="block">
              <span className={label}>Enter The OTP</span>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className={`${field} tracking-[0.3em]`} />
            </label>
            <div className="flex gap-2 *:flex-1">
              <button type="button" onClick={() => setStep("email")} className={btn}>
                Back
              </button>
              <button disabled={busy || (backendEnabled && code.length !== 6)} className={`${btnMain} disabled:opacity-50`}>
                {busy ? "Checking…" : "Sign In"}
              </button>
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-4 text-red-600">
            {error}
          </p>
        )}
        <MainSiteLink className="mt-10" />
      </div>
    </div>
  );
}
