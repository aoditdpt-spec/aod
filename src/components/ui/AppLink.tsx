"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useMemo, type ComponentProps, type ReactNode } from "react";
import { onOwnDomains, portalHref, sectionLink, sectionPath, siteHref, type Section } from "@/lib/site-url";

// Links that work across AOD's separate sites. In production the artist portal, the admin and the
// Dispute Desk each live on their own address (artists., admin., resolve.aod.co.in; src/proxy.ts),
// so the code writes every link as its path (/admin/bookings, /artists/profile, /resolve/new,
// /my-bookings) and this turns it into the right address for where the page is:
//   - inside the same separate site: its path without the prefix (/bookings on admin.aod.co.in)
//   - to another separate site: that site's address (resolve.aod.co.in/new)
//   - from a separate site to the customer site: www.aod.co.in/…
// Anywhere else (localhost, previews) the paths stay as written. Each separate site's layout says
// which one it is with <SectionProvider>; the customer site has none.

const Here = createContext<Section | null>(null);

export function SectionProvider({ section, children }: { section: Section; children: ReactNode }) {
  return <Here.Provider value={section}>{children}</Here.Provider>;
}

export const useSection = () => useContext(Here);

const SECTION = /^\/(artists|admin|resolve)(?=[/?#]|$)/;

export function resolveHref(href: string, here: Section | null): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const m = href.match(SECTION);
  if (m) return m[1] === here ? sectionLink(href) : portalHref(href);
  return here && onOwnDomains ? siteHref(href) : href;
}

type Props = ComponentProps<typeof NextLink>;

export default function Link({ href, ...rest }: Props) {
  const here = useContext(Here);
  const to = typeof href === "string" ? resolveHref(href, here) : href;
  // Another address entirely: a plain link (Next.js only moves within one site).
  if (typeof to === "string" && /^https?:\/\//.test(to)) {
    const { prefetch, replace, scroll, shallow, passHref, legacyBehavior, onNavigate, ...anchor } = rest as Props & Record<string, unknown>;
    void prefetch;
    void replace;
    void scroll;
    void shallow;
    void passHref;
    void legacyBehavior;
    void onNavigate;
    return <a href={to} {...(anchor as ComponentProps<"a">)} />;
  }
  return <NextLink href={to} {...rest} />;
}

// router.push / replace with the same rules.
export function useAppRouter() {
  const router = useRouter();
  const here = useContext(Here);
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) => {
        const to = resolveHref(href, here);
        if (/^https?:\/\//.test(to)) window.location.href = to;
        else router.push(to, options);
      },
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) => {
        const to = resolveHref(href, here);
        if (/^https?:\/\//.test(to)) window.location.replace(to);
        else router.replace(to, options);
      },
    }),
    [router, here],
  );
}

// The current path as the code writes it (/admin/bookings), also on the section's own address.
export function useAppPathname() {
  const path = usePathname();
  const here = useContext(Here);
  return here ? sectionPath(here, path) : path;
}
