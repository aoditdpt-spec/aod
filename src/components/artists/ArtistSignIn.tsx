"use client";

import { useState } from "react";
import Link, { useAppRouter } from "@/components/ui/AppLink";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { portalLive } from "@/lib/app-db";
import { backendEnabled } from "@/lib/backend";
import { setPortalEmail } from "@/lib/portal-session";
import { requestCode, verifyCode } from "@/server/actions/auth";

// Artist portal sign-in, as on aod.co.in: the email AOD knows them by, then a 6-digit code. Live:
// the code is emailed only to an email AOD has as an artist or applicant. Preview: no email is sent
// and any code (or none) opens the portal: an applicant's email shows their application's
// progress; any other email opens the sample artist.
const input = "h-12 w-full rounded-lg border border-line bg-paper px-4 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

export function ArtistSignIn() {
  const router = useAppRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-md border-t border-ink pt-10">
      {step === "email" ? (
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setError(null);
            if (backendEnabled) {
              setBusy(true);
              const res = await requestCode(email, "artist").catch(() => ({ ok: false as const, error: "Couldn't send the code just now. Please try again in a minute." }));
              setBusy(false);
              if (!res.ok) return setError(res.error);
            }
            setStep("code");
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm text-muted">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className={input} />
          </label>
          <button disabled={busy} className={`${primaryButton} w-full disabled:opacity-50`}>
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (!backendEnabled) {
              setPortalEmail(email);
              return router.push("/artists/dashboard");
            }
            setBusy(true);
            setError(null);
            const res = await verifyCode(email, code).catch(() => ({ ok: false as const, error: "Couldn't check the code just now. Please try again." }));
            if (!res.ok) {
              setBusy(false);
              return setError(res.error);
            }
            await portalLive.reloadPortal();
            router.push("/artists/dashboard");
          }}
        >
          <p className="text-muted">
            We&apos;ve sent a 6-digit code to <span className="text-ink">{email}</span>
          </p>
          <label className="block">
            <span className="mb-2 block text-sm text-muted">Enter The OTP</span>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className={`${input} max-w-48 tracking-[0.3em]`} />
          </label>
          {!backendEnabled && <p className="text-sm text-muted">Test mode: no email is sent. Any code works, or none.</p>}
          <div className="flex flex-wrap gap-3 max-sm:*:flex-1">
            <button type="button" onClick={() => setStep("email")} className={secondaryButton}>
              Back
            </button>
            <button disabled={busy || (backendEnabled && code.length !== 6)} className={`${primaryButton} disabled:opacity-50`}>
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
      <p className="mt-10 text-muted">
        New To AOD?{" "}
        <Link href="/artists/apply" className="font-medium text-ink underline underline-offset-4">
          Apply To Join
        </Link>
      </p>
    </div>
  );
}
