import { Phone, Sparkles } from "lucide-react";
import { brand, getMatched, howItWorks } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { whatsappUrl } from "@/lib/whatsapp";
import { MatchQuiz } from "./MatchQuiz";

// "Not sure? Get matches" — the intro, what happens next and a way to talk on the left
// (it stays in view on laptops), the three questions one at a time on the right.
export function GetMatched() {
  return (
    <Container className="py-20">
      <section id="get-matched" className="grid scroll-mt-24 items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-24">
          <p className="flex items-center gap-3 text-lg text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach">
              <Sparkles className="h-4 w-4 text-brand" aria-hidden />
            </span>
            {getMatched.eyebrow}
          </p>
          <h2 className="mt-6 text-4xl font-normal leading-[1.1] sm:text-5xl">{getMatched.title}</h2>
          <p className="mt-6 max-w-md text-body">{getMatched.text}</p>
          <div className="mt-6">
            <VerifiedArtists variant="inline" />
          </div>

          {/* Laptops only: fills the left side beside the questions; on phones the questions come first. */}
          <div className="hidden lg:block">
            <h3 className="mt-10 text-xs font-medium uppercase tracking-[0.15em] text-brand">{getMatched.nextTitle}</h3>
            <ol className="mt-5 space-y-5">
              {howItWorks.clients.map((s, i) => (
                <li key={s.title} className="relative flex gap-4">
                  {/* A thin line joins the numbers into a timeline. */}
                  {i < howItWorks.clients.length - 1 && <span aria-hidden className="absolute left-4 top-9 h-[calc(100%-1rem)] w-px bg-line" />}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-peach text-sm font-medium text-brand-hover">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-medium text-ink">{s.title}</span>
                    <span className="block text-sm text-muted">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-10 max-w-md rounded-card border border-line bg-wash p-5">
              <p className="font-medium text-ink">{getMatched.talkTitle}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <a href={brand.phoneHref} className="inline-flex items-center gap-2 font-medium text-brand hover:text-brand-hover">
                  <Phone className="h-4 w-4" aria-hidden /> {brand.phoneDisplay}
                </a>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-brand hover:text-brand-hover"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
        <MatchQuiz />
      </section>
    </Container>
  );
}
