import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { artistJoinMessage, categories, hero } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { MetInPerson } from "@/components/ui/MetInPerson";
import { whatsappUrl } from "@/lib/whatsapp";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { HeroDemo, HeroGlow, HeroHeadline } from "./HeroMotion";
import { HeroVideo } from "./HeroVideo";

// Background footage: drop hero.mp4 (and optionally hero-poster.jpg) into public/media/ and it
// appears behind the hero. Without the file the hero keeps its plain dotted background.
const hasFile = (name: string) => existsSync(join(process.cwd(), "public", "media", name));

// Tiles beside the headline: popular categories as real links. Each gets its own fill,
// so the grid reads as a board rather than a list.
const tiles = [
  { slug: "photographers", style: "bg-brand text-white", chip: "bg-white/20 text-white", sub: "text-white/80" },
  { slug: "cinematographers", style: "bg-peach text-ink", chip: "bg-white text-brand", sub: "text-ink/70" },
  { slug: "musicians-djs", style: "bg-white text-ink ring-1 ring-line", chip: "bg-wash text-brand", sub: "text-muted" },
] as const;

// Light, editorial hero: the brand name set huge, a four-line promise, and on the right a
// board of live booking steps and category tiles instead of a dark glowing card.
export function Hero() {
  const video = hasFile("hero.mp4");
  const poster = hasFile("hero-poster.jpg") ? "/media/hero-poster.jpg" : undefined;
  return (
    <Container className="pt-8">
      <section
        className="relative overflow-hidden rounded-[2rem] bg-wash px-6 py-12 sm:px-14 sm:py-16"
        style={
          video
            ? undefined
            : { backgroundImage: "radial-gradient(rgba(194,65,12,0.14) 1px, transparent 1.4px)", backgroundSize: "22px 22px" }
        }
      >
        {video && (
          <>
            <HeroVideo src="/media/hero.mp4" poster={poster} />
            {/* Light veil: strongest behind the text on the left, lighter on the right where the footage shows. */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-wash from-35% via-wash/90 to-wash/55 max-lg:bg-wash/85" />
          </>
        )}
        <HeroGlow />
        <div className="relative grid items-start gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            {/* The brand name is the largest text in the hero. */}
            <p className="text-5xl font-semibold leading-[0.95] tracking-tight text-brand sm:text-7xl">
              <ScrambleText text={hero.eyebrow} delay={0.1} />
            </p>
            <HeroHeadline />
            <p className="mt-6 max-w-[35rem] text-base text-body sm:text-lg sm:leading-snug">
              {hero.subtitle.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-6">
              <MetInPerson variant="inline" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href="/book" className={buttonClasses("primary", "lg", "sm:min-w-[12.5rem]")}>
                {hero.primaryCta}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link href="/#categories" className={buttonClasses("outline", "lg", "sm:min-w-[12.5rem]")}>
                {hero.secondaryCta}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted">Popular:</span>
              {hero.chips.map((chip) => {
                const cat = categories.find((c) => c.services.some((s) => s.name === chip));
                return (
                  <Link
                    key={chip}
                    href={`/categories/${cat?.slug ?? ""}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1 text-sm text-ink hover:border-brand hover:text-brand"
                  >
                    {chip}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                );
              })}
            </div>

            <p className="mt-8 text-sm text-muted">
              Are you an artist?{" "}
              <a
                href={whatsappUrl(artistJoinMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
              >
                Join AOD on WhatsApp
              </a>
            </p>
          </div>

          {/* The board: booking steps on top, category tiles below. */}
          <div className="grid gap-3">
            <div className="hidden min-h-[20rem] rounded-[1.5rem] bg-night p-6 lg:block">
              <HeroDemo />
            </div>
            <StaggerList className="grid grid-cols-2 gap-3">
              {tiles.map((t) => {
                const cat = categories.find((c) => c.slug === t.slug);
                if (!cat) return null;
                return (
                  <StaggerItem key={t.slug}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className={`group flex h-full min-h-[8.5rem] flex-col justify-between rounded-[1.5rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${t.style}`}
                    >
                      <span className="flex items-start justify-between">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.chip}`}>
                          <Icon name={cat.icon} className="h-5 w-5" strokeWidth={1.6} />
                        </span>
                        <ArrowUpRight className="h-5 w-5 opacity-0 transition group-hover:opacity-100" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-lg font-medium leading-tight">{cat.name}</span>
                        <span className={`mt-1 block text-sm ${t.sub}`}>{cat.services.length} services</span>
                      </span>
                    </Link>
                  </StaggerItem>
                );
              })}
              <StaggerItem>
                <Link
                  href="/#categories"
                  className="group flex h-full min-h-[8.5rem] flex-col justify-between rounded-[1.5rem] bg-night p-5 text-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-tangerine">
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-lg font-medium leading-tight">All {categories.length} categories</span>
                    <span className="mt-1 block text-sm text-white/70">Browse everything</span>
                  </span>
                </Link>
              </StaggerItem>
            </StaggerList>
          </div>
        </div>
      </section>
    </Container>
  );
}
