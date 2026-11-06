// The browser's offer to install the site as an app (`beforeinstallprompt`: Chrome, Edge and
// Samsung Internet on Android, Chrome and Edge on laptops; Safari and Firefox never send it).
// It often arrives before React has started, so src/instrumentation-client.ts catches it and keeps
// it on `window`; the install popup (src/components/layout/InstallPrompt.tsx) reads it from there
// and, on "Install app", shows the browser's own one-tap install dialog with it.
// No imports, so instrumentation-client.ts stays small.

export type InstallOffer = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const INSTALL_OFFER_EVENT = "aod:install-offer";

type WithOffer = Window & { __aodInstallOffer?: InstallOffer | null };

export function keepInstallOffer(offer: InstallOffer | null) {
  (window as WithOffer).__aodInstallOffer = offer;
  window.dispatchEvent(new Event(INSTALL_OFFER_EVENT));
}

export const installOffer = (): InstallOffer | null => (window as WithOffer).__aodInstallOffer ?? null;

// Running as the installed app (opened from the home screen), not in a browser tab.
export const runningAsApp = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPhone and iPad: no install offer there; people add it from the Share menu.
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
