import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MatchQuiz } from "./MatchQuiz";

// "Not sure? Get matches" — intro on the left, three-question card on the right.
export function GetMatched() {
  return (
    <Container className="py-20">
      <section id="get-matched" className="grid scroll-mt-24 items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <div>
          <p className="flex items-center gap-3 text-lg text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach">
              <Sparkles className="h-4 w-4 text-brand" aria-hidden />
            </span>
            Free curated matching
          </p>
          <h2 className="mt-6 text-4xl font-normal leading-[1.1] sm:text-5xl">Not sure who to book?</h2>
          <p className="mt-6 max-w-sm text-body">
            Tell us your need — event type, date, details — takes 2 minutes. We&apos;ll send 3 curated matches.
          </p>
        </div>
        <MatchQuiz />
      </section>
    </Container>
  );
}
