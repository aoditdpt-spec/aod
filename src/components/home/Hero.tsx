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

// Full-screen hero in the style of a brand campaign page: the footage fills the whole first
// screen edge to edge (under the sticky navbar), a dark gradient keeps the white text readable
// on the left, and the live booking steps float on the right in a frosted-glass panel.
export function Hero() {
  const video = hasFile("hero.mp4");
  const poster = hasFile("hero-poster.jpg") ? "/media/hero-poster.jpg" : undefined;
  return (
    <section
      // Fills the screen under the sticky navbar: about 4.1rem tall from 1024px up, 7.3rem below that (it adds the search bar).
      className="relative flex min-h-[calc(100svh-7.3rem)] items-center overflow-hidden bg-night lg:min-h-[calc(100svh-4.1rem)]"
      style={
        video
          ? undefined
          : { backgroundImage: "radial-gradient(rgba(234,153,123,0.18) 1px, transparent 1.4px)", backgroundSize: "22px 22px" }
      }
    >
      {video && (
        <>
          <HeroVideo src="/media/hero.mp4" poster={poster} />
          {/* Dark veil, strongest behind the text on the left, plus a soft fade at the bottom. */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 via-50% to-black/15 max-lg:bg-black/55" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />
        </>
      )}
      <HeroGlow />
      <Container className="relative py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            {/* The brand name is the page heading and the largest text in the hero. */}
            <h1 className="bg-gradient-to-r from-apricot via-tangerine to-sheen-light bg-clip-text pb-2 text-5xl font-semibold leading-[0.95] tracking-tight !text-transparent sm:text-7xl lg:text-8xl">
              <ScrambleText text={hero.eyebrow} delay={0.1} />
            </h1>
            <p className="mt-6 max-w-[35rem] text-lg text-white/90 sm:text-xl sm:leading-snug">
              {hero.subtitle.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-6">
              <VerifiedArtists variant="inline" dark />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href="/book" className={buttonClasses("primary", "lg", "sm:min-w-[12.5rem]")}>
                {hero.primaryCta}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link href="/#categories" className={buttonClasses("ghost-light", "lg", "backdrop-blur-sm sm:min-w-[12.5rem]")}>
                {hero.secondaryCta}
              </Link>
            </div>

            <p className="mt-10 text-sm text-white/70">
              Are you an artist?{" "}
              <a
                href={whatsappUrl(artistJoinMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-apricot underline underline-offset-4 hover:text-white"
              >
                Join AOD
              </a>
            </p>
          </div>

          {/* Live booking steps on dark, lightly blurred glass (laptops and up): narrower than the
              column, set to its right edge and a little below centre. */}
          <div className="hidden w-full max-w-[38rem] justify-self-end rounded-[1.5rem] border border-white/15 bg-black/30 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-[5px] lg:mt-20 lg:block">
            <HeroDemo />
          </div>
        </div>
      </Container>
    </section>
  );
}
