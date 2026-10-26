import type { Metadata } from "next";
import { BadgeCheck, Building2, Handshake, LayoutGrid, Mail, MapPin, Phone, ShieldCheck, Tag } from "lucide-react";
import { about, brand, categoryCountLabel, cities } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/ui/Icon";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { BrandStrip } from "@/components/home/BrandStrip";
import { FinalCta } from "@/components/home/FinalCta";
import { Reveal, StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { linkCardDark, linkText, linkTitle, tiltText, tiltTitle, tiltZoom } from "@/components/ui/cards";
import { TiltCard } from "@/components/motion/TiltCard";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Artists on Demand is a premier artist booking platform: book verified, professional photographers, videographers, hosts, models, musicians and more, just as you book a cab.",
  alternates: { canonical: "/about" },
};

const valueIcons = [BadgeCheck, Tag, ShieldCheck, Handshake];

const facts = [
  { icon: MapPin, label: `Based in ${brand.city}, Gujarat` },
  { icon: LayoutGrid, label: `${categoryCountLabel} talent categories` },
  { icon: Building2, label: `Serving ${cities.join(", ")}` },
];

const contacts = [
  { icon: <Phone className="h-5 w-5" aria-hidden />, label: "Call", value: brand.phoneDisplay, href: brand.phoneHref },
  { icon: <Mail className="h-5 w-5" aria-hidden />, label: "Email", value: brand.email, href: `mailto:${brand.email}` },
  { icon: <WhatsAppIcon />, label: "WhatsApp", value: "Chat with the team", href: whatsappUrl() },
  { icon: <InstagramIcon />, label: "Instagram", value: brand.instagramHandle, href: brand.instagramUrl },
  ...(brand.linkedinUrl ? [{ icon: <LinkedInIcon />, label: "LinkedIn", value: brand.fullName, href: brand.linkedinUrl }] : []),
  // Where AOD is: the city only (there's no street address to show).
  { icon: <MapPin className="h-5 w-5" aria-hidden />, label: "Based in", value: `${brand.city}, ${brand.region}`, href: "" },
];

export default function AboutPage() {
  return (
    <>
      {/* Intro */}
      <Container className="pt-8">
        <section
          className="rounded-[1.5rem] bg-wash px-6 py-12 sm:px-16 sm:py-20"
          style={{ backgroundImage: "radial-gradient(color-mix(in srgb, var(--color-brand) 12%, transparent) 1px, transparent 1.4px)", backgroundSize: "22px 22px" }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">{about.eyebrow}</p>
          <h1 className="mt-4 text-5xl font-semibold leading-[0.95] tracking-tight !text-brand sm:text-7xl">{about.title}</h1>
          <p className="mt-6 max-w-3xl text-lg text-body sm:text-xl sm:leading-snug">{about.intro}</p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {facts.map(({ icon: I, label }) => (
              <li key={label} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm">
                <I className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </section>
      </Container>

      {/* Story */}
      <Container className="py-16">
        <Reveal className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <h2 className="text-3xl font-normal sm:text-[2.5rem] sm:leading-tight">{about.storyTitle}</h2>
          <div className="space-y-5 text-lg text-body">
            {about.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
      </Container>

      {/* Values */}
      <Container className="pb-16">
        <Reveal>
          <h2 className="text-3xl font-normal sm:text-[2.5rem]">{about.valuesTitle}</h2>
        </Reveal>
        <StaggerList className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {about.values.map((v, i) => {
            const I = valueIcons[i];
            return (
              <StaggerItem key={v.title}>
                <TiltCard className={`rounded-[1.25rem] border border-line bg-white p-7`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-peach/60 ${tiltZoom}`}>
                    <I className="h-5 w-5 text-brand" strokeWidth={1.75} aria-hidden />
                  </span>
                  <h3 className={`mt-6 text-xl font-bold ${tiltTitle}`}>{v.title}</h3>
                  <p className={`mt-2 text-body ${tiltText}`}>{v.text}</p>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </Container>

      {/* Brands */}
      <Container>
        <BrandStrip />
      </Container>

      {/* Team */}
      <Container className="py-16">
        <Reveal>
          <h2 className="text-3xl font-normal sm:text-[2.5rem]">{about.teamTitle}</h2>
        </Reveal>
        <StaggerList className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {about.team.map((m) => (
            <StaggerItem key={m.name}>
              <TiltCard className={`rounded-[1.25rem] border border-line bg-white p-3`}>
                <PhotoPlaceholder icon="user" label={m.name} className="aspect-square [&_svg]:transition-transform [&_svg]:duration-300 group-hover/tilt:[&_svg]:scale-125" />
                <div className="px-3 pb-2 pt-4">
                  <h3 className={`text-lg font-bold ${tiltTitle}`}>{m.name}</h3>
                  <p className={`text-sm text-muted ${tiltText}`}>{m.role}</p>
                </div>
              </TiltCard>
            </StaggerItem>
          ))}
        </StaggerList>
      </Container>

      {/* Contact */}
      <Container>
        <section className="rounded-[1.5rem] bg-night px-6 py-12 sm:px-16 sm:py-16">
          <h2 className="text-3xl font-medium !text-white sm:text-[2.5rem]">{about.contactTitle}</h2>
          <p className="mt-3 text-lg text-white/80">{about.contactText}</p>
          <StaggerList className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((c) => {
              const external = c.href.startsWith("http");
              if (!c.href)
                return (
                  <StaggerItem key={c.label}>
                    <div className="flex h-full items-center gap-4 rounded-card bg-white/[0.04] p-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tangerine/15 text-tangerine">{c.icon}</span>
                      <span className="min-w-0">
                        <span className="block text-sm text-white/60">{c.label}</span>
                        <span className="block truncate font-medium text-white">{c.value}</span>
                      </span>
                    </div>
                  </StaggerItem>
                );
              return (
                <StaggerItem key={c.label}>
                  <a
                    href={c.href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`flex h-full items-center gap-4 rounded-card bg-white/[0.04] p-5 outline-none focus-visible:ring-2 focus-visible:ring-apricot ${linkCardDark}`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tangerine/15 text-tangerine">{c.icon}</span>
                    <span className="min-w-0">
                      <span className={`block text-sm text-white/60 ${linkText}`}>{c.label}</span>
                      <span className={`block truncate font-medium text-white ${linkTitle} group-hover:text-tangerine`}>{c.value}</span>
                    </span>
                  </a>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </section>
      </Container>

      <FinalCta />
    </>
  );
}
