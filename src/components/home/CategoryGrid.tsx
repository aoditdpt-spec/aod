import Link from "next/link";
import { categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";

// 5 × 2 grid of category cards with green line icons.
export function CategoryGrid({ title = "Find artists for every kind of event" }: { title?: string }) {
  return (
    <Container className="py-10">
      <section id="categories" className="scroll-mt-24">
        <h2 className="text-3xl font-normal sm:text-[40px]">{title}</h2>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-7">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/categories/${c.slug}`}
                className="group flex h-full min-h-[164px] flex-col gap-6 rounded-card border border-line bg-white p-5 shadow-[0_2px_6px_rgba(38,18,0,0.06)] transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
              >
                <Icon name={c.icon} className="h-9 w-9 text-brand-bright" strokeWidth={1.25} />
                <span className="text-base leading-snug break-words text-ink group-hover:text-brand sm:text-xl">{c.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
