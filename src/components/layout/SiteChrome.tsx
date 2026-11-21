import { Suspense } from "react";
import { AudiencePrompt } from "@/components/layout/AudiencePrompt";
import { BottomBar } from "@/components/layout/BottomBar";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

// The customer site around a page: the navbar, the footer, the phones' bottom bar and the
// first-visit "What Are You Booking For?" popup. Used by (site)/layout.tsx and the 404 page (which
// only the root layout wraps). Phones and tablets leave room at the bottom for the bottom bar
// (--bottom-bar, globals.css). The navbar and bottom bar read the address (for the current page),
// so on pages whose address is only known when visited (a blog post) they wait in <Suspense>; on
// every other page they're in the built HTML as before.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-[var(--bottom-bar)] lg:pb-0">
      <Suspense fallback={<div aria-hidden className="h-[57px] border-b border-ink" />}>
        <Navbar />
      </Suspense>
      {children}
      <Footer />
      <Suspense fallback={null}>
        <BottomBar />
      </Suspense>
      <Suspense fallback={null}>
        <AudiencePrompt />
      </Suspense>
    </div>
  );
}
