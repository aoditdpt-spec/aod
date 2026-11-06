import type { Metadata } from "next";
import { BookingOptions } from "@/components/home/BookingOptions";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FinalCta } from "@/components/home/FinalCta";
import { GetMatched } from "@/components/home/GetMatched";
import { Features } from "@/components/home/Features";
import { PortfolioSection } from "@/components/home/PortfolioSection";
import { Hero } from "@/components/home/Hero";
import { Portals } from "@/components/home/Portals";
import { ResolutionFlow } from "@/components/home/ResolutionFlow";
import { Stats } from "@/components/home/Stats";
import { Reveal } from "@/components/motion/Reveal";

// Section order follows how a first-time visitor decides, the way booking
// marketplaces (Urban Company, Upwork) lay out their homepages:
// promise → proof → "do they have what I need?" → why trust them → how easy it is
// → what if something goes wrong → book → stay (business contracts) → last nudge.
// The homepage's own canonical (https://www.aod.co.in), like every other page.
export const metadata: Metadata = { alternates: { canonical: "/" } };

// Phones and tablets (below 1024px) get a short homepage, as the owner laid it out: the hero with
// "What are you looking for?", the numbers with the brand logos, the GATE 2026 section, then the
// footer. The other sections are for laptops only (`laptopOnly`). Removed on every device, on
// request: the announcement bar, Most booked, "Only thoroughly verified artists" and the artist band.
const laptopOnly = "hidden lg:block";

export default function Home() {
  return (
    <>
      {/* 1. The promise, the search box and every category one tap away ("What are you looking for?"),
          as Headout and Urban Company open their homepages */}
      <Hero />
      {/* 2. Instant proof: numbers and the brands that trust us */}
      <Stats />
      <div className={laptopOnly}>
        {/* 3. "Do they have what I need?" — every category, one tap away */}
        <CategoryGrid />
      </div>
      {/* 4. Proof of the work itself: AOD's own expo coverage (GATE 2026) */}
      <PortfolioSection />
      <div className={laptopOnly}>
        {/* 5. Where everyone goes: My bookings, the Dispute Desk and AOD for Business */}
        <Reveal>
          <Portals />
        </Reveal>
        {/* 6. If there's a dispute: the Dispute Desk's steps (in place of "How it works";
            booking's own steps still show beside the booking questions further down) */}
        <Reveal>
          <ResolutionFlow />
        </Reveal>
        {/* 7. Risk removed: cancellation, rescheduling, replacement, contract */}
        <Features />
        {/* 8. The main conversion point: three questions, then WhatsApp */}
        <Reveal>
          <GetMatched />
        </Reveal>
        {/* 9. Personal vs business — business retainers keep clients coming back */}
        <Reveal>
          <BookingOptions />
        </Reveal>
        {/* 10. Last nudge for anyone still scrolling */}
        <Reveal>
          <FinalCta />
        </Reveal>
      </div>
    </>
  );
}
