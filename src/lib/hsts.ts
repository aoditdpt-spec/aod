// HTTPS only, for two years, on aod.co.in and every subdomain: once a browser has seen this it never
// tries http:// again, even when someone types plain "aod.co.in". `preload` lets the domain go on
// the browsers' built-in HTTPS-only list (hstspreload.org), so even a first visit skips http://.
// That list is close to permanent: every subdomain must keep serving HTTPS.
// Sent on every page by next.config.ts and on the aod.co.in → www redirect by src/proxy.ts.
// No imports, so next.config.ts can load it.
export const hsts = "max-age=63072000; includeSubDomains; preload";
