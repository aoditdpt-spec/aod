import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { NewsletterAction } from "@/components/newsletter/NewsletterAction";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

// Opened from the link in the newsletter's emails (?t=…), as on aod.co.in.
export default function Page() {
  return (
    <main className="flex-1">
      <Container className="pb-24 pt-8 sm:pt-10 lg:pb-32 lg:pt-14">
        <NewsletterAction mode="unsubscribe" />
      </Container>
    </main>
  );
}
