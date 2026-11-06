// The browser event src/instrumentation-client.ts sends when the app starts moving to another
// page; the loading bar (src/components/ui/LoadingBar.tsx) listens for it. Its own file, with no
// imports, so the instrumentation (which runs before the app starts) stays tiny.
export const NAVIGATE_EVENT = "aod:navigate";
