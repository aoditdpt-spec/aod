import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { artistJoinMessage, categories, hero } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MetInPerson } from "@/components/ui/MetInPerson";
import { whatsappUrl } from "@/lib/whatsapp";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { HeroDemo, HeroGlow, HeroHeadline } from "./HeroMotion";

// Large dark rounded card: animated headline, the two main actions, popular services,
// and (on large screens) an animated walk-through of a booking.
export function Hero() {
  return (
    <Container className="pt-8">
      <section className="relative overflow-hidden rounded-[1.5rem] bg-night px-6 py-12 sm:px-16 sm:py-20">
        <HeroGlow />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-apricot">
            <ScrambleText text={hero.eyebrow} delay={0.1} />
          </p>
          <HeroHeadline />
          <p className="mt-6 max-w-[35rem] text-base text-white/90 sm:text-xl sm:leading-snug">{hero.subtitle}</p>
          <div className="mt-6">
            <MetInPerson variant="inline" dark />
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link href="/book" className={buttonClasses("primary", "lg", "sm:min-w-[12.5rem]")}>
              {hero.primaryCta}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link href="/#categories" className={buttonClasses("ghost-light", "lg", "sm:min-w-[12.5rem]")}>
              {hero.secondaryCta}
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <span className="text-sm text-white/60">Popular:</span>
            {hero.chips.map((chip) => {
              const cat = categories.find((c) => c.services.some((s) => s.name === chip));
              return (
                <Link
                  key={chip}
                  href={`/categories/${cat?.slug ?? ""}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/40 px-3 py-1 text-sm text-white hover:border-white hover:bg-white/10"
                >
                  {chip}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              );
            })}
          </div>

          <p className="mt-10 text-sm text-white/70">
            Are you an artist?{" "}
            <a
              href={whatsappUrl(artistJoinMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white underline underline-offset-4 hover:text-apricot"
            >
              Join AOD on WhatsApp
            </a>
          </p>
        </div>
        <div className="hidden lg:block">
          <HeroDemo />
        </div>
        </div>
      </section>
    </Container>
  );
}
