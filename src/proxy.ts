import { NextResponse, type NextRequest } from "next/server";
import { onOwnDomains } from "@/lib/site-url";

// Serves each separate site at the root of its own domain:
//   artists.aod.co.in → /artists (artist portal)
//   admin.aod.co.in   → /admin   (admin panel)
//   resolve.aod.co.in → /resolve (Resolution Centre)
// so e.g. artists.aod.co.in/dashboard shows /artists/dashboard. A host counts if it starts with
// the prefix ("artists.", so http://artists.localhost:3000 works in development). Links inside
// each site leave the prefix out in production (sectionLink() in src/lib/site-url.ts), and an old
// address that has it (admin.aod.co.in/admin/bookings) redirects to the clean one.
// On every other host these stay at /artists, /admin and /resolve. Vercel's *.vercel.app
// addresses never get here: next.config.ts redirects them to www.aod.co.in.

const sections = [
  { prefix: "artists.", path: "/artists" },
  { prefix: "admin.", path: "/admin" },
  { prefix: "resolve.", path: "/resolve" },
];

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const section = sections.find((s) => host.startsWith(s.prefix));
  if (!section) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === section.path || pathname.startsWith(`${section.path}/`)) {
    if (!onOwnDomains) return NextResponse.next();
    const clean = `${pathname.slice(section.path.length) || "/"}${request.nextUrl.search}`;
    return NextResponse.redirect(new URL(clean, `https://${host}`), 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? section.path : `${section.path}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Pages only: skip Next.js internals and files with an extension (images, robots.txt…).
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
