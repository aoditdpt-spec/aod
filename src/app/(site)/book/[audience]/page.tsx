import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { bookingChoice, type Audience } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { MatchQuiz } from "@/components/home/MatchQuiz";

const audiences: Audience[] = ["personal", "business"];

function isAudience(value: string): value is Audience {
  return (audiences as string[]).includes(value);
}

export function generateStaticParams() {
  return audiences.map((audience) => ({ audience }));
}

export async function generateMetadata({ params }: PageProps<"/book/[audience]">): Promise<Metadata> {
  const { audience } = await params;
  if (!isAudience(audience)) return {};
  return {
    title: `Book an artist — ${bookingChoice[audience].label.toLowerCase()}`,
    description: bookingChoice[audience].text,
    alternates: { canonical: `/book/${audience}` },
  };
}

// The three-question booking flow, after choosing personal or business on /book.
export default async function BookAudiencePage({ params }: PageProps<"/book/[audience]">) {
  const { audience } = await params;
  if (!isAudience(audience)) notFound();
  const choice = bookingChoice[audience];

  return (
    <Container className="py-12 sm:py-16">
      <Link href="/book" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Change booking type
      </Link>
      <div className="mt-6 grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">{choice.label}</p>
          <h1 className="mt-3 text-3xl font-normal leading-[1.1] sm:text-4xl">Tell us what you need</h1>
          <p className="mt-5 max-w-sm text-body">
            {choice.text} Three quick questions — then we&apos;ll send curated matches on WhatsApp.
          </p>
          <div className="mt-8 max-w-md">
            <VerifiedArtists variant="card" />
          </div>
        </div>
        <MatchQuiz audience={audience} />
      </div>
    </Container>
  );
}
