import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { categories } from "@/data/site";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";
import { BookForm } from "@/components/book/BookForm";

// One page per category, all built ahead of time (an unknown slug shows the 404).
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = categories.find((x) => x.slug === slug);
  return c ? { title: c.name, description: `Book ${c.name.toLowerCase()} in Ahmedabad and across Gujarat: ${c.blurb}.` } : {};
}

// A category: its name, one line about the work, and the booking questions with the category
// already picked (as on aod.co.in; no booking button: Get Your Artist is in the navbar). No list of services or
// sub-categories (removed on request, 2026-11-18).
// The page's frame is the same for every category; the part that depends on the address sits
// inside <Suspense>, as partial prefetching asks. Every category is built ahead of time, so its
// HTML already holds the full page.
export default function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  return (
    <main className="flex-1">
      <Suspense>
        <Category params={params} />
      </Suspense>
    </main>
  );
}

async function Category({ params }: { params: PageProps<"/categories/[slug]">["params"] }) {
  const { slug } = await params;
  const c = categories.find((x) => x.slug === slug);
  if (!c) notFound();

  return (
    <>
      <PageHeader label="Category" title={c.name} sub={c.blurb} />
      {/* The booking questions with this category already picked, as on aod.co.in. */}
      <Container className="pb-24 lg:pb-32">
        <section id="book" className="scroll-mt-24 border-t border-line pt-10">
          <h2 className="text-3xl sm:text-4xl">
            <Dots>{`Book ${c.name}.`}</Dots>
          </h2>
          <div className="mt-8">
            <BookForm presetCategory={c.slug} />
          </div>
        </section>
      </Container>
    </>
  );
}
