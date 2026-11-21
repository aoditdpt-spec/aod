import type { Metadata } from "next";
import { businessPage as p } from "@/data/pages";
import { PageHeader, Points } from "@/components/ui/PageHeader";
import { BusinessPortal } from "@/components/business/BusinessPortal";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = { title: "For Business", description: p.meta };

// AOD For Business, as on aod.co.in: companies book signed in. Signed out: the heading, the Sign In
// / Create Account card, the three points, then why procurement teams like AOD (from aod.co.in);
// signed in: the company's portal.
export default function BusinessPage() {
  return (
    <main className="flex-1">
      <BusinessPortal header={<PageHeader label={p.label} title={p.title} />} after={
          <>
            <Points items={p.points} />
            <Section title={p.whyTitle}>
              <ul className="max-w-3xl border-t border-line">
                {p.why.map((t) => (
                  <li key={t} className="border-b border-line py-3 text-lg">
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <h3 className="text-2xl">{p.caseStudy.title}</h3>
                <p className="mt-2 text-muted">{p.caseStudy.text}</p>
              </div>
            </Section>
          </>
        } />
    </main>
  );
}
