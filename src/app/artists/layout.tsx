import type { Metadata } from "next";
import type { ReactNode } from "react";
import { portal } from "@/content/artist-portal";
import { PreviewBanner } from "@/components/artists/PortalChrome";

const description = "Sign in or apply to join Artists on Demand: booking requests, your profile, portfolio and availability in one place.";

// The artist portal. Lives at /artists for now and moves to artists.aod.co.in (see src/proxy.ts).
// Kept out of search results: it's for artists, reached from the For Artists page.
export const metadata: Metadata = {
  title: { default: portal.name, template: `%s — ${portal.name}` },
  description,
  robots: { index: false, follow: false },
  openGraph: { title: portal.name, description, siteName: portal.name },
};

export default function ArtistsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-wash">
      <PreviewBanner />
      {children}
    </div>
  );
}
