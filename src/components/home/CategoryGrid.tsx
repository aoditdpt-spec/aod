import { ArrowRight } from "lucide-react";
import { bookByCategory, categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryCoverflow } from "./CategoryCoverflow";
import { ExploreTiles } from "./ExploreGrid";

// "Find artists for every kind of event": the categories in a 3D coverflow, then, on laptops,
// "Book from these services": the phone hero's "What are you looking for?" tiles (ExploreTiles).
// (On phones and tablets those tiles are already in the hero, so there is no second grid there.)
export function CategoryGrid({ title = "Find artists for every kind of event" }: { title?: string }) {
  return (
    <Container className="py-12">
      <section id="categories" className="scroll-mt-24">
        <Reveal className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">{categories.length} categories · one booking</p>
          <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">{title}</h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <CategoryCoverflow />
        </Reveal>

        {/* Laptops only: phones and tablets already have these tiles in the hero. */}
        <div className="mt-14 hidden rounded-3xl bg-wash p-10 lg:block">
          <Reveal className="flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">{bookByCategory.eyebrow}</p>
              <h3 className="mt-2 text-3xl font-bold">{bookByCategory.title}</h3>
              <p className="mt-2 max-w-xl text-body">{bookByCategory.text}</p>
            </div>
            <ButtonLink href="/book" size="lg" className="shrink-0">
              {bookByCategory.button} <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </Reveal>

          <Reveal delay={0.1}>
            <ExploreTiles className="mt-8 lg:grid-cols-6 lg:gap-x-6 lg:gap-y-6 xl:grid-cols-12 xl:gap-x-4" sizes="(min-width: 1280px) 9vw, 15vw" />
          </Reveal>
        </div>
      </section>
    </Container>
  );
}
