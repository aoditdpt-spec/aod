import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { categories, getCategory, guarantees } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import { FinalCta } from "@/components/home/FinalCta";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard, cardHover, iconHover } from "@/components/motion/TiltCard";
import { whatsappUrl } from "@/lib/whatsapp";

// One static page per category, built at deploy time.
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return {};
  return {
    title: `Book ${category.name.toLowerCase()} in Ahmedabad`,
    description: category.description,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const others = categories.filter((c) => c.slug !== category.slug).slice(0, 5);

  return (
    <>
      <Container className="pt-8">
        <section className="rounded-[1.5rem] bg-night px-6 py-12 sm:px-16 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-white/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span className="text-white">{category.name}</span>
          </nav>
          <div className="mt-6 flex items-start gap-5">
            <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-tangerine/15 sm:flex">
              <Icon name={category.icon} className="h-8 w-8 text-tangerine" strokeWidth={1.5} />
            </span>
            <div>
              <h1 className="text-3xl font-medium !text-white sm:text-5xl">{category.name}</h1>
              <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">{category.description}</p>
              <div className="mt-5">
                <VerifiedArtists variant="inline" dark />
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/book" className={buttonClasses("white", "lg")}>
              Get curated matches <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <span className="text-sm text-white/70">Verified professionals · transparent quotes · no negotiation</span>
          </div>
        </section>
      </Container>

      <Container className="py-16">
        <h2 className="text-3xl font-normal sm:text-[2.5rem]">What you can book</h2>
        <p className="mt-3 text-body">Pick a service and ask for a quote — we&apos;ll reply with curated matches.</p>
        <StaggerList className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.services.map((s) => (
            <StaggerItem key={s.name}>
            <TiltCard className={`flex flex-col rounded-[1.25rem] border border-line bg-white p-6 ${cardHover}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium">{s.name}</h3>
                {s.popular && (
                  <span className="rounded-full bg-peach px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-ink">
                    Popular
                  </span>
                )}
              </div>
              <div className="mt-2">
                <Rating rating={s.rating} count={s.bookings} unit="bookings" />
              </div>
              <a
                href={whatsappUrl(`Hi Artists on Demand! I'd like a quote for: ${s.name} (${category.name}).`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("outline", "md", "mt-6")}
              >
                Request a quote
              </a>
            </TiltCard>
            </StaggerItem>
          ))}
        </StaggerList>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 rounded-card bg-wash px-6 py-4 text-sm text-ink">
          {guarantees.map((g) => (
            <li key={g.label} className="flex items-center gap-2">
              <Icon name={g.icon} className="h-4 w-4 text-brand" /> {g.label}
            </li>
          ))}
        </ul>
      </Container>

      <Container className="pt-16">
        <h2 className="text-3xl font-normal sm:text-[2.5rem]">People also book</h2>
        <StaggerList className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {others.map((c) => (
            <StaggerItem key={c.slug}>
              <Link href={`/categories/${c.slug}`} className="block h-full rounded-card outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <TiltCard className={`flex flex-col gap-4 rounded-card border border-line bg-white p-5 ${cardHover}`}>
                  <Icon name={c.icon} className={`h-7 w-7 text-brand-bright ${iconHover}`} strokeWidth={1.25} />
                  <span className="font-medium text-ink">{c.name}</span>
                  <span className="text-sm text-muted">{c.short}</span>
                </TiltCard>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      </Container>

      <FinalCta />
    </>
  );
}
