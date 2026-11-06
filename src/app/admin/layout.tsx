import type { Metadata } from "next";
import type { ReactNode } from "react";
import { sectionManifestPath } from "@/lib/pwa";

// The admin panel, at admin.aod.co.in (src/proxy.ts; /admin on localhost).
export const metadata: Metadata = {
  title: { default: "AOD Admin", template: "%s — AOD Admin" },
  description: "Admin panel for the Artists on Demand team.",
  robots: { index: false, follow: false },
  // Installs as its own app (src/lib/pwa.ts).
  manifest: sectionManifestPath("admin"),
  appleWebApp: { capable: true, title: "AOD Admin", statusBarStyle: "default" },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
