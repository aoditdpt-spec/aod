"use client";

import { useEffect, useState } from "react";
import { backendEnabled } from "@/lib/backend";
import { removePushSubscription, savePushSubscription, sendTestNotification } from "@/server/actions/push";

// Chat notifications on this device: whether they can be turned on, whether they are, and turning
// them on or off. Used by the "Get notifications" button (PushToggle) and the prompt that asks
// after the app opens (PushPrompt). Needs the push keys in the environment and, on iPhones, the
// site added to the Home Screen; the service worker (public/sw.js) only runs on the live site.
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyBytes(base64: string) {
  const raw = atob((base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// What this device offers, for the "Notification status" line on the chat pages.
function deviceInfo(): string {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  return [
    `keys ${publicKey ? "set" : "MISSING"}`,
    `live ${backendEnabled ? "yes" : "no"}`,
    `installed app ${standalone ? "yes" : "no"}`,
    `service worker ${"serviceWorker" in navigator ? "yes" : "no"}`,
    `push ${"PushManager" in window ? "yes" : "no"}`,
    `permission ${"Notification" in window ? Notification.permission : "n/a"}`,
  ].join(" · ");
}

export type PushPhase = "checking" | "unsupported" | "off" | "on" | "denied" | "install";

export function usePush(as: "staff" | "artist") {
  const [phase, setPhase] = useState<PushPhase>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [info, setInfo] = useState("");

  useEffect(() => {
    let stale = false;
    const done = (p: PushPhase) => {
      if (!stale) setPhase(p);
    };
    (async () => {
      if (!stale) setInfo(deviceInfo());
      if (!backendEnabled || !publicKey) return done("unsupported");
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (ios && !standalone) return done("install");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return done("unsupported");
      if (Notification.permission === "denied") return done("denied");
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        done(sub && Notification.permission === "granted" ? "on" : "off");
      } catch {
        done("off");
      }
    })();
    return () => {
      stale = true;
    };
  }, []);

  // Asks the browser's permission (it must come from a tap), subscribes and saves this device.
  async function turnOn(): Promise<boolean> {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPhase(permission === "denied" ? "denied" : "off");
        return false;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) }));
      const json = sub.toJSON();
      const res = await savePushSubscription({ endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" } }, as);
      if (res.ok) setPhase("on");
      else setMessage(res.error);
      return res.ok;
    } catch {
      setMessage("Couldn't turn notifications on. Try again in a moment.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setPhase("off");
    } catch {
      setMessage("Couldn't turn notifications off. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await sendTestNotification(as);
      setMessage(res.ok ? `Test sent to ${res.sent} device${res.sent === 1 ? "" : "s"}. It should appear in a few seconds.` : res.error);
    } catch {
      setMessage("Couldn't send the test. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return { phase, busy, message, info, turnOn, turnOff, test };
}
