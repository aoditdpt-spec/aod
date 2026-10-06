import type { ReactNode } from "react";
import { AccountMenu } from "@/components/artists/AccountMenu";
import { PortalHeader } from "@/components/artists/PortalChrome";
import { PortalNav } from "@/components/artists/PortalNav";

// Signed-in part of the portal: header with the account menu, then the sidebar (tabs on phones).
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PortalHeader logoHref="/artists/dashboard" right={<AccountMenu />} />
      <div className="flex flex-1 flex-col lg:flex-row">
        <PortalNav />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
      </div>
    </>
  );
}
