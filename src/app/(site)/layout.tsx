import type { ReactNode } from "react";
import { AppTabBar } from "@/components/layout/AppTabBar";
import { Footer } from "@/components/layout/Footer";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { ScrollProgress } from "@/components/motion/ScrollProgress";

// Chrome for the customer site (aod.co.in): navbar, footer, the WhatsApp button and, on phones,
// the "Get the AOD app" popup; inside the installed app, the bottom tab bar.
// The artist portal under /artists uses its own layout instead.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <AppTabBar />
      <WhatsAppFab />
      <InstallPrompt />
    </>
  );
}
