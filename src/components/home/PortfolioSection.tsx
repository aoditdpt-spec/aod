import Image from "next/image";
import { Check } from "lucide-react";
import { portfolio } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { PortfolioVideo } from "./PortfolioVideo";

// The film's files: public/media/, or the bucket / CDN at NEXT_PUBLIC_MEDIA_URL (as in Hero.tsx).
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, "") || "/media";

// "AOD portfolio": AOD's own expo coverage (GATE 2026), the same section as on expos.aod.co.in.
// The film on the left with its caption, what was shot there on the right (stacked on phones).
export function PortfolioSection() {
  const { film } = portfolio;
  return (
    <Container className="py-16">
      <section aria-labelledby="portfolio-title">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">{portfolio.eyebrow}</p>
          <h2 id="portfolio-title" className="mt-3 text-3xl font-normal sm:text-[2.5rem]">
            {portfolio.title}
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-body">{portfolio.text}</p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <Reveal>
            <figure className="overflow-hidden rounded-card border border-line bg-white">
              <div className="aspect-video overflow-hidden bg-night">
                <PortfolioVideo base={mediaBase} label={film.label} />
              </div>
              <figcaption className="flex items-center gap-4 px-5 py-4 text-sm text-muted">
                <Image src={film.logo} alt={film.logoAlt} width={110} height={40} className="h-10 w-auto shrink-0" />
                <span>
                  <strong className="block font-bold text-ink">{film.title}</strong>
                  {film.text}
                </span>
              </figcaption>
            </figure>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-card border border-line bg-white p-7">
              <h3 className="text-xl font-bold">{portfolio.shotTitle}</h3>
              <ul className="mt-5 grid gap-3">
                {portfolio.shot.map((line) => (
                  <li key={line} className="flex gap-2.5 text-body">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-6 flex items-center gap-3 border-t border-line pt-5 text-sm text-muted">
                <Image src={portfolio.trustLogo} alt="" width={44} height={44} className="h-11 w-11 shrink-0" />
                {portfolio.trust}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </Container>
  );
}
