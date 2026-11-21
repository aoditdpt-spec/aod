import type { LegalDoc } from "@/data/legal";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

// A policy page: the title, a "Draft" label with the date, the intro, then each section.
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main className="flex-1">
      <PageHeader label={`Draft · Updated ${doc.updated}`} title={`${doc.title}.`} />
      <Container className="pb-24 lg:pb-32">
        <div className="max-w-2xl border-t border-ink pt-10">
          <p className="text-lg text-muted">{doc.intro}</p>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="mt-12 scroll-mt-20">
              <h2 className="text-2xl">{s.heading}</h2>
              {s.body.map((b, i) =>
                typeof b === "string" ? (
                  <p key={i} className="mt-3 text-muted">
                    {b}
                  </p>
                ) : (
                  <ul key={i} className="mt-3 list-disc space-y-2 pl-5 text-muted">
                    {b.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}
        </div>
      </Container>
    </main>
  );
}
