"use client";

import { useState, useSyncExternalStore } from "react";
import { backendEnabled } from "@/lib/backend";
import { confirmSubscription, unsubscribe } from "@/server/actions/newsletter";
import { newsletterPages as p } from "@/data/pages";
import { primaryButton } from "@/components/ui/buttons";
import { Dots } from "@/components/ui/Dots";

// The confirm or unsubscribe page's one button (as on aod.co.in, a button rather than acting on
// the link itself, since mail filters open links by themselves). Live: the link's token (?t=) is
// sent to the server. Mock mode: nothing is saved.
const noop = () => () => {};
export function NewsletterAction({ mode }: { mode: "confirm" | "unsubscribe" }) {
  const c = p[mode];
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get("t") ?? "", () => "");
  async function go() {
    if (!backendEnabled) return setDone(true);
    setBusy(true);
    setError(null);
    const res = await (mode === "confirm" ? confirmSubscription(token) : unsubscribe(token)).catch(() => ({ ok: false as const, error: "Couldn't do that just now. Please try again." }));
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  }
  return (
    <div className="max-w-xl" aria-live="polite">
      <h1 className="text-5xl sm:text-6xl">
        <Dots>{done ? c.doneTitle : c.title}</Dots>
      </h1>
      <p className="mt-6 text-lg text-muted">{done ? c.doneText : c.text}</p>
      {!done && (
        <button type="button" disabled={busy} onClick={() => void go()} className={`${primaryButton} mt-9 disabled:opacity-50`}>
          {c.button}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-600">
          {error}
        </p>
      )}
      {!backendEnabled && <p className="mt-6 text-sm text-muted">{p.testNote}</p>}
    </div>
  );
}
