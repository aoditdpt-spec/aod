import type { Metadata } from "next";
import { newsletter } from "@/content/blog";
import { Container } from "@/components/ui/Container";
import { NewsletterLinkAction } from "@/components/newsletter/NewsletterLinkAction";

export const metadata: Metadata = {
  title: newsletter.unsubscribePageTitle,
  robots: { index: false, follow: false },
};

// Opened from the "Unsubscribe" link at the bottom of every newsletter (?t=…). Mail apps' own
// one-click Unsubscribe button goes to src/app/api/newsletter/unsubscribe instead.
export default async function UnsubscribePage({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  const t = (await searchParams).t;
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl rounded-card border border-line bg-white p-8 sm:p-10">
        <h1 className="text-3xl font-medium">{newsletter.unsubscribePageTitle}</h1>
        <p className="mt-3 text-body">{newsletter.unsubscribePageText}</p>
        <NewsletterLinkAction mode="unsubscribe" token={typeof t === "string" ? t : ""} />
      </div>
    </Container>
  );
}
