import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { artistJoinMessage, hero } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { whatsappUrl } from "@/lib/whatsapp";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { HeroDemo, HeroGlow } from "./HeroMotion";
import { HeroVideo } from "./HeroVideo";

// Background footage: drop hero.mp4 (and optionally hero-poster.jpg) into public/media/ and it
// appears behind the hero. Without the file the hero keeps its plain dotted background.
const hasFile = (name: string) => existsSync(join(process.cwd(), "public", "media", name));

// Light, editorial hero over the background footage: the brand name set huge as the page
// heading, the promise and actions on the left, and the live booking steps on the right.
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
            {/* Light veil only behind the text on the left; the footage shows clearly on the right. */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-wash/90 from-15% via-wash/65 via-45% to-transparent to-70% max-lg:bg-wash/75" />
          </>
        )}
        <HeroGlow />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            {/* The brand name is the page heading and the largest text in the hero. */}
            <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight !text-brand sm:text-7xl">
              <ScrambleText text={hero.eyebrow} delay={0.1} />
            </h1>
            <p className="mt-6 max-w-[35rem] text-base text-body sm:text-lg sm:leading-snug">
              {hero.subtitle.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-6">
              <VerifiedArtists variant="inline" />
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

            <p className="mt-10 text-sm text-muted">
              Are you an artist?{" "}
              <a
                href={whatsappUrl(artistJoinMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
              >
                Join AOD
              </a>
            </p>
          </div>

          {/* Live booking steps (laptops and up). */}
          <div className="hidden min-h-[20rem] rounded-[1.5rem] bg-night/85 p-6 backdrop-blur-md lg:block">
            <HeroDemo />
          </div>
        </div>
      </section>
    </Container>
  );
}
