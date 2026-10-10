import { BadgeCheck, Check, Handshake, User } from "lucide-react";
import { categories, stats } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Rating";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { BrandStrip } from "@/components/home/BrandStrip";
import { TiltCard, cardHover, iconHover } from "@/components/motion/TiltCard";

const SHOWN_CATEGORIES = 4;

// The small graphic between a stat's number and its label. Every one is the same height so the cards line up.
function StatVisual({ visual, value }: { visual: (typeof stats)[number]["visual"]; value: string }) {
  switch (visual) {
    case "artists":
      return (
        <span aria-hidden className="flex -space-x-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full bg-peach ring-2 ring-white">
              <User className="h-4 w-4 text-brand" />
            </span>
          ))}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand ring-2 ring-white">
            <BadgeCheck className="h-4 w-4 text-white" />
          </span>
        </span>
      );
    case "stars":
      return <Stars value={Number(value)} />;
    case "categories":
      return (
        <span aria-hidden className="flex gap-1">
          {categories.slice(0, SHOWN_CATEGORIES).map((c) => (
            <span key={c.slug} className="flex h-7 w-7 items-center justify-center rounded-lg bg-wash">
              <Icon name={c.icon} className="h-4 w-4 text-brand" />
            </span>
          ))}
          <span className="flex h-7 items-center justify-center rounded-lg bg-peach px-1.5 text-xs font-medium text-brand-hover">
            +{categories.length - SHOWN_CATEGORIES}
          </span>
        </span>
      );
    case "handshake":
      return (
        <span aria-hidden className="flex h-7 items-center gap-1.5 rounded-full bg-peach px-3 text-brand">
          <Handshake className="h-4 w-4" />
          <Check className="h-4 w-4" />
        </span>
      );
  }
}

// Four numbers in one font, each with a small graphic, rendered on the server so they show without JavaScript.
export function Stats() {
  return (
    <Container className="py-16">
      <Reveal>
        <h2 className="text-center text-2xl font-medium sm:text-3xl">Relied on across Gujarat</h2>
      </Reveal>
      <StaggerList className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <TiltCard className={`flex flex-col items-center rounded-card border border-line bg-white px-4 py-8 text-center ${cardHover}`}>
              <p className="text-4xl font-medium text-ink sm:text-5xl">{s.value}</p>
              <div className={`mt-3 flex h-7 items-center ${iconHover}`}>
                <StatVisual visual={s.visual} value={s.value} />
              </div>
              <p className="mt-3 text-sm text-muted">{s.label}</p>
            </TiltCard>
          </StaggerItem>
        ))}
      </StaggerList>
      <Reveal delay={0.3}>
        <BrandStrip />
      </Reveal>
    </Container>
  );
}
