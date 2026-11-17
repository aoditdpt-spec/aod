import type { Metadata } from "next";
import { newsletter } from "@/content/blog";
import { Container } from "@/components/ui/Container";
import { NewsletterLinkAction } from "@/components/newsletter/NewsletterLinkAction";

export const metadata: Metadata = {
  title: newsletter.confirmPageTitle,
  robots: { index: false, follow: false },
};

// Opened from the link in the newsletter's confirmation email (?t=…).
export default async function ConfirmPage({ searchParams }: PageProps<"/newsletter/confirm">) {
  const t = (await searchParams).t;
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl rounded-card border border-line bg-white p-8 sm:p-10">
        <h1 className="text-3xl font-medium">{newsletter.confirmPageTitle}</h1>
        <p className="mt-3 text-body">{newsletter.confirmPageText}</p>
        <NewsletterLinkAction mode="confirm" token={typeof t === "string" ? t : ""} />
      </div>
    </Container>
  );
}
