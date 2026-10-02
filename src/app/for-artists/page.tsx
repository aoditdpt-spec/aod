import type { Metadata } from "next";
import { BadgeCheck, CalendarCheck, Handshake, IndianRupee, Target } from "lucide-react";
import { artistJoinMessage, categories, forArtists, howItWorks } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon, WhatsAppIcon, type AnyIconName } from "@/components/ui/Icon";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Join as an artist with AOD",
  description:
    "Your talent and potential, put in the right place at the right rate. Join Artists on Demand — zero joining fees, in-person meeting required.",
  alternates: { canonical: "/for-artists" },
};

const whyIcons = [Target, IndianRupee, CalendarCheck, BadgeCheck];
const stepIcons: AnyIconName[] = ["handshake", "camera", "video"];

// Until the online registration system is built, joining sends a WhatsApp message to the AOD team.
const join = whatsappUrl(artistJoinMessage);

export default function ForArtistsPage() {
  return (
    <>
      <Container className="pt-8">
        <section className="relative overflow-hidden rounded-[1.5rem] bg-night px-6 py-12 sm:px-16 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.3)_0%,rgba(249,115,22,0)_65%)] lg:block"
          />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-apricot">{forArtists.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-medium leading-[1.05] text-white sm:text-7xl">
              {forArtists.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/90 sm:text-2xl sm:leading-snug">{forArtists.subtitle}</p>
            <ButtonLink href={join} size="lg" className="mt-10">
              <WhatsAppIcon /> {forArtists.cta}
            </ButtonLink>
            <p className="mt-4 text-sm text-white/70">{forArtists.note}</p>
          </div>
        </section>
      </Container>

      <Container className="py-16">
        <h2 className="text-3xl font-normal sm:text-[40px]">{forArtists.whyTitle}</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {forArtists.why.map((w, i) => {
            const I = whyIcons[i];
            return (
              <li key={w.title} className="rounded-[1.25rem] border border-line p-7">
                <I className="h-9 w-9 text-brand-bright" strokeWidth={1.25} aria-hidden />
                <h3 className="mt-6 text-xl font-normal">{w.title}</h3>
                <p className="mt-2 text-body">{w.text}</p>
              </li>
            );
          })}
        </ul>
      </Container>

      <Container>
        <section className="flex flex-col gap-6 rounded-[1.5rem] bg-peach/50 p-8 sm:flex-row sm:items-center sm:p-12">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white">
            <Handshake className="h-8 w-8 text-brand" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-2xl font-medium sm:text-3xl">{forArtists.meetTitle}</h2>
            <p className="mt-2 max-w-3xl text-body">{forArtists.meetText}</p>
          </div>
          <ButtonLink href={join} variant="outline" className="shrink-0 bg-white">
            Set up a meeting
          </ButtonLink>
        </section>
      </Container>

      <Container className="py-16">
        <section id="verification" className="scroll-mt-24">
          <h2 className="text-3xl font-normal sm:text-[40px]">{forArtists.verificationTitle}</h2>
          <p className="mt-3 max-w-2xl text-body">{forArtists.verificationIntro}</p>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {howItWorks.artists.map((s, i) => (
              <li key={s.title}>
                <PhotoPlaceholder icon={stepIcons[i]} label={s.title} className="aspect-[3/2]" />
                <h3 className="mt-6 text-xl font-normal">
                  <span className="mr-2 text-brand-bright">{i + 1}.</span>
                  {s.title}
                </h3>
                <p className="mt-2 text-body">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </Container>

      <Container className="pb-16">
        <h2 className="text-3xl font-normal sm:text-[40px]">Who we&apos;re onboarding</h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {categories.map((c) => (
            <li key={c.slug} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-ink">
              <Icon name={c.icon} className="h-4 w-4 text-brand-bright" /> {c.name}
            </li>
          ))}
        </ul>
      </Container>

      <Container>
        <section className="rounded-[1.25rem] bg-gradient-to-r from-brand-bright via-brand to-brand-bright px-6 py-14 text-center">
          <h2 className="text-3xl font-medium text-white sm:text-[40px]">{forArtists.ctaTitle}</h2>
          <p className="mt-3 text-lg text-white">{forArtists.ctaText}</p>
          <ButtonLink href={join} variant="white" className="mt-8">
            <WhatsAppIcon /> {forArtists.cta}
          </ButtonLink>
          <p className="mt-4 text-sm text-white/90">{forArtists.ctaNote}</p>
        </section>
      </Container>
    </>
  );
}
