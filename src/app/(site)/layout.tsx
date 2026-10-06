import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { ScrollProgress } from "@/components/motion/ScrollProgress";

// Chrome for the customer site (aod.co.in): navbar, footer and the WhatsApp button.
// The artist portal under /artists uses its own layout instead.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
