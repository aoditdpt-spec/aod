import { categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryCoverflow } from "./CategoryCoverflow";

// "Find artists for every kind of event": the categories in a 3D coverflow. (The hero's "What are
// you looking for?" already lists every category as tiles, so there is no second grid here.)
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
      </section>
    </Container>
  );
}
