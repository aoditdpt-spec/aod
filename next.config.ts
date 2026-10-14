import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
