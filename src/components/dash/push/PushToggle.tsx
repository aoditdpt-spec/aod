"use client";

import { backendEnabled } from "@/lib/backend";
import { btn } from "../ui";
import { usePush } from "./usePush";

// "Get Notifications" on the two chat pages (the admin's Chat With Artists, the portal's Messages):
// turns this phone or computer's banner for new chat messages on or off (the banner never shows the
// message text), with a test. Needs the push keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY),
// the live site (the service worker, public/sw.js, runs in production only) and, on iPhones, the
// site added to the Home Screen. Hidden in the preview.
export function PushToggle({ as }: { as: "staff" | "artist" }) {
  const { phase, busy, message, turnOn, turnOff, test } = usePush(as);
  if (!backendEnabled || phase === "checking" || phase === "unsupported") return null;
  if (phase === "install") return <p className="text-[13px] text-muted">For notifications on an iPhone, add this site to your Home Screen (Share, then Add To Home Screen) and open it from there.</p>;
  if (phase === "denied") return <p className="text-[13px] text-muted">Notifications are blocked for this site. Allow them in your browser or phone settings to get chat alerts.</p>;
  const on = phase === "on";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={() => void (on ? turnOff() : turnOn())} className={`${btn} disabled:opacity-50`}>
        {busy ? "Please Wait…" : on ? "Turn Off Notifications" : "Get Notifications"}
      </button>
      {on && (
        <button type="button" disabled={busy} onClick={() => void test()} className={`${btn} disabled:opacity-50`}>
          Send A Test
        </button>
      )}
      {on && !message && <span className="text-[13px] text-muted">On for this device.</span>}
      {message && <span className={`text-[13px] ${/^Test sent/.test(message) ? "text-muted" : "text-red-600"}`}>{message}</span>}
    </div>
  );
}
