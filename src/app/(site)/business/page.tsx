import type { Metadata } from "next";
import { BadgeCheck, Briefcase, Check, Hotel, Store } from "lucide-react";
import { brand, business } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { FinalCta } from "@/components/home/FinalCta";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard, cardHover, iconHover } from "@/components/motion/TiltCard";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "AOD for Business",
  description:
    "Creative talent on contract for corporates, hotels, agencies and expos — digital contracts, dedicated account management, guaranteed delivery.",
  alternates: { canonical: "/business" },
};

const segmentIcons = [Hotel, Briefcase, Store];
const enquiry = whatsappUrl("Hi Artists on Demand! I have a business enquiry.");

export default function BusinessPage() {
  return (
    <>
      <Container className="pt-8">
        <section className="rounded-[1.5rem] bg-night px-6 py-12 sm:px-16 sm:py-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-apricot">{business.eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.05] !text-white sm:text-6xl">{business.title}</h1>
          <p className="mt-5 max-w-2xl text-base text-white/90 sm:text-lg">{business.subtitle}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href={enquiry} variant="white" size="lg">
              <WhatsAppIcon /> Talk to us
            </ButtonLink>
            <ButtonLink href={brand.phoneHref} variant="ghost-light" size="lg">
              {brand.phoneDisplay}
            </ButtonLink>
          </div>
        </section>
      </Container>

      <Container className="py-16">
        <h2 className="text-3xl font-normal sm:text-[2.5rem]">Built for recurring creative needs</h2>
        <StaggerList className="mt-8 grid gap-6 md:grid-cols-3">
          {business.segments.map((s, i) => {
            const I = segmentIcons[i];
            return (
              <StaggerItem key={s.title}>
                <TiltCard className={`rounded-[1.25rem] border border-line bg-white p-7 ${cardHover}`}>
                  <I className={`h-9 w-9 text-brand-bright ${iconHover}`} strokeWidth={1.25} aria-hidden />
                  <h3 className="mt-6 text-xl font-normal">{s.title}</h3>
                  <p className="mt-2 text-body">{s.text}</p>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </Container>

      <Container className="pb-4">
        <section className="grid gap-10 rounded-[1.5rem] bg-wash p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-normal sm:text-[2.5rem]">{business.whyTitle}</h2>
            <ul className="mt-8 space-y-4">
              {business.why.map((w) => (
                <li key={w} className="flex gap-3 text-ink">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden /> {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-[1.25rem] bg-white p-8">
            <p className="flex items-center gap-2 text-sm font-medium text-brand">
              <BadgeCheck className="h-5 w-5" aria-hidden /> {business.caseStudy.label}
            </p>
            <p className="mt-4 text-2xl text-ink">{business.caseStudy.text}</p>
            <p className="mt-4 text-sm text-muted">Retainers, multi-day contracts and one-off projects — repeat engagements.</p>
          </div>
        </section>
      </Container>

      <FinalCta title={business.ctaTitle} text={business.ctaText} cta="Email us" href={brand.gmailComposeUrl("Business enquiry")} />
    </>
  );
}
