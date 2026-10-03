import { features } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";

// "Book with confidence": six promises in a 3 × 2 grid. Cards arrive in a wave and tilt under the pointer.
export function Features() {
  return (
    <Container className="py-16">
      <section>
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">Every booking includes</p>
          <h2 className="mt-3 text-3xl font-normal sm:text-[2.5rem]">Book with confidence</h2>
        </Reveal>
        <StaggerList className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <TiltCard className="group flex gap-4 rounded-card border border-line bg-white p-6 transition-colors hover:border-brand/40">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-peach/60 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon name={f.icon} className="h-5 w-5 text-brand" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-lg font-medium">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.text}</p>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>
    </Container>
  );
}
