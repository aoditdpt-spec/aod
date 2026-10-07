import Link from "next/link";
import { categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryCoverflow } from "./CategoryCoverflow";

// "Find artists for every kind of event": the categories in a 3D coverflow (same as Most booked),
// with every category also listed below as quick links (handy on phones).
export function CategoryGrid({ title = "Find artists for every kind of event" }: { title?: string }) {
  return (
    <Container className="py-12">
      <section id="categories" className="scroll-mt-24">
        <Reveal className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">10 categories · one booking</p>
          <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">{title}</h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <CategoryCoverflow />
        </Reveal>

        <Reveal delay={0.15}>
          {/* Equal-size buttons: 2 per row on phones, 5 per row (two even rows of the 10) on laptops. */}
          <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="group flex h-14 w-full items-center gap-3 rounded-xl border border-line bg-white px-3 text-[0.9375rem] font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand sm:h-16 sm:px-4 sm:text-base"
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
