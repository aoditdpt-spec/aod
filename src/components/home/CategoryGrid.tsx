import Link from "next/link";
import { categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryRing } from "./CategoryRing";

// "Find artists for every kind of event": the categories on a 3D ring,
// with every category also listed below as quick links (handy on phones).
export function CategoryGrid({ title = "Find artists for every kind of event" }: { title?: string }) {
  return (
    <Container className="py-12">
      <section id="categories" className="scroll-mt-24">
        <Reveal className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">10 categories · one booking</p>
          <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">{title}</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <CategoryRing />
        </Reveal>

        <Reveal delay={0.15}>
          <ul className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                >
                  <Icon name={c.icon} className="h-4 w-4 text-brand-bright" />
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
    </Container>
  );
}
