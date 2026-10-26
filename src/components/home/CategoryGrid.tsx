import { ArrowRight } from "lucide-react";
import { bookByCategory, categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryCoverflow } from "./CategoryCoverflow";

// "Find artists for every kind of event": the categories in a 3D coverflow, then, on laptops, the
// "Book from these services" band with its Book now button under the cards. (The category tiles
// that used to sit in that band repeated the cards, so they're gone; on phones and tablets the
// hero already lists every category.)
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

        <Reveal className="mt-10 hidden items-end justify-between gap-5 rounded-3xl bg-wash px-10 py-8 lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">{bookByCategory.eyebrow}</p>
            <h3 className="mt-2 text-3xl font-bold">{bookByCategory.title}</h3>
            <p className="mt-2 max-w-xl text-body">{bookByCategory.text}</p>
          </div>
          <ButtonLink href="/book" size="lg" className="shrink-0">
            {bookByCategory.button} <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </Reveal>
      </section>
    </Container>
  );
}
