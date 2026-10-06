import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import { brand } from "@/content/site";
import { payCopy } from "@/content/payments";
import { siteHref } from "@/lib/site-url";

const description = "Pay Artists on Demand by UPI: scan the QR code or open your UPI app, then share the transaction ID on WhatsApp.";

// The payment page. Lives at /pay for now and moves to pay.aod.co.in (see src/proxy.ts).
// Minimal on purpose: logo, the payment, contact details. Kept out of search results.
export const metadata: Metadata = {
  title: { absolute: payCopy.title, template: `%s — ${brand.fullName}` },
  description,
  robots: { index: false, follow: false },
  openGraph: { title: payCopy.title, description, siteName: brand.fullName },
};

export default function PayLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-wash">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 print:hidden">
        <span className="flex items-center gap-2">
          <Image src="/aod-wordmark.png" alt="AOD" width={708} height={200} priority className="h-6 w-auto" />
          <span className="rounded-md bg-peach px-2 py-0.5 text-xs font-medium text-brand-hover">Payments</span>
        </span>
        <a href={brand.phoneHref} className="text-sm text-muted hover:text-brand">
          {brand.phoneDisplay}
        </a>
      </header>
      <main className="flex-1 px-4 pb-16 pt-4 sm:px-6">{children}</main>
      <footer className="px-4 pb-8 text-center text-xs text-muted print:hidden">
        {brand.fullName} · {brand.city}, {brand.region} · Questions about a payment? Call {brand.phoneDisplay} or message us on WhatsApp.
        <span className="mt-2 flex justify-center gap-4">
          <a href={siteHref("/privacy")} className="hover:text-ink">
            Privacy
          </a>
          <a href={siteHref("/terms")} className="hover:text-ink">
            Terms
          </a>
          <a href={siteHref("/refund-policy")} className="hover:text-ink">
            Refunds
          </a>
        </span>
      </footer>
    </div>
  );
}
