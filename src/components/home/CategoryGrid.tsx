import { ArrowRight } from "lucide-react";
import { bookByCategory, categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryTiles } from "@/components/categories/CategoryTiles";
import { CategoryCoverflow } from "./CategoryCoverflow";

// "Find artists for every kind of event": the categories in a 3D coverflow, then "Book from these
// categories" (modelled on Headout's photo tiles and Urban Company's category grid): a tile per
// category straight to its booking questions, plus a last tile for anyone unsure (CategoryTiles).
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

        <div className="mt-14 rounded-3xl bg-wash px-3 py-7 sm:p-8 lg:p-10">
          <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">{bookByCategory.eyebrow}</p>
              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">{bookByCategory.title}</h3>
              <p className="mt-2 max-w-xl text-body">{bookByCategory.text}</p>
            </div>
            <ButtonLink href="/book" size="lg" className="shrink-0 self-start sm:self-auto">
              {bookByCategory.button} <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </Reveal>

          <CategoryTiles className="mt-8" />
        </div>
      </section>
    </Container>
  );
}
