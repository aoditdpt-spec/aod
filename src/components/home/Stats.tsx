import { BadgeCheck, Check, Smile, User } from "lucide-react";
import { categories, stats } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Rating";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { BrandStrip } from "@/components/home/BrandStrip";
import { TiltCard } from "@/components/motion/TiltCard";
import { tiltText, tiltTitle, tiltZoom } from "@/components/ui/cards";

const SHOWN_CATEGORIES = 4;

// The small graphic between a stat's number and its label. Every one is the same height so the cards line up.
type Stat = { value: string; label: string; visual: "artists" | "stars" | "categories" | "smile" };

function StatVisual({ visual, value }: { visual: Stat["visual"]; value: string }) {
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
    case "smile":
      return (
        <span aria-hidden className="flex h-7 items-center gap-1.5 rounded-full bg-peach px-3 text-brand">
          <Smile className="h-4 w-4" />
          <Check className="h-4 w-4" />
        </span>
      );
  }
}

// A stat's number, graphic and label.
function StatBody({ stat }: { stat: Stat }) {
  return (
    <>
      {/* The numbers in the body font, bold (the owner asked for another font). */}
      <p className={`font-sans text-4xl font-bold text-ink sm:text-5xl ${tiltTitle}`}>{stat.value}</p>
      <div className={`mt-3 flex h-7 items-center ${tiltZoom}`}>
        <StatVisual visual={stat.visual} value={stat.value} />
      </div>
      <p className={`mt-3 text-sm text-muted ${tiltText}`}>{stat.label}</p>
    </>
  );
}

// Four numbers in one font, each with a small graphic, rendered on the server so they show without JavaScript.
export function Stats() {
  return (
    <Container className="py-16">
      <Reveal>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">Relied on across Gujarat</h2>
      </Reveal>
      <StaggerList className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <TiltCard className={`flex flex-col items-center rounded-card border border-line bg-white px-4 py-8 text-center`}>
              <StatBody stat={s} />
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
