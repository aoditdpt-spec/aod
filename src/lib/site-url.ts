// The customer site's address, for links that leave the artists, admin and resolve domains (where
// "/" points into that section) and for links in emails. NEXT_PUBLIC_SITE_URL overrides it
// (http://localhost:3000 in development). A *.vercel.app value is ignored: those addresses only
// redirect to www.aod.co.in (next.config.ts).
const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
export const siteUrl = (fromEnv && !/\.vercel\.app/.test(fromEnv) ? fromEnv : "https://www.aod.co.in").replace(/\/$/, "");

// A link to a page on the customer site.
export const siteHref = (path: string) => `${siteUrl}${path}`;

// The separate sites. In production each lives only on its own domain (artists.aod.co.in,
// admin.aod.co.in, resolve.aod.co.in): src/proxy.ts serves them there and next.config.ts sends
// www.aod.co.in/artists… on to them. Anywhere else (http://localhost:3000) they stay paths.
export type Section = "artists" | "admin" | "resolve";
export const onOwnDomains = /^https:\/\/(www\.)?aod\.co\.in$/.test(siteUrl);
const sectionOf = (href: string) => href.match(/^\/(artists|admin|resolve)(?=[/?#]|$)(.*)$/);

// A full link into a separate site, e.g. sectionUrl("resolve", "/track?id=RC-1001"): for emails and
// for links from one separate site to another.
export const sectionUrl = (section: Section, path = "") =>
  onOwnDomains ? `https://${section}.aod.co.in${path.startsWith("/") ? path : `/${path}`}` : `${siteUrl}/${section}${path}`;

// A link from the customer site, written as its path ("/artists/apply", "/resolve", "/my-bookings"):
// a separate site's path becomes its own domain in production; the rest stay as they are.
export const portalHref = (href: string) => {
  const m = sectionOf(href);
  return m && onOwnDomains ? sectionUrl(m[1] as Section, m[2]) : href;
};

// A link inside a separate site, written with its prefix ("/admin/bookings?open=B-1"): on its own
// domain the prefix goes ("/bookings?open=B-1", which src/proxy.ts serves); elsewhere it stays.
export const sectionLink = (href: string) => {
  const m = sectionOf(href);
  return m && onOwnDomains ? (m[2].startsWith("/") ? m[2] : `/${m[2]}`) : href;
};

// The current path as the code writes it ("/admin/bookings"), from usePathname(), which gives what
// the browser shows ("/bookings" on admin.aod.co.in). The prerendered page used the full path, so
// this keeps the server and the browser in agreement.
export const sectionPath = (section: Section, pathname: string) =>
  pathname === `/${section}` || pathname.startsWith(`/${section}/`) ? pathname : `/${section}${pathname === "/" ? "" : pathname}`;

// How that link's address reads on the page: "resolve.aod.co.in", "aod.co.in/my-bookings".
export const portalAddress = (href: string) => {
  const m = sectionOf(href);
  return m ? `${m[1]}.aod.co.in${m[2]}` : `aod.co.in${href}`;
};
