// Runs in the browser before the app starts (Next.js loads this file by itself). It tells the
// loading bar at the top of the page (src/components/ui/LoadingBar.tsx) when the app starts
// moving to another page.
import { NAVIGATE_EVENT } from "@/lib/navigate-event";

export function onRouterTransitionStart(url: string) {
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: url }));
}
