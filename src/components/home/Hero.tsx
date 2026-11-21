import { hero, promises } from "@/data/home";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";
import { HeroMosaic } from "./HeroMosaic";
import { ScrambleWord } from "@/components/motion/ScrambleWord";
import { Reveal } from "@/components/motion/Reveal";

// The first screen: "Book a <artist>" (the kind of artist scrambles from one to the next) with
// Our Promises beside it (under it on phones), then the artists at work in an uneven photo grid
// (HeroMosaic). The promises moved here from their own section on request (2026-11-19).
export function Hero() {
  return (
    <section>
      <Container className="pb-4 pt-8 sm:pt-10 lg:pt-14">
        {/* Laptops: the heading and the promises side by side as one band of equal height (the
            heading centred against the promises' card). */}
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-stretch lg:gap-10">
          {/* Bigger than the promises at every size (on request). On laptops its two lines are as
              tall as the promises' card (2026-11-21): 5.3rem at line-height 1.1 is the card's
              height, and 12cqw keeps the longest word ("Cinematographer.", 8.2em wide) inside its
              column on narrower laptops. */}
          <div className="flex flex-col justify-center @container">
            <h1 aria-label={hero.label} className="overflow-x-clip text-[min(10.5vw,2.5rem)] sm:text-6xl lg:text-[min(5.3rem,12cqw)] lg:leading-[1.1]">
              {/* The word sits on its own line, so the heading never reflows as it changes. */}
              <ScrambleWord lead={hero.before} words={hero.words} stop className="block whitespace-nowrap" />
            </h1>
          </div>
          {/* Our Promises, made to stand out (on request, 2026-11-20): a tinted card with no rules
              between the lines, each promise large and ending in the logo's orange full stop. */}
          {/* Each promise on one line: on phones the text scales with the screen's width. */}
          {/* "Our Promises" bigger (2026-11-21), the promises one size below it. */}
          <Reveal delay={0.05} className="lg:w-[24.5rem]">
            <div className="h-full rounded-2xl bg-wash p-5 sm:p-6">
              <p className="text-[min(5.3vw,1.5rem)] font-semibold leading-8 tracking-tight text-brand sm:text-3xl lg:text-2xl">{promises.title}</p>
              <ul className="mt-3 space-y-2 sm:space-y-2.5">
                {promises.items.map((t) => (
                  <li key={t} className="whitespace-nowrap text-[min(4.3vw,1.25rem)] font-medium leading-tight tracking-tight sm:text-2xl lg:text-xl">
                    <Dots>{`${t}.`}</Dots>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="mt-8 lg:mt-12">
          <HeroMosaic />
        </Reveal>
      </Container>
    </section>
  );
}
