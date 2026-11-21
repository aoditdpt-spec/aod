import { Categories } from "@/components/home/Categories";
import { Closing } from "@/components/home/Closing";
import { Hero } from "@/components/home/Hero";
import { BrandStrip } from "@/components/home/BrandStrip";
import { Partner } from "@/components/home/Partner";
import { Places } from "@/components/home/Places";

// The homepage, in the owner's order (2026-11-20): the one idea (the heading, with our promises
// beside it) -> who they can book -> the brands we've worked with -> real work (GCCI GATE Expo
// 2026) -> every part of AOD (the page turns black) -> the last word ("Ready When You Are.").
export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Categories />
      <BrandStrip />
      <Partner />
      <Places />
      <Closing />
    </main>
  );
}
