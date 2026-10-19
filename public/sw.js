// AOD's service worker: makes the site installable as an app and keeps it usable on a weak or
// dropped connection. Registered in production by src/instrumentation-client.ts, on every AOD
// domain (each subdomain gets its own copy and caches).
//
// What it does, per request (only GET requests to this same domain; everything else, including
// Supabase, sign-in and server actions, goes straight to the network untouched):
//   pages            network first; a copy is kept so a page seen before still opens offline,
//                    and a page never seen shows /offline.html
//   /_next/static    cache first (file names change with every build, so a copy never goes stale)
//   images, fonts    the cached copy at once, refreshed in the background
//   page data (RSC), /api, the hero video and anything marked no-store: never cached
//
// Changing how this file caches? Bump VERSION: the next visit removes the old caches.
const VERSION = "v1";
const PAGES = `aod-pages-${VERSION}`;
const STATIC = `aod-static-${VERSION}`;
const ASSETS = `aod-assets-${VERSION}`;
const OFFLINE = "/offline.html";
const PRECACHE = [OFFLINE, "/aod-wordmark.png", "/icons/icon-192.png"];
const LIMITS = { [PAGES]: 40, [STATIC]: 300, [ASSETS]: 120 };

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = Object.keys(LIMITS);
      for (const name of await caches.keys()) if (name.startsWith("aod-") && !keep.includes(name)) await caches.delete(name);
      // Lets the page request start while the worker wakes up.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Next.js page data for moves between pages, the API, the hero video (streamed in ranges).
  if (request.headers.has("RSC") || url.searchParams.has("_rsc")) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/media/") || request.headers.has("range")) return;
  if (url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(page(event, url));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC));
  } else if (url.pathname.startsWith("/_next/image") || /\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request, ASSETS));
  }
});

// Pages are kept by path (without ?open=… and the like), so one copy serves every variant.
async function page(event, url) {
  const key = url.origin + url.pathname;
  try {
    const response = (await event.preloadResponse) || (await fetch(event.request));
    if (cacheable(response)) {
      const copy = response.clone();
      event.waitUntil(put(PAGES, key, copy));
    }
    return response;
  } catch {
    const cache = await caches.open(PAGES);
    return (await cache.match(key)) || (await cache.match(OFFLINE)) || Response.error();
  }
}

async function cacheFirst(request, name) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (cacheable(response)) await put(name, request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, request, name) {
  const cached = await caches.match(request);
  const fresh = fetch(request)
    .then(async (response) => {
      if (cacheable(response)) await put(name, request, response.clone());
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    event.waitUntil(fresh);
    return cached;
  }
  return (await fresh) || Response.error();
}

// Only complete, same-site answers the server allows to be stored. A redirected answer can't be
// used for a later page visit, so it isn't kept either.
function cacheable(response) {
  return (
    response.ok &&
    response.status === 200 &&
    response.type === "basic" &&
    !response.redirected &&
    !/no-store|private/.test(response.headers.get("Cache-Control") || "")
  );
}

async function put(name, key, response) {
  const cache = await caches.open(name);
  await cache.put(key, response);
  // Drop the oldest entries past the limit (keys come back in the order they were added).
  const keys = await cache.keys();
  const extra = keys.length - LIMITS[name];
  const precached = PRECACHE.map((path) => self.location.origin + path);
  for (const old of keys.slice(0, Math.max(0, extra))) if (!precached.includes(old.url)) await cache.delete(old);
}
