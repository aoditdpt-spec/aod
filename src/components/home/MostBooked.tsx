import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategory, mostBooked } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MostBookedSlider, type SliderItem } from "./MostBookedSlider";

// The most-booked services as a 3D coverflow slider.
export function MostBooked() {
  const items: SliderItem[] = mostBooked.map(({ service, category }) => {
    const cat = getCategory(category)!;
    const s = cat.services.find((x) => x.name === service)!;
    return { service, category: cat.name, slug: cat.slug, icon: cat.icon, rating: s.rating, bookings: s.bookings };
  });

  return (
    <section className="overflow-hidden bg-wash py-16">
      <Container>
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">What Gujarat books most</p>
            <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">Most booked services</h2>
            <p className="mt-3 text-body">Verified artists, real reviews. Get matched in minutes — no haggling.</p>
          </div>
          <Link href="/book" className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover">
            Get matched <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <MostBookedSlider items={items} />
        </Reveal>
      </Container>
    </section>
  );
}
