import { BadgeCheck } from "lucide-react";
import { business, stats } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { FlipStat, OdometerStat, RatingStat, ZeroStat } from "@/components/motion/StatCounters";

// Each stat animates differently (odometer, rating fill, split-flap, draining meter).
// The real values are in the server HTML; the animation plays when scrolled into view.
const counters = {
  odometer: OdometerStat,
  rating: RatingStat,
  flip: FlipStat,
  zero: ZeroStat,
};

export function Stats() {
  return (
    <Container className="py-16">
      <Reveal>
        <h2 className="text-center text-3xl font-normal sm:text-[2.5rem]">Trusted across Gujarat</h2>
      </Reveal>
      <StaggerList className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => {
          const Counter = counters[s.animation];
          return (
            <StaggerItem
              key={s.label}
              className="group relative flex flex-col items-center overflow-hidden rounded-card border border-line px-4 pb-6 pt-8 text-center transition-colors hover:border-brand/50"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-bright to-tangerine transition-transform duration-500 group-hover:scale-x-100"
              />
              {/* Fixed height keeps all four labels on one line whatever the animation adds. */}
              <div className="flex h-[5.5rem] items-start justify-center text-4xl font-medium text-ink sm:text-5xl">
                <Counter value={s.value} />
              </div>
              <p className="text-sm text-muted">{s.label}</p>
            </StaggerItem>
          );
        })}
      </StaggerList>
      <Reveal delay={0.3}>
        <p className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-peach px-4 py-2 text-sm font-medium text-ink">
          <BadgeCheck className="h-4 w-4 text-brand" aria-hidden />
          {business.caseStudy.label}
        </p>
      </Reveal>
    </Container>
  );
}
