import Link from "next/link";
import { categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryCoverflow } from "./CategoryCoverflow";

// "Find artists for every kind of event": the categories in a 3D coverflow, with every category
// also listed below as quick links on laptops. (On phones and tablets the hero's "What are you
// looking for?" already lists every category as tiles, so there is no second grid there.)
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

        <Reveal delay={0.15} className="hidden lg:block">
          {/* Equal-size buttons, 5 per row. */}
          <ul className="mt-10 grid grid-cols-5 gap-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="group flex h-16 w-full items-center gap-3 rounded-xl border border-line bg-white px-4 text-base font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-peach/60 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Icon name={c.icon} className="h-5 w-5 text-brand" />
                  </span>
                  <span className="leading-tight">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </Container>
  );
}
