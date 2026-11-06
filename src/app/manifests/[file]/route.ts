import { manifestSections, sectionManifest } from "@/lib/pwa";
import type { Section } from "@/lib/site-url";

// The artist portal's, admin's and Resolution Centre's web app manifests
// (/manifests/artists.webmanifest…), built at build time; see src/lib/pwa.ts.
// The file extension keeps src/proxy.ts from moving these under the section on its own domain.
export const dynamicParams = false;

export function generateStaticParams() {
  return manifestSections.map((section) => ({ file: `${section}.webmanifest` }));
}

export async function GET(_request: Request, { params }: RouteContext<"/manifests/[file]">) {
  const section = (await params).file.replace(/\.webmanifest$/, "") as Section;
  return new Response(JSON.stringify(sectionManifest(section)), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
