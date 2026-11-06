"use client";

import { BellRing, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { usePush } from "./usePush";

// The "Allow notifications?" card that appears a few seconds after the app opens, like a phone
// app's first-run permission. The browser's own permission box only opens when this card's Allow
// is tapped (phones require a tap). "Not now" hides it for a week; once allowed or blocked it
// never appears again. Shown to signed-in artists (approved) and to the team.
const KEY = "aod-push-prompt-until";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const DELAY = 3500;

const snoozed = () => {
  try {
    return Number(localStorage.getItem(KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
};

export function PushPrompt({ as, enabled = true }: { as: "staff" | "artist"; enabled?: boolean }) {
  const { phase, busy, turnOn } = usePush(as);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || (phase !== "off" && phase !== "install") || snoozed()) return;
    const t = setTimeout(() => setOpen(true), DELAY);
    return () => clearTimeout(t);
  }, [enabled, phase]);

  if (!open || (phase !== "off" && phase !== "install")) return null;
  // iPhones and iPads only allow notifications for a site added to the Home Screen (iOS 16.4+),
  // never in a Safari or Chrome tab, so there the card explains how.
  const install = phase === "install";

  const later = () => {
    try {
      localStorage.setItem(KEY, String(Date.now() + WEEK));
    } catch {}
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Allow notifications" className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-96">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach text-brand">
            <BellRing className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">{install ? "Get notifications on your iPhone" : "Allow notifications?"}</p>
            {install ? (
              <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-sm text-muted">
                <li>
                  In Safari, tap the <strong className="font-medium text-ink">Share</strong> button.
                </li>
                <li>
                  Tap <strong className="font-medium text-ink">Add to Home Screen</strong>.
                </li>
                <li>Open AOD from your Home Screen and tap Allow.</li>
              </ol>
            ) : (
              <p className="mt-0.5 text-sm text-muted">
                {as === "artist" ? "Get a banner on this device when the AOD team messages you." : "Get a banner on this device when an artist messages the team."}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2">
              {install ? (
                <button type="button" onClick={later} className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover">
                  Got it
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void turnOn().then(() => setOpen(false))}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60"
                  >
                    {busy && <Spinner />} Allow
                  </button>
                  <button type="button" onClick={later} className="h-9 rounded-lg px-3 text-sm font-medium text-muted hover:text-ink">
                    Not now
                  </button>
                </>
              )}
            </div>
          </div>
          <button type="button" onClick={later} aria-label="Close" className="-mr-1 -mt-1 rounded-lg p-1 text-muted hover:bg-wash hover:text-ink">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
