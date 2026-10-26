import type { NextConfig } from "next";
import { hsts } from "./src/lib/hsts";

// Other places the browser may load from: Supabase (data, sign-in, live updates, portfolio
// files), NEXT_PUBLIC_MEDIA_URL when the hero footage lives on a bucket or CDN, and Google Drive
// for artists' profile photos (src/lib/drive-photo.ts: drive.google.com/thumbnail answers with a
// redirect to a googleusercontent.com address, and the browser checks both).
const origin = (url?: string) => {
  try {
    return url ? new URL(url).origin : "";
  } catch {
    return "";
  }
};
const supabase = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const media = origin(process.env.NEXT_PUBLIC_MEDIA_URL);
const drivePhotos = "https://drive.google.com https://*.googleusercontent.com";

// Content Security Policy: scripts, styles and fonts only from the site itself, data only from
// the site and Supabase, no plugins, and no other site may frame the pages (clickjacking).
// Inline scripts stay allowed because Next.js streams the page data in inline <script> tags;
// a nonce would make every page dynamic instead of prerendered. Production only: `next dev`
// needs eval and its own websocket.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase} ${media} ${drivePhotos}`,
  `media-src 'self' blob: ${supabase} ${media}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase} ${supabase.replace(/^https:/, "wss:")}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  ...(process.env.NODE_ENV === "production"
    ? [
        { key: "Content-Security-Policy", value: csp },
        // HTTPS only, on every subdomain too (src/lib/hsts.ts).
        { key: "Strict-Transport-Security", value: hsts },
      ]
    : []),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // Keeps other sites' windows from reaching into ours; pop-ups we open (WhatsApp) still work.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

// Photos, logos and the hero footage keep their file names, so browsers re-check them now and
// then rather than never: cached for 30 days, then used while a fresh copy loads in the background.
// Replacing one of these files? Give it a new name, or returning visitors see the old one for up to a month.
const longCache = [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF first (about 20% smaller than WebP), and optimised copies are kept for 30 days.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    // Blog cover photos, in the public `blog` storage bucket.
    remotePatterns: supabase ? [new URL(`${supabase}/storage/v1/object/public/blog/**`)] : [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...["/media/:path*", "/brands/:path*", "/categories/:path*"].map((source) => ({ source, headers: longCache })),
      // The service worker (public/sw.js): browsers always check for a new one, so a deploy reaches
      // installed apps on their next visit.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" }] },
    ];
  },
  // The site answers only on aod.co.in and its subdomains. Vercel's own addresses (the project's
  // *.vercel.app domain and each deployment's URL) send visitors to the same page on www.aod.co.in;
  // the query string goes along (e.g. ?open=APP-201 from an older email).
  // The artist portal, admin panel and Resolution Centre live only on their own domains
  // (src/proxy.ts), so their paths on the main site move there: www.aod.co.in/admin/bookings opens
  // admin.aod.co.in/bookings. Other hosts (localhost) keep the paths.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: ".+\\.vercel\\.app" }],
        destination: "https://www.aod.co.in/:path*",
        permanent: true,
      },
      ...["artists", "admin", "resolve"].map((section) => ({
        source: `/${section}/:path*`,
        has: [{ type: "host" as const, value: "(?:www\\.)?aod\\.co\\.in" }],
        destination: `https://${section}.aod.co.in/:path*`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
