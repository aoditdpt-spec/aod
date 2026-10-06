import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { brand } from "@/content/site";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

// Free stand-in for Upwork's Neue Montreal (a paid font).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const description =
  "Book verified photographers, cinematographers, DJs, anchors, makeup artists and more — as easily as booking a cab. Curated matches, transparent quotes, replacement guarantee.";

export const metadata: Metadata = {
  metadataBase: new URL(`https://${brand.domain}`),
  title: {
    default: `${brand.fullName} — book verified artists instantly`,
    template: `%s — ${brand.fullName}`,
  },
  description,
  openGraph: {
    type: "website",
    siteName: brand.fullName,
    locale: "en_IN",
    description,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Without JavaScript, show everything that would otherwise animate in. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {/* The customer site's navbar and footer live in (site)/layout.tsx; the artist portal has its own. */}
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
