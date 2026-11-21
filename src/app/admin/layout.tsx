import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/dash/AdminShell";
import { Loading } from "@/components/dash/ui";
import { SectionProvider } from "@/components/ui/AppLink";
import { sectionManifestPath } from "@/lib/pwa";

// The team's admin, at admin.aod.co.in (src/proxy.ts; /admin on localhost). Live: the shared data
// in the database (src/lib/admin-store.ts through src/lib/app-db.tsx); preview: sample data kept in
// this browser. The pages read the address (?open=), so they wait inside Suspense.
export const metadata: Metadata = {
  title: { default: "AOD Admin", template: "%s · AOD Admin" },
  description: "Admin panel for the Artists on Demand team.",
  robots: { index: false, follow: false },
  manifest: sectionManifestPath("admin"),
  appleWebApp: { capable: true, title: "AOD Admin", statusBarStyle: "default" },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <SectionProvider section="admin">
      <AdminShell>
        <Suspense fallback={<Loading />}>{children}</Suspense>
      </AdminShell>
    </SectionProvider>
  );
}
