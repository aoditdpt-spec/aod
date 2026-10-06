import { NextResponse, type NextRequest } from "next/server";

// Serves each separate site at the root of its own domain:
//   artists.aod.co.in → /artists (artist portal)
//   pay.aod.co.in     → /pay     (payment page)
//   admin.aod.co.in   → /admin   (admin panel)
// so e.g. artists.aod.co.in/dashboard shows /artists/dashboard. A host counts if it starts with
// the prefix ("artists.", so http://artists.localhost:3000 works in development) or is listed in
// the matching env var, e.g. a Vercel domain added to this project: ARTISTS_HOSTS=aod-artists.vercel.app.
// On every other host these stay at /artists, /pay and /admin.

const list = (v: string | undefined) =>
  (v ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

const sections = [
  { prefix: "artists.", path: "/artists", hosts: list(process.env.ARTISTS_HOSTS) },
  { prefix: "pay.", path: "/pay", hosts: list(process.env.PAY_HOSTS) },
  { prefix: "admin.", path: "/admin", hosts: list(process.env.ADMIN_HOSTS) },
];

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const section = sections.find((s) => host.startsWith(s.prefix) || s.hosts.includes(host));
  if (!section) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === section.path || pathname.startsWith(`${section.path}/`)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? section.path : `${section.path}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: skip Next.js internals and files with an extension (images, robots.txt…).
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
