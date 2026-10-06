import Link from "next/link";
import type { LegalDoc } from "@/content/legal";
import { legalDocs } from "@/content/legal";
import { Container } from "@/components/ui/Container";

// Shared layout for the privacy policy, terms and refund policy: title, date, contents, sections.
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[14rem_1fr] lg:gap-14">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">On this page</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-body hover:text-brand">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted">Policies</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {legalDocs.map((d) => (
              <li key={d.slug}>
                <Link href={`/${d.slug}`} aria-current={d.slug === doc.slug ? "page" : undefined} className={d.slug === doc.slug ? "font-medium text-ink" : "text-body hover:text-brand"}>
                  {d.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Draft</span>
            Last updated {doc.updated}
          </p>
          <h1 className="mt-3 text-3xl font-medium sm:text-5xl">{doc.title}</h1>
          <p className="mt-5 text-lg text-body">{doc.intro}</p>

          <div className="mt-10 space-y-10">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-medium sm:text-2xl">
                  <span className="mr-2 text-brand">{i + 1}.</span>
                  {s.heading}
                </h2>
                <div className="mt-3 space-y-3 text-body">
                  {s.body.map((b, j) =>
                    typeof b === "string" ? (
                      <p key={j}>{b}</p>
                    ) : (
                      <ul key={j} className="list-disc space-y-1.5 pl-5 marker:text-brand">
                        {b.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </Container>
  );
}
