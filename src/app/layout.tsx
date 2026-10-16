import type { Metadata } from "next";
import { Bricolage_Grotesque, Montserrat } from "next/font/google";
import { brand } from "@/content/site";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { LoadingBar } from "@/components/ui/LoadingBar";
import "./globals.css";

// AOD's brand fonts: Bricolage Grotesque for headings (with its optical-size axis, so big
// headings get the tighter display cut) and Montserrat for everything else.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
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
    <html lang="en-IN" className={`${bricolage.variable} ${montserrat.variable} h-full antialiased`}>
      <head>
        {/* Without JavaScript, show everything that would otherwise animate in, and hide the
            loading bar (nothing would ever tell it the page has loaded). */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}[data-loading-bar]{display:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col font-sans">
        {/* The orange bar across the top while a page loads or the app moves to another page. */}
        <LoadingBar />
        {/* The customer site's navbar and footer live in (site)/layout.tsx; the artist portal has its own. */}
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
