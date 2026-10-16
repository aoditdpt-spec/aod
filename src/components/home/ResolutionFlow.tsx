import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { resolution } from "@/content/resolution";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StepFlow } from "@/components/ui/StepFlow";
import { portalHref } from "@/lib/site-url";

// "If something goes wrong": the Resolution Centre's four steps (raise a case, AOD looks into it,
// a decision, escalation), its time promises, and links into it (resolve.aod.co.in). It took the
// place of the homepage's "How it works"; the navbar's "Resolution Centre" link scrolls here.
// Copy in src/content/resolution.ts.
export function ResolutionFlow() {
  return (
    <Container className="py-16">
      <section id="resolution-centre" aria-labelledby="resolution-centre-title" className="scroll-mt-24">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">{resolution.title}</p>
            <h2 id="resolution-centre-title" className="mt-3 text-3xl font-normal sm:text-[2.5rem] sm:leading-tight">
              {resolution.tagline}
            </h2>
            <p className="mt-4 text-body">{resolution.intro}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={portalHref("/resolve/new")} className={buttonClasses("primary", "md")}>
              Raise a case <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href={portalHref("/resolve/track")} className={buttonClasses("outline", "md")}>
              Track a case
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <StepFlow steps={resolution.steps} icons={["file-plus", "search", "gavel", "scale"]} />
        </div>

        <ul className="mt-10 grid gap-3 rounded-card bg-wash p-5 text-ink sm:grid-cols-3">
          {resolution.promises.map((p) => (
            <li key={p.title} className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
              <span>
                <span className="block font-bold">{p.title}</span>
                <span className="mt-0.5 block text-sm text-body">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          {resolution.notSupport}{" "}
          <Link href={portalHref("/resolve")} className="font-medium text-brand underline underline-offset-2">
            More about the Resolution Centre
          </Link>
        </p>
      </section>
    </Container>
  );
}
