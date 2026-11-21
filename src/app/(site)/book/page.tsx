import type { Metadata } from "next";
import { bookPage as p } from "@/data/pages";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookForm } from "@/components/book/BookForm";

export const metadata: Metadata = { title: "Get Your Artist", description: p.meta };

export default function BookPage() {
  return (
    <main className="flex-1">
      <PageHeader title={p.title} />
      <Container className="pb-24 lg:pb-32">
        <BookForm />
      </Container>
    </main>
  );
}
