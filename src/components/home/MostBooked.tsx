import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { getCategory, mostBooked, mostBookedSection as copy } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { Reveal } from "@/components/motion/Reveal";
import { linkCard, linkText, linkTitle } from "@/components/ui/cards";

// The most-booked services as a sideways row of cards, modelled on Headout's experience cards:
// the category photo with a badge, "★ rating (bookings) · category", the service, two promises
// with icons, and where Headout shows a price, "Get a quote" (AOD quotes per request). Four
// cards fit on laptops; the rest scroll in with the arrows or a swipe. Phones get a list instead,
// as Headout's "Top trending": the photo on the left, the details on the right. Each card or row opens the category page's booking questions.
export function MostBooked() {
  const items = mostBooked.map(({ service, category }) => {
    const cat = getCategory(category)!;
    const s = cat.services.find((x) => x.name === service)!;
    return { service, category: cat.name, slug: cat.slug, icon: cat.icon, image: cat.image, rating: s.rating, bookings: s.bookings };
  });

  return (
    <section className="bg-wash py-16">
      <Container>
        <Reveal>
          <ScrollRow
            label="most booked services"
            seeAll={{ href: "/categories", label: copy.seeAll }}
            listClassName="max-sm:hidden"
            after={
              <ul className="mt-5 space-y-3 sm:hidden">
                {items.map((item) => (
                  <li key={item.service}>
                    <Link href={`/categories/${item.slug}#book`} className={`flex gap-3.5 rounded-2xl bg-white p-2.5 ${linkCard}`}>
                      <span className="relative block aspect-[4/5] w-[6.5rem] shrink-0 overflow-hidden rounded-xl bg-peach">
                        {item.image ? (
                          <Image src={item.image.src} alt="" fill sizes="7rem" className="object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center">
                            <Icon name={item.icon} className="h-8 w-8 text-brand" strokeWidth={1.5} />
                          </span>
                        )}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col py-0.5">
                        <span className={`flex items-center gap-1 text-xs text-muted ${linkText}`}>
                          <Star aria-hidden className="h-3.5 w-3.5 fill-brand text-brand" />
                          <span className="font-semibold text-brand">{item.rating.toFixed(2).replace(/0$/, "")}</span>
                          <span>({item.bookings})</span>
                        </span>
                        <span className={`mt-1 text-[1.0625rem] font-bold leading-snug text-ink ${linkTitle}`}>
                          {item.service}
                        </span>
                        <span className="mt-0.5 text-sm text-muted">{item.category}</span>
                        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-brand">
                          {copy.action}
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            }
            heading={
              <>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">{copy.eyebrow}</p>
                <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">{copy.title}</h2>
                <p className="mt-3 hidden text-body sm:block">{copy.text}</p>
              </>
            }
          >
            {items.map((item) => (
              <li
                key={item.service}
                className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3*1.25rem)/4)]"
              >
                <Link href={`/categories/${item.slug}#book`} className={`flex h-full flex-col rounded-2xl bg-white p-2 ${linkCard}`}>
                  <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-peach">
                    {item.image ? (
                      <Image
                        src={item.image.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 78vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center">
                        <Icon name={item.icon} className="h-10 w-10 text-brand" strokeWidth={1.5} />
                      </span>
                    )}
                    <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[0.6875rem] font-semibold text-ink backdrop-blur-sm">
                      {copy.badge}
                    </span>
                  </span>

                  <span className="flex flex-1 flex-col px-1.5 pb-1.5 pt-3">
                    <span className={`flex items-center gap-1 text-xs text-muted ${linkText}`}>
                      <Star aria-hidden className="h-3.5 w-3.5 fill-brand text-brand" />
                      <span className="font-semibold text-brand">{item.rating.toFixed(2).replace(/0$/, "")}</span>
                      <span>({item.bookings} bookings)</span>
                      <span aria-hidden>·</span>
                      <span className="truncate">{item.category}</span>
                    </span>
                    <span className={`mt-1.5 text-lg font-bold leading-snug text-ink ${linkTitle}`}>{item.service}</span>
                    <span className="mt-2 space-y-1">
                      {copy.perks.map((p) => (
                        <span key={p.label} className={`flex items-center gap-1.5 text-sm text-muted ${linkText}`}>
                          <Icon name={p.icon} className="h-4 w-4 shrink-0 text-ink" aria-hidden />
                          {p.label}
                        </span>
                      ))}
                    </span>
                    <span className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <span className="text-xs text-muted">{copy.priceLabel}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                        {copy.action}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ScrollRow>
        </Reveal>
      </Container>
    </section>
  );
}
