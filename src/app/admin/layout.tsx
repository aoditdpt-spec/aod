import type { Metadata } from "next";
import type { ReactNode } from "react";

// The admin panel. Lives at /admin for now and moves to admin.aod.co.in (see src/proxy.ts).
export const metadata: Metadata = {
  title: { default: "AOD Admin", template: "%s — AOD Admin" },
  description: "Admin panel for the Artists on Demand team.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
