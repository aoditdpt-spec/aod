import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight } from "lucide-react";
import { categories, categoryBooking, getCategory, guarantees } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { Icon } from "@/components/ui/Icon";
import { Rating } from "@/components/ui/Rating";
import { FinalCta } from "@/components/home/FinalCta";
import { MatchQuiz } from "@/components/home/MatchQuiz";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { linkCard, linkText, linkTitle, tiltText, tiltTitle, tiltZoom } from "@/components/ui/cards";
import { TiltCard } from "@/components/motion/TiltCard";
import { StickyBookBar } from "@/components/categories/StickyBookBar";
import { CategoryTiles } from "@/components/categories/CategoryTiles";
import { QuoteButton } from "@/components/categories/QuoteButton";

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
        <section className="relative overflow-hidden rounded-[1.5rem] bg-night px-6 py-12 sm:px-16 sm:py-14">
          {/* The category photo on the right, fully visible at the right edge and fading into the dark
              towards the left; past where it reaches, the plain dark background. From tablets up the
              photo box takes the photo's own shape at the header's full height, so nothing is cropped.
              On phones it fills the header faintly behind the text. */}
          {category.image && (
            <div
              aria-hidden
              style={{ "--photo-ratio": `${category.image.width} / ${category.image.height}` } as CSSProperties}
              className="absolute inset-y-0 right-0 w-full opacity-40 [mask-image:linear-gradient(to_left,black_55%,transparent)] sm:w-auto sm:max-w-[85%] sm:opacity-85 sm:[aspect-ratio:var(--photo-ratio)]"
            >
              <Image src={category.image.src} alt="" fill preload sizes="(min-width: 640px) 60vw, 100vw" className="object-cover" />
            </div>
          )}
          <div className="relative">
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
              <a href="#book" className={buttonClasses("white", "lg")}>
                Get curated matches <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <span className="text-sm text-white/70">Verified professionals · transparent quotes · no negotiation</span>
            </div>
          </div>
        </section>
      </Container>

      <Container className="py-16">
        <h2 className="text-3xl font-normal sm:text-[2.5rem]">What you can book</h2>
        <p className="mt-3 text-body">Pick a service and ask for a quote below — we&apos;ll reply with curated matches.</p>
        <StaggerList className="swipe-row mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {category.services.map((s) => (
            <StaggerItem key={s.name} className="swipe-item">
            <TiltCard className={`flex flex-col rounded-[1.25rem] border border-line bg-white p-6`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className={`text-lg font-bold ${tiltTitle}`}>{s.name}</h3>
                {s.popular && (
                  <span className={`rounded-full bg-peach px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-ink ${tiltZoom}`}>
                    Popular
                  </span>
                )}
              </div>
              <div className={`mt-2 ${tiltText}`}>
                <Rating rating={s.rating} count={s.bookings} unit="bookings" />
              </div>
              {/* To the booking questions on this page, started again with this service, so the
                  request is saved before WhatsApp opens. */}
              <QuoteButton category={category.slug} service={s.name} className={buttonClasses("outline", "md", "mt-6")}>
                Request a quote
              </QuoteButton>
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

      <StickyBookBar name={category.name} label={categoryBooking.barButton} />

      {/* The booking questions with this category already picked: how many of them, and anyone
          else for the same event. */}
      <section id="book" aria-labelledby="book-title" className="scroll-mt-24 bg-wash py-16">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand">{categoryBooking.eyebrow(category.name)}</p>
              <h2 id="book-title" className="mt-3 text-3xl font-normal leading-[1.1] sm:text-4xl">
                {categoryBooking.title}
              </h2>
              <p className="mt-5 max-w-sm text-body">{categoryBooking.text(category.name)}</p>
              <div className="mt-8 max-w-md">
                <VerifiedArtists variant="card" />
              </div>
            </div>
            <MatchQuiz initialNeeds={[category.slug]} />
          </div>
        </Container>
      </section>

      <Container className="pt-16">
        <h2 className="text-3xl font-normal sm:text-[2.5rem]">You can also book</h2>
        {/* Phones and tablets: photo tiles. Laptops: text cards with the category's symbol. */}
        <CategoryTiles items={others} className="mt-8 lg:hidden" />
        <StaggerList className="mt-8 hidden grid-cols-5 gap-4 lg:grid">
          {others.map((c) => (
            <StaggerItem key={c.slug}>
              <Link
                href={`/categories/${c.slug}`}
                className={`flex h-full flex-col gap-4 rounded-card bg-white p-5 outline-none focus-visible:ring-2 focus-visible:ring-brand ${linkCard}`}
              >
                <Icon name={c.icon} className="h-7 w-7 text-brand-bright" strokeWidth={1.25} />
                <span className={`font-bold text-ink ${linkTitle}`}>{c.name}</span>
                <span className={`text-sm text-muted ${linkText}`}>{c.short}</span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      </Container>

      <FinalCta />
    </>
  );
}
