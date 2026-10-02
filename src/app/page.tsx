import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { BookingOptions } from "@/components/home/BookingOptions";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { Differentiators } from "@/components/home/Differentiators";
import { FinalCta } from "@/components/home/FinalCta";
import { GetMatched } from "@/components/home/GetMatched";
import { Features } from "@/components/home/Features";
import { MetInPersonSection } from "@/components/home/MetInPersonSection";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { MostBooked } from "@/components/home/MostBooked";
import { Stats } from "@/components/home/Stats";

// Section order follows the Upwork homepage saved in context/.
export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Hero />
      <Features />
      <MetInPersonSection />
      <CategoryGrid />
      <GetMatched />
      <HowItWorks />
      <Differentiators />
      <BookingOptions />
      <MostBooked />
      <Stats />
      <FinalCta />
    </>
  );
}
