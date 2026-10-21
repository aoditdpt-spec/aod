import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { BookingOptions } from "@/components/home/BookingOptions";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FinalCta } from "@/components/home/FinalCta";
import { GetMatched } from "@/components/home/GetMatched";
import { Features } from "@/components/home/Features";
import { VerifiedSection } from "@/components/home/VerifiedSection";
import { Hero } from "@/components/home/Hero";
import { MostBooked } from "@/components/home/MostBooked";
import { Portals } from "@/components/home/Portals";
import { ResolutionFlow } from "@/components/home/ResolutionFlow";
import { Stats } from "@/components/home/Stats";
import { Reveal } from "@/components/motion/Reveal";

// Section order follows how a first-time visitor decides, the way booking
// marketplaces (Urban Company, Upwork) lay out their homepages:
// promise → proof → "do they have what I need?" → why trust them → how easy it is
// → what if something goes wrong → book → stay (business contracts) → last nudge.
export default function Home() {
  return (
    <>
      {/* 1. The promise, the search box and every category one tap away ("What are you looking for?"),
          as Headout and Urban Company open their homepages */}
      <Hero />
      <AnnouncementBar />
      {/* 2. Instant proof: numbers and the brands that trust us */}
      <Stats />
      {/* 3. "Do they have what I need?" — every category, one tap away */}
      <CategoryGrid />
      {/* 4. What others book most: shortcuts straight to a quote */}
      <MostBooked />
      {/* 5. The trust differentiator: every artist verified */}
      <VerifiedSection />
      {/* 6. Where everyone goes: artists join or sign in, customers find My bookings, payments,
          the Dispute Desk and AOD for Business. Straight after trust, so an artist who
          landed here (or someone with a dispute) finds their way before the booking pitch. */}
      <Reveal>
        <Portals />
      </Reveal>
      {/* 7. If there's a dispute: the Dispute Desk's steps (in place of "How it works";
          booking's own steps still show beside the booking questions further down) */}
      <Reveal>
        <ResolutionFlow />
      </Reveal>
      {/* 8. Risk removed: cancellation, rescheduling, replacement, contract */}
      <Features />
      {/* 9. The main conversion point: three questions, then WhatsApp */}
      <Reveal>
        <GetMatched />
      </Reveal>
      {/* 10. Personal vs business — business retainers keep clients coming back */}
      <Reveal>
        <BookingOptions />
      </Reveal>
      {/* 11. Last nudge for anyone still scrolling */}
      <Reveal>
        <FinalCta />
      </Reveal>
    </>
  );
}
