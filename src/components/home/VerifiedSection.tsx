import { CalendarCheck, Images, UserCheck } from "lucide-react";
import { verifiedArtists } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard, cardHover, iconHover } from "@/components/motion/TiltCard";

const icons = [Images, UserCheck, CalendarCheck];

// The trust promise: heading and promise, then the three checks every artist passes, laid out
// like "Book with confidence" (cards arrive in a wave and tilt under the pointer).
export function VerifiedSection() {
  return (
    <Container className="py-16">
      <section>
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">{verifiedArtists.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">{verifiedArtists.title}</h2>
          <p className="mt-4 max-w-3xl text-lg text-body">{verifiedArtists.text}</p>
        </Reveal>
        <StaggerList className="mt-10 grid gap-5 sm:grid-cols-3">
          {verifiedArtists.points.map((p, i) => {
            const I = icons[i];
            return (
              <StaggerItem key={p}>
                <TiltCard className={`flex items-center gap-4 rounded-card border border-line bg-white p-6 ${cardHover}`}>
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-peach/60 ${iconHover}`}>
                    <I className="h-5 w-5 text-brand" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className="text-lg font-medium">{p}</h3>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </section>
    </Container>
  );
}
