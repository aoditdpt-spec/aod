// Runs in the browser before the app starts (Next.js loads this file by itself). It tells the
// loading bar at the top of the page (src/components/ui/LoadingBar.tsx) when the app starts
// moving to another page, and installs the service worker.
import { NAVIGATE_EVENT } from "@/lib/navigate-event";

export function onRouterTransitionStart(url: string) {
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: url }));
}

// The service worker (public/sw.js), for installing the site as an app and opening pages offline.
// Production only: in development it would serve cached copies of files `next dev` is changing.
// Registered after the page has loaded, so it never competes with the first visit's downloads.
if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
  const register = () => navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
