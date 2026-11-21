import type { Metadata } from "next";
import Link from "@/components/ui/AppLink";
import { categoriesPage as p } from "@/data/pages";
import { categories } from "@/data/site";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "All Categories", description: p.meta };

// Every category as one big row: its name and one line, the whole row a link.
export default function CategoriesPage() {
  return (
    <main className="flex-1">
      <PageHeader title={p.title} />
      <Container className="pb-24 lg:pb-32">
        <ul className="border-t border-ink">
          {categories.map((c) => (
            <li key={c.slug} className="border-b border-line">
              <Link
                href={`/categories/${c.slug}`}
                className="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8 lg:py-8"
              >
                <span className="text-3xl font-medium tracking-tight text-ink transition-colors group-hover:text-muted sm:text-4xl">{c.name}</span>
                <span className="text-muted">{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </main>
  );
}
