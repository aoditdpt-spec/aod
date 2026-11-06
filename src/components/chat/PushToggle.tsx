"use client";

import { Bell, BellOff } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { usePush } from "./usePush";

// "Get notifications" on the chat pages: turn this phone or computer's banner for new chat
// messages (no message text in it) on or off, and send a test. Hidden when the browser can't do
// push, in the preview, or while the push keys aren't set (see usePush).
export function PushToggle({ as }: { as: "staff" | "artist" }) {
  const { phase, busy, message, info, turnOn, turnOff, test } = usePush(as);
  const status = info && (
    <details className="w-full text-xs text-muted">
      <summary className="cursor-pointer">Notification status</summary>
      <p className="mt-1">{info}</p>
    </details>
  );

  if (phase === "checking") return null;
  if (phase === "unsupported") {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted">Notifications aren&apos;t available on this device or page.</p>
        {status}
      </div>
    );
  }
  if (phase === "install") {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted">To get notifications on an iPhone, add this site to your Home Screen (Share, then Add to Home Screen) and open it from there.</p>
        {status}
      </div>
    );
  }
  if (phase === "denied") {
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted">Notifications are blocked for this site. Allow them in your browser&apos;s or phone&apos;s settings to get chat alerts.</p>
        {status}
      </div>
    );
  }

  const on = phase === "on";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void (on ? turnOff() : turnOn())}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink disabled:opacity-60"
      >
        {busy ? <Spinner /> : on ? <BellOff className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
        {on ? "Turn off notifications" : "Get notifications"}
      </button>
      {on && (
        <button type="button" disabled={busy} onClick={() => void test()} className="inline-flex h-9 items-center rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink disabled:opacity-60">
          Send a test notification
        </button>
      )}
      {on && !message && <span className="text-xs text-emerald-700">Notifications are on for this device.</span>}
      {message && <span className={`text-xs ${/^Test sent/.test(message) ? "text-emerald-700" : "text-red-600"}`}>{message}</span>}
      {status}
    </div>
  );
}
