import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Notices } from "@/components/ui/Notices";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aod.co.in"),
  openGraph: { siteName: "AOD – Artists on Demand", type: "website", locale: "en_IN" },
  title: { default: "AOD – Artists on Demand", template: "%s · AOD" },
  description: "Book verified photographers, cinematographers, live bands, anchors and more in Ahmedabad.",
  applicationName: "AOD",
  // The installed app on iPhones (Add to Home Screen).
  appleWebApp: { capable: true, title: "AOD", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrument.variable} h-full antialiased`}>
      <head>
        {/* Without JavaScript, content that fades in on scroll (data-reveal) is shown at once. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      {/* The customer site's navbar and footer are in (site)/layout.tsx; the admin and the artist
          portal have their own. */}
      <body className="flex min-h-full flex-col font-sans">
        <MotionProvider>
          {children}
          {/* The site's own alert (showNotice), in place of the browser's alert box. */}
          <Notices />
        </MotionProvider>
      </body>
    </html>
  );
}
