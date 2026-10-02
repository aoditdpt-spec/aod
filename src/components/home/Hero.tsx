import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { artistJoinMessage, categories, hero } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MetInPerson } from "@/components/ui/MetInPerson";
import { whatsappUrl } from "@/lib/whatsapp";

// Large dark rounded card: two big headline lines, the two main actions and popular services.
export function Hero() {
  return (
    <Container className="pt-8">
      <section className="relative overflow-hidden rounded-[1.5rem] bg-night px-6 py-12 sm:px-16 sm:py-20">
        {/* Decorative glow on the right; replace with a real event photo when available. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-1/2 hidden h-[35rem] w-[35rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.35)_0%,rgba(249,115,22,0)_65%)] lg:block"
        />
        <div className="relative">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-apricot">{hero.eyebrow}</p>
          <h1 className="mt-5 max-w-[56rem] text-4xl font-medium leading-[1.05] !text-white sm:text-6xl">
            {hero.title[0].map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            {hero.title[1].map((line, i) => (
              <span key={line} className={`block text-apricot ${i === 0 ? "mt-3" : ""}`}>
                {line}
              </span>
            ))}
          </h1>
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
      </section>
    </Container>
  );
}
