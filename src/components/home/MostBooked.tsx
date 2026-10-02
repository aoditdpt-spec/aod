import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategory, mostBooked } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { Rating } from "@/components/ui/Rating";

// Grid of the most-booked services (sits where testimonials would go until AOD has real reviews).
export function MostBooked() {
  const items = mostBooked.map(({ service, category }) => {
    const cat = getCategory(category)!;
    return { cat, service: cat.services.find((s) => s.name === service)! };
  });

  return (
    <Container className="py-16">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-3xl font-normal sm:text-[2.5rem]">Most booked services</h2>
          <p className="mt-3 text-body">Verified artists, real reviews. Get matched in minutes — no haggling.</p>
        </div>
        <Link href="/book" className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover">
          Get matched <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ cat, service }) => (
          <li key={service.name}>
            <Link
              href={`/categories/${cat.slug}`}
              className="group flex h-full flex-col rounded-[1.25rem] border border-line bg-white p-3 transition hover:border-brand hover:shadow-md"
            >
              <PhotoPlaceholder icon={cat.icon} label={service.name} className="aspect-[16/10]" />
              <div className="flex flex-1 flex-col px-4 pb-3 pt-5">
                <h3 className="text-lg font-medium group-hover:text-brand">{service.name}</h3>
                <p className="text-sm text-muted">{cat.name}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Rating rating={service.rating} count={service.bookings} unit="bookings" />
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                    Request a quote <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
