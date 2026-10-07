import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { BookingOptions } from "@/components/home/BookingOptions";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Differentiators } from "@/components/home/Differentiators";
import { FinalCta } from "@/components/home/FinalCta";
import { GetMatched } from "@/components/home/GetMatched";
import { Features } from "@/components/home/Features";
import { VerifiedSection } from "@/components/home/VerifiedSection";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MostBooked } from "@/components/home/MostBooked";
import { Stats } from "@/components/home/Stats";
import { Reveal } from "@/components/motion/Reveal";

// Section order follows how a first-time visitor decides, the way booking
// marketplaces (Urban Company, Upwork) lay out their homepages:
// promise → proof → "do they have what I need?" → why trust them → how easy it is
// → what if something goes wrong → book → stay (business contracts) → last nudge.
export default function Home() {
  return (
    <>
      <AnnouncementBar />
      {/* 1. The promise and the main actions */}
      <Hero />
      {/* 2. Instant proof: numbers and the brands that trust us */}
      <Stats />
      {/* 3. "Do they have what I need?" — every category, one tap away */}
      <CategoryGrid />
      {/* 4. What others book most: shortcuts straight to a quote */}
      <MostBooked />
      {/* 5. The trust differentiator: every artist verified */}
      <VerifiedSection />
      {/* 6. Why AOD beats a long list of names, with a quick request box for ready buyers */}
      <Reveal>
        <Differentiators />
      </Reveal>
      {/* 7. Three simple steps */}
      <Reveal>
        <HowItWorks />
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
