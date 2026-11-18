"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useRef, useState } from "react";
import { Check, Share, ShieldCheck, Smartphone, X } from "lucide-react";
import { installApp } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { INSTALL_OFFER_EVENT, installOffer, isIos, keepInstallOffer, runningAsApp } from "@/lib/install-app";

// "Get the AOD app": a popup on phones and tablets a few seconds after the site opens.
// Android (Chrome, Edge, Samsung Internet): "Install app" shows the browser's own install dialog
// (one more tap), so nobody has to find "Install app" in the ⋮ menu. It only appears once the
// browser has offered the install (src/lib/install-app.ts), which it doesn't do when the app is
// already installed. iPhone: no website can install itself there, so it shows the Share →
// Add to Home Screen steps instead. "Not now" closes it for a week; it never shows inside the
// installed app, on laptops, or on the booking pages (someone filling in a request).
const LATER_KEY = "aod-install-later";
const WEEK = 7 * 24 * 3600_000;
const DELAY = 4000;

function snoozed() {
  try {
    return Number(localStorage.getItem(LATER_KEY)) > Date.now();
  } catch {
    return false;
  }
}
function snooze(ms: number) {
  try {
    localStorage.setItem(LATER_KEY, String(Date.now() + ms));
  } catch {
    // Private mode or storage blocked: it may show again next visit.
  }
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [mode, setMode] = useState<null | "android" | "ios">(null);
  const [done, setDone] = useState(false);
  const installButton = useRef<HTMLButtonElement>(null);
  const onBookingPage = pathname.startsWith("/book");

  useEffect(() => {
    if (onBookingPage || runningAsApp() || snoozed()) return;
    if (!window.matchMedia("(pointer: coarse) and (max-width: 1023px)").matches) return;
    const ios = isIos();
    const started = Date.now();
    let timer: number | undefined;
    // Shows the popup DELAY after the page opened, or as soon as the offer arrives after that.
    const show = () => {
      if (!ios && !installOffer()) return;
      timer = window.setTimeout(() => setMode(ios ? "ios" : "android"), Math.max(0, DELAY - (Date.now() - started)));
    };
    show();
    window.addEventListener(INSTALL_OFFER_EVENT, show);
    return () => {
      window.removeEventListener(INSTALL_OFFER_EVENT, show);
      window.clearTimeout(timer);
    };
  }, [onBookingPage]);

  // Escape closes it, like "Not now"; the install button gets focus when it opens.
  useEffect(() => {
    if (!mode) return;
    installButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") later();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  function later() {
    snooze(WEEK);
    setMode(null);
  }

  // iPhone "Got it": they know the steps now, so wait four weeks before reminding.
  function gotIt() {
    snooze(4 * WEEK);
    setMode(null);
  }

  async function install() {
    const offer = installOffer();
    if (!offer) return later();
    await offer.prompt();
    const { outcome } = await offer.userChoice;
    // The offer can only be used once; the browser sends a new one if it's needed again.
    keepInstallOffer(null);
    if (outcome === "accepted") {
      setDone(true);
      window.setTimeout(() => setMode(null), 2500);
    } else later();
  }

  return (
    <AnimatePresence>
      {mode && (
        <m.div
          key="install"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 p-3 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) later();
          }}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            className="w-full max-w-md rounded-[1.5rem] bg-white p-6 shadow-xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ y: 40, opacity: 0, transition: { duration: 0.2 } }}
          >
            <div className="flex items-start gap-4">
              <Image src="/icons/icon-192.png" alt="" width={56} height={56} unoptimized className="h-14 w-14 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <h2 id="install-title" className="text-xl font-bold">
                  {mode === "ios" ? installApp.iosTitle : installApp.title}
                </h2>
                <p className="text-sm text-muted">{installApp.from}</p>
              </div>
              <button type="button" onClick={later} aria-label={installApp.notNow} className="-mr-2 -mt-2 rounded-lg p-2 text-muted hover:bg-wash hover:text-ink">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <p className="mt-4 text-sm text-body">{installApp.text}</p>

            {mode === "ios" ? (
              <ol className="mt-4 space-y-2 text-sm text-ink">
                {installApp.iosSteps.map((step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-peach text-xs font-bold text-brand-hover">{i + 1}</span>
                    {step}
                    {i === 0 && <Share className="h-4 w-4 shrink-0 text-brand" aria-label="(the Share icon)" />}
                  </li>
                ))}
              </ol>
            ) : (
              <ul className="mt-4 space-y-2.5 text-sm text-ink">
                {installApp.points.map((p) => (
                  <li key={p.text} className="flex gap-3">
                    {p.icon === "shield" ? (
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                    ) : (
                      <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                    )}
                    {p.text}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 grid gap-2">
              {mode === "ios" ? (
                <button ref={installButton} type="button" onClick={gotIt} className={buttonClasses("primary", "lg", "w-full")}>
                  {installApp.iosDone}
                </button>
              ) : done ? (
                <p className="flex h-12 items-center justify-center gap-2 rounded-lg bg-wash text-sm font-medium text-ink" role="status">
                  <Check className="h-4 w-4 text-brand" aria-hidden /> {installApp.installing}
                </p>
              ) : (
                <>
                  <button ref={installButton} type="button" onClick={install} className={buttonClasses("primary", "lg", "w-full")}>
                    {installApp.install}
                  </button>
                  <p className="text-center text-xs text-muted">{installApp.installNote}</p>
                </>
              )}
              {!done && (
                <button type="button" onClick={later} className={buttonClasses("outline", "lg", "w-full")}>
                  {installApp.notNow}
                </button>
              )}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
