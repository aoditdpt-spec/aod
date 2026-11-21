import Image from "next/image";
import { partner } from "@/data/home";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";
import { Reveal } from "@/components/motion/Reveal";
import { GateFilm } from "./GateFilm";

// Real AOD work: the GATE 2026 expo, as on aod.co.in. The heading on one line (from laptops up),
// then one card with the film and, under it, the expo's logo and a caption, then the GCCI line in
// a card of its own. Narrower than the page on laptops, centred.
export function Partner() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <Reveal className="mx-auto max-w-4xl">
          <p className="text-sm text-muted">{partner.label}</p>
          <h2 className="mt-4 text-4xl sm:text-5xl lg:whitespace-nowrap">
            <Dots>{partner.title}</Dots>
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto mt-10 max-w-4xl">
          <figure className="overflow-hidden rounded-2xl border border-line">
            <GateFilm label={partner.film} />
            <figcaption className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
              <Image src={partner.logo.src} alt={partner.logo.alt} width={439} height={160} className="h-10 w-auto shrink-0 sm:h-14" />
              <span className="min-w-0">
                <span className="block font-medium">{partner.filmTitle}</span>
                <span className="mt-0.5 block text-sm text-muted sm:text-[15px]">{partner.filmText}</span>
              </span>
            </figcaption>
          </figure>
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line p-5 sm:p-6">
            <Image src={partner.trustLogo.src} alt={partner.trustLogo.alt} width={220} height={220} className="h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14" />
            <p className="font-medium sm:text-lg">{partner.trust}</p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
