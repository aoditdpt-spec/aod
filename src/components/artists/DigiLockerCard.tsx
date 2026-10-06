"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";
import { identity } from "@/content/artist-portal";
import { Badge } from "./form";

const steps = [
  "You're sent to DigiLocker, the Government of India app.",
  "You sign in with the mobile number linked to your Aadhaar and enter the code it sends.",
  "You approve sharing your verified name, date of birth and photo with AOD, then come back here.",
];

// Identity check through DigiLocker (via a KYC provider), never an Aadhaar upload.
// In the preview DigiLocker isn't connected, so the button only explains the steps.
export function DigiLockerCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-wash/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-ink">{identity.title}</p>
            <p className="mt-1 max-w-xl text-sm text-body">{identity.text}</p>
          </div>
        </div>
        <Badge tone="wait">Not verified</Badge>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-white p-3 text-sm text-ink">
        <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        {identity.never}
      </p>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden /> Verify with DigiLocker
      </button>

      {open && (
        <div className="mt-4 rounded-lg border border-line bg-white p-4" role="status">
          <p className="text-sm font-medium text-ink">How it will work</p>
          <ol className="mt-2 space-y-2 text-sm text-body">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-peach text-xs font-medium text-brand-hover">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted">
            Preview: DigiLocker isn&apos;t connected yet, so nothing happens and your status stays &ldquo;Not verified&rdquo;. You can
            also verify after your in-person meeting.
          </p>
        </div>
      )}
    </div>
  );
}
