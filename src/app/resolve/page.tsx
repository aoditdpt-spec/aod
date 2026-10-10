import Link from "next/link";
import { ArrowRight, Briefcase, CalendarCheck, Clock, FilePlus, Gavel, Palette, Scale, Search, User } from "lucide-react";
import { brand } from "@/content/site";
import { caseSteps, resolution } from "@/content/resolution";
import { buttonClasses } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { whatsappUrl } from "@/lib/whatsapp";

const promiseIcons = [Clock, CalendarCheck, Scale];
const stepIcons = [FilePlus, Search, Gavel, Scale];
const roleIcons = { customer: User, business: Briefcase, artist: Palette };

// The Resolution Centre's front page: what it's for, what AOD promises, how a case runs, who can
// raise one, and how to escalate. All server-rendered.
export default function ResolvePage() {
  const officer = resolution.grievanceOfficer;
  return (
    <>
      {/* Intro, with a picture of what tracking a case looks like. */}
      <section className="border-b border-line bg-wash">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:py-20">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-brand">{resolution.title}</p>
            <h1 className="mt-3 text-4xl font-medium leading-tight text-ink sm:text-5xl">{resolution.tagline}</h1>
            <p className="mt-5 max-w-xl text-lg text-body">{resolution.intro}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/resolve/new" className={buttonClasses("primary", "lg")}>
                Raise a case <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/resolve/track" className={buttonClasses("outline", "lg")}>
                Track a case
              </Link>
            </div>
            <p className="mt-6 flex max-w-xl items-start gap-2 text-sm text-muted">
              <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" />
              <span>
                {resolution.notSupport}{" "}
                <a href={whatsappUrl("Hi AOD, I have a question.")} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
                  Open WhatsApp
                </a>
              </span>
            </p>
          </div>

          <div aria-hidden className="rounded-panel border border-line bg-white p-6 shadow-[0_20px_60px_-30px_rgba(40,28,21,0.35)] sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">What you&apos;ll see</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xl font-medium text-ink">Case RC-1001</p>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">Being looked into</span>
            </div>
            <ol className="mt-6 space-y-5">
              {caseSteps.map((s, i) => (
                <li key={s.id} className="relative flex gap-4">
                  {i < caseSteps.length - 1 && <span className={`absolute left-[0.6875rem] top-7 h-[calc(100%-0.5rem)] w-px ${i < 2 ? "bg-brand" : "bg-line"}`} />}
                  <span
                    className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${i < 2 ? "bg-brand text-white" : i === 2 ? "border-2 border-brand bg-white text-brand" : "border border-line bg-white text-muted"}`}
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className={`block text-sm font-medium ${i <= 2 ? "text-ink" : "text-muted"}`}>{s.label}</span>
                    <span className="mt-0.5 block text-sm text-muted">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* What AOD promises. */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <ul className="grid gap-4 md:grid-cols-3">
          {resolution.promises.map((p, i) => {
            const Icon = promiseIcons[i];
            return (
              <li key={p.title} className="rounded-card border border-line bg-white p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-peach">
                  <Icon className="h-5 w-5 text-brand" aria-hidden />
                </span>
                <h2 className="mt-4 text-lg font-medium text-ink">{p.title}</h2>
                <p className="mt-1.5 text-body">{p.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* How a case runs. */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-medium text-ink">How a case works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {resolution.steps.map((s, i) => {
              const Icon = stepIcons[i];
              return (
                <li key={s.title}>
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-line bg-peach/60">
                    <Icon className="h-6 w-6 text-brand" strokeWidth={1.5} aria-hidden />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-medium text-white">{i + 1}</span>
                  </span>
                  <h3 className="mt-4 text-lg font-medium text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-body">{s.text}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Who can raise a case, and about what. */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-medium text-ink">{resolution.whoTitle}</h2>
        <p className="mt-2 max-w-2xl text-body">{resolution.whoText}</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {resolution.roles.map((r) => {
            const Icon = roleIcons[r.id];
            return (
              <li key={r.id} className="flex flex-col rounded-card border border-line bg-white p-6">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach">
                    <Icon className="h-5 w-5 text-brand" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-medium text-ink">{r.label}</span>
                    <span className="block text-sm text-muted">{r.hint}</span>
                  </span>
                </span>
                <ul className="mt-5 flex-1 space-y-1.5 text-sm text-body">
                  {resolution.issues[r.id].map((issue) => (
                    <li key={issue} className="flex gap-2">
                      <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-brand-bright" />
                      {issue}
                    </li>
                  ))}
                </ul>
                <Link href={`/resolve/new?role=${r.id}`} className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
                  Raise a case <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Escalation. */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-panel bg-night p-8 text-white sm:p-10">
          <h2 className="text-2xl font-medium !text-white sm:text-3xl">{resolution.escalateTitle}</h2>
          <p className="mt-3 max-w-2xl text-white/80">{resolution.escalateText}</p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-white/60">Grievance officer</dt>
              <dd className="mt-1 font-medium">
                {officer.name}, {brand.fullName}
              </dd>
            </div>
            <div>
              <dt className="text-white/60">Email</dt>
              <dd className="mt-1 font-medium">
                <a href={`mailto:${officer.email}`} className="hover:text-apricot">
                  {officer.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-white/60">Phone</dt>
              <dd className="mt-1 font-medium">
                <a href={officer.phoneHref} className="hover:text-apricot">
                  {officer.phone}
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-6 max-w-3xl border-t border-night-line pt-5 text-sm text-white/70">{resolution.furtherHelp}</p>
        </div>
      </section>
    </>
  );
}
