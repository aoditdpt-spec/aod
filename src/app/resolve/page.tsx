import type { Metadata } from "next";
import { disputePage as p } from "@/data/pages";
import { caseForm } from "@/data/dispute-form";
import { brand } from "@/data/site";
import { Container } from "@/components/ui/Container";
import Link from "@/components/ui/AppLink";
import { PageHeader, Points } from "@/components/ui/PageHeader";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { Section, Steps } from "@/components/ui/Section";

export const metadata: Metadata = { title: "Dispute Desk", description: p.meta };

// The Dispute Desk, with aod.co.in's content (resolve.aod.co.in): what it's for, AOD's three
// promises, how a dispute is settled, the two kinds of case (booked through AOD or outside it),
// who can raise one and about what, and how to escalate, with Raise A Dispute (/resolve/new)
// and Track A Dispute (/resolve/track). Also as there (2026-11-21): a picture of what tracking
// a case looks like beside the intro, a Raise button under each kind of case (?aod=yes|no) and each
// side (?role=…), and the grievance officer's details. Its own header and footer: (desk)/layout.tsx.
export default function DisputeDeskPage() {
  const { aod, outside } = p.paths;
  const issueRows = Math.max(...p.roles.map((r) => r.issues.length));
  return (
    <main className="flex-1">
      <PageHeader label={p.label} title={p.title}>
        <Link href="/resolve/new" className={primaryButton}>
          Raise A Dispute
        </Link>
        <Link href="/resolve/track" className={secondaryButton}>
          Track A Dispute
        </Link>
      </PageHeader>
      <Container className="grid items-start gap-10 pb-16 lg:grid-cols-[1.3fr_1fr] lg:gap-16 lg:pb-20">
        <div>
          <p className="max-w-3xl text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">{p.lead}</p>
          <p className="mt-6 max-w-3xl text-lg text-ink/80">{p.intro}</p>
          <p className="mt-6 max-w-3xl text-muted">{p.notSupport}</p>
        </div>
        {/* What tracking a case looks like (a picture, not a real case). */}
        <div aria-hidden className="rounded-2xl border border-line bg-wash p-6 sm:p-8">
          <p className="text-sm text-muted">{p.previewLabel}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xl font-medium">Case DC-1001</p>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-medium">{caseForm.steps[1].label}</span>
          </div>
          <ol className="mt-6 space-y-5">
            {caseForm.steps.map((s, i) => (
              <li key={s.id} className="relative flex gap-4">
                {i < caseForm.steps.length - 1 && <span className={`absolute left-[11px] top-7 h-[calc(100%-0.5rem)] w-px ${i < 1 ? "bg-brand" : "bg-line"}`} />}
                <span className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-medium ${i < 1 ? "bg-brand text-paper" : i === 1 ? "border-2 border-brand bg-paper text-brand" : "border border-line bg-paper text-muted"}`}>{i + 1}</span>
                <span>
                  <span className={`block text-sm font-medium ${i <= 1 ? "text-ink" : "text-muted"}`}>{s.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Container>

      <Points items={p.promises} className="pb-20 lg:pb-28" />

      <Section title={p.stepsTitle}>
        <Steps items={p.steps} />
      </Section>

      <Section title={p.pathsTitle}>
        <p className="-mt-4 mb-10 max-w-2xl text-ink/80">{p.pathsText}</p>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-2xl">{aod.title}</h3>
            <p className="mt-3 text-ink/80">{aod.text}</p>
            <ol className="mt-6 border-t border-line">
              {p.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[32px_1fr] border-b border-line py-3">
                  <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.title}</span>
                </li>
              ))}
            </ol>
            <Link href="/resolve/new?aod=yes" className={`${primaryButton} mt-8`}>
              {p.paths.aod.cta}
            </Link>
          </div>
          <div>
            <h3 className="text-2xl">{outside.title}</h3>
            <p className="mt-3 text-ink/80">{outside.text}</p>
            <ol className="mt-6 border-t border-line">
              {outside.steps.map((s, i) => (
                <li key={s.title} className="grid grid-cols-[32px_1fr] border-b border-line py-3">
                  <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    {s.title}
                    <span className="mt-1 block text-sm text-muted">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <h4 className="font-medium">{outside.canTitle}</h4>
                <ul className="mt-3 space-y-2 text-sm text-ink/80">
                  {outside.can.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium">{outside.cantTitle}</h4>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {outside.cant.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Link href="/resolve/new?aod=no" className={`${secondaryButton} mt-8`}>
              {p.paths.outside.cta}
            </Link>
          </div>
        </div>
      </Section>

      <Section title={p.whoTitle}>
        <p className="max-w-3xl text-lg text-ink/80">{p.whoText}</p>
        {/* The three sides line up row by row from tablets up (subgrid): the headings, the lines
            under them, every issue and the links share rows across the columns, however long
            each one is. A side with fewer issues leaves its last rows empty. */}
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-x-10 md:gap-y-0" style={{ "--issues": issueRows, "--rows": issueRows + 3 } as React.CSSProperties}>
          {p.roles.map((r) => (
            <div key={r.title} className="md:grid md:grid-rows-subgrid md:[grid-row:span_var(--rows)]">
              <h3 className="text-2xl">{r.title}</h3>
              <p className="mt-2 text-muted">{r.text}</p>
              <ul className="mt-5 border-t border-line md:grid md:grid-rows-subgrid md:[grid-row:span_var(--issues)]">
                {r.issues.map((i) => (
                  <li key={i} className="flex items-center border-b border-line py-2.5 text-[15px]">
                    {i}
                  </li>
                ))}
              </ul>
              <Link href={`/resolve/new?role=${r.id}`} className="mt-5 self-start justify-self-start text-sm font-medium text-ink underline underline-offset-4 hover:text-brand">
                Raise A Dispute
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section title={p.escalateTitle}>
        <p className="max-w-3xl text-lg text-ink/80">{p.escalateText}</p>
        <dl className="mt-6 max-w-xl border-t border-ink">
          <div className="flex gap-4 border-b border-line py-3">
            <dt className="w-36 shrink-0 text-muted">{p.officerLabel}</dt>
            <dd className="space-y-1">
              <a href={`mailto:${brand.email}`} className="block">
                {brand.email}
              </a>
              <a href={brand.phoneHref} className="block">
                {brand.phoneDisplay}
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-8 max-w-3xl text-muted">{p.furtherHelp}</p>
      </Section>
    </main>
  );
}
