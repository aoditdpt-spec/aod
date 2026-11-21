import type { Metadata } from "next";
import { aboutPage as p } from "@/data/pages";
import { brand, categories, cities } from "@/data/site";
import { Container } from "@/components/ui/Container";
import { PageHeader, Points } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "About Us", description: p.meta };

// About Us, with aod.co.in's content: who AOD is (and three facts), its vision and what it stands
// for. No contact block or buttons: the navbar, the phones' bottom bar and the footer carry them.
const facts = [`Based In ${brand.city}, ${brand.region}`, `${categories.length} Talent Categories`, `Serving ${cities.join(", ")}`];

export default function AboutPage() {
  return (
    <main className="flex-1">
      <PageHeader label={p.label} title={p.title} />
      <Container className="pb-20 lg:pb-28">
        <p className="max-w-3xl text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">{p.intro}</p>
        <ul className="mt-12 grid gap-y-4 border-t border-ink pt-6 sm:grid-cols-3 sm:gap-x-8">
          {facts.map((f) => (
            <li key={f} className="text-lg font-medium">
              {f}
            </li>
          ))}
        </ul>
      </Container>

      <Section title={p.storyTitle}>
        <div className="max-w-3xl space-y-5 text-lg text-ink/80">
          {p.story.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      </Section>

      <Container>
        <h2 className="text-3xl sm:text-4xl">{p.valuesTitle}</h2>
      </Container>
      <div className="mt-8">
        <Points items={p.values} />
      </div>
    </main>
  );
}
