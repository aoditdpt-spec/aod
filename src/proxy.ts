import { NextResponse, type NextRequest } from "next/server";

// Serves the artist portal (src/app/artists) at the root of its own domain:
// artists.aod.co.in/dashboard shows /artists/dashboard. Any host starting with "artists."
// counts (so http://artists.localhost:3000 works in development), plus the hosts listed in
// ARTISTS_HOSTS, e.g. a Vercel preview domain added to this project such as aod-artists.vercel.app.
// On every other host the portal stays at /artists.

const extraHosts = (process.env.ARTISTS_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!host.startsWith("artists.") && !extraHosts.includes(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === "/artists" || pathname.startsWith("/artists/")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/artists" : `/artists${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: skip Next.js internals and files with an extension (images, robots.txt…).
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
