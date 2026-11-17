"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { backendEnabled } from "@/lib/backend";
import { sendProfileToAod, usePortalMode, usePortalState } from "@/lib/artist-live";
import { Spinner } from "@/components/ui/Spinner";
import { Panel } from "./form";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// The portal's final button. An applicant first submits their application for review (photo,
// portfolio, links and profile), then sends updates when they change something; an approved
// artist sends updates to their profile. The AOD team gets an email and a note on the record
// (sendToAod in src/server/actions/artist.ts). Shows when it was last sent.
export function SendToAod() {
  const mode = usePortalMode();
  const sentAt = usePortalState().data?.sentToAodAt;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const applicant = mode !== "live";
  const firstTime = applicant && !sentAt;

  const title = firstTime ? "Ready for review?" : applicant ? "Sent to AOD for review" : "Updated your profile?";
  const text = firstTime
    ? "When your photo, portfolio, links and profile are in, submit your application. The AOD team reviews it and messages you."
    : applicant
      ? "Changed your photo, portfolio, links or profile since? Send the update so the team sees it."
      : "Changed your photo, portfolio, links or services? Let the AOD team know.";

  return (
    <Panel title={title} text={text}>
      {sentAt && (
        <p className="mb-3 flex items-center gap-1.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Last sent {fmt(sentAt)}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage(null);
          const error = await sendProfileToAod();
          setBusy(false);
          setMessage(error ? { ok: !backendEnabled, text: error } : { ok: true, text: firstTime ? "Submitted. The AOD team will review it." : "Sent. The AOD team will see your changes." });
        }}
        className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? <Spinner /> : <Send className="h-4 w-4" aria-hidden />}
        {firstTime ? "Submit for review" : "Send update to AOD"}
      </button>
      {message && <p className={`mt-2 text-sm ${message.ok ? "text-muted" : "text-red-600"}`}>{message.text}</p>}
    </Panel>
  );
}
