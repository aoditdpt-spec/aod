import Image from "next/image";
import { portfolio } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { PortfolioVideo } from "./PortfolioVideo";

// The film's files: public/media/, or the bucket / CDN at NEXT_PUBLIC_MEDIA_URL (as in Hero.tsx).
const mediaBase = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, "") || "/media";

// AOD's own expo coverage (GATE 2026), from the portfolio section on expos.aod.co.in, as the owner
// laid it out: a centred heading, the film with its caption, and the GCCI line under it, in one
// centred column. (The "AOD portfolio" label, the intro line and the "What we shot there" list were
// removed on request.)
export function PortfolioSection() {
  const { film } = portfolio;
  return (
    <Container className="py-16">
      <section aria-labelledby="portfolio-title" className="mx-auto max-w-4xl">
        <Reveal>
          <h2 id="portfolio-title" className="text-center text-2xl font-bold sm:text-3xl">
            {portfolio.title}
          </h2>
        </Reveal>

        <Reveal className="mt-8">
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

        <Reveal delay={0.1} className="mt-6">
          <p className="flex items-center gap-3 rounded-card border border-line bg-white p-5 font-semibold text-ink">
            <Image src={portfolio.trustLogo} alt="" width={44} height={44} className="h-11 w-11 shrink-0" />
            {portfolio.trust}
          </p>
        </Reveal>
      </section>
    </Container>
  );
}
