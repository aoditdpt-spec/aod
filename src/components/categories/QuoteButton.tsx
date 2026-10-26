"use client";

import { QUOTE_EVENT, type QuoteDetail } from "@/components/home/MatchQuiz";

// A service's "Request a quote" on a category page: scrolls to the booking questions (#book) and
// tells them to start again from fresh with this service (its category picked, and "Something
// else" with the service's name as the occasion). Pressing another service's button starts again
// with that one.
export function QuoteButton({ category, service, className, children }: QuoteDetail & { className: string; children: React.ReactNode }) {
  return (
    <a href="#book" onClick={() => window.dispatchEvent(new CustomEvent<QuoteDetail>(QUOTE_EVENT, { detail: { category, service } }))} className={className}>
      {children}
    </a>
  );
}
