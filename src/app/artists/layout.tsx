import type { Metadata } from "next";
import { SectionProvider } from "@/components/ui/AppLink";
import { sectionManifestPath } from "@/lib/pwa";

const description = "Sign in or apply to join Artists on Demand: booking requests, your profile, portfolio and availability in one place.";

// The artist portal, at artists.aod.co.in (src/proxy.ts; /artists on localhost): sign-in and the
// sign-up in (public), the signed-in pages in (portal). Kept out of search results.
export const metadata: Metadata = {
  title: { default: "AOD Artist Portal", template: "%s · AOD Artist Portal" },
  description,
  robots: { index: false, follow: false },
  openGraph: { title: "AOD Artist Portal", description, siteName: "AOD Artist Portal" },
  // Installs as its own app (src/lib/pwa.ts).
  manifest: sectionManifestPath("artists"),
  appleWebApp: { capable: true, title: "AOD Artists", statusBarStyle: "default" },
};

export default function ArtistsLayout({ children }: LayoutProps<"/artists">) {
  return <SectionProvider section="artists">{children}</SectionProvider>;
}
