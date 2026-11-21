import type { Metadata } from "next";
import Link from "@/components/ui/AppLink";
import { artistsPage as p } from "@/data/pages";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section, Steps } from "@/components/ui/Section";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";

export const metadata: Metadata = { title: "For Artists", description: p.meta };

// For artists, with aod.co.in/for-artists's content: why AOD, how artists are verified, and how
// joining works. Joining is through the artist portal only: Apply To Join opens the application,
// Sign In the portal.
export default function ArtistsPage() {
  return (
    <main className="flex-1">
      <PageHeader label={p.label} title={p.title}>
        <Link href="/artists/apply" className={primaryButton}>
          {p.apply}
        </Link>
        <Link href="/artists" className={secondaryButton}>
          {p.signIn}
        </Link>
      </PageHeader>
      <Section title={p.whyTitle}>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {p.why.map((w) => (
            <li key={w.title}>
              <h3 className="text-xl">{w.title}</h3>
              <p className="mt-2 text-muted">{w.text}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={p.verifyTitle}>
        <p className="max-w-3xl text-lg text-ink/80">{p.verifyText}</p>
      </Section>
      <Section title={p.joinTitle}>
        <Steps items={p.steps} />
      </Section>
    </main>
  );
}
