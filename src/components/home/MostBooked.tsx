import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCategory, mostBooked } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal";

// The most-booked services as a list: no photos and no cards, just rows with a diamond bullet,
// the service, its category, the rating and a link to the category. Two columns on laptops.
export function MostBooked() {
  const items = mostBooked.map(({ service, category }) => {
    const cat = getCategory(category)!;
    const s = cat.services.find((x) => x.name === service)!;
    return { service, category: cat.name, slug: cat.slug, icon: cat.icon, rating: s.rating, bookings: s.bookings };
  });

  return (
    <section className="bg-wash py-16">
      <Container>
        <Reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">What Gujarat books most</p>
            <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">Most booked services</h2>
            <p className="mt-3 text-body">Verified artists, real reviews. Get matched in minutes — no haggling.</p>
          </div>
          <Link href="/book" className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover">
            Get your artist <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Reveal>

        {/* Top to bottom, then the second column, so the list reads in order of popularity. */}
        <StaggerList
          className="mt-10 grid border-t border-line lg:grid-flow-col lg:grid-cols-2 lg:gap-x-16"
          style={{ gridTemplateRows: `repeat(${Math.ceil(items.length / 2)}, auto)` }}
        >
          {items.map((item) => (
            <StaggerItem key={item.service} className="border-b border-line">
              <Link
                href={`/categories/${item.slug}`}
                className="group -mx-3 flex items-center gap-5 rounded-lg px-3 py-5 transition-colors hover:bg-white sm:gap-6"
              >
                <span aria-hidden className="ml-1 h-2.5 w-2.5 shrink-0 rotate-45 rounded-[2px] bg-brand-bright" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-medium text-ink group-hover:text-brand">{item.service}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <Icon name={item.icon} className="h-3.5 w-3.5 text-brand" />
                    {item.category}
                  </span>
                  <span className="mt-1 block sm:hidden">
                    <Rating rating={item.rating} count={item.bookings} unit="bookings" />
                  </span>
                </span>
                <span className="hidden shrink-0 sm:block">
                  <Rating rating={item.rating} count={item.bookings} unit="bookings" />
                </span>
                <ArrowUpRight
                  className="h-5 w-5 shrink-0 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden
                />
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      </Container>
    </section>
  );
}
