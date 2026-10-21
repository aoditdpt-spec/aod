import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { artistJoinMessage, hero } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { whatsappUrl } from "@/lib/whatsapp";
import { HeroDemo } from "./HeroMotion";
import { HeroVideo } from "./HeroVideo";

// Background footage (the files HeroVideo lists): served from public/media/, or from a storage
// bucket / CDN when NEXT_PUBLIC_MEDIA_URL is set (the same file names at that address). Without
// either, the hero keeps its plain dotted background.
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, "");
const mediaBase = mediaUrl || "/media";
const hasVideo = Boolean(mediaUrl) || existsSync(join(process.cwd(), "public", "media", "hero-1080.mp4"));

// Full-screen hero in the style of a brand campaign page: the footage fills the whole first
// screen edge to edge (under the sticky navbar), a dark gradient keeps the white text readable
// on the left, and the live booking steps float on the right in a frosted-glass panel. Below 1024px
// the text splits: the heading, subtitle and verified line at the top, the buttons and "Join AOD"
// at the bottom, so the middle of the footage stays clear.
export function Hero() {
  return (
    <section
      // Fills the screen under the sticky navbar: about 4.1rem tall from 1024px up, 6.7rem below that
      // (it adds the search bar), where the app's tab bar (AppTabBar, 4.25rem) sits at the bottom too.
      className="relative flex min-h-[calc(100svh-11rem-env(safe-area-inset-bottom))] items-stretch overflow-hidden bg-night lg:min-h-[calc(100svh-4.1rem)] lg:items-center"
      style={
        hasVideo
          ? undefined
          : { backgroundImage: "radial-gradient(color-mix(in srgb, var(--color-tangerine) 18%, transparent) 1px, transparent 1.4px)", backgroundSize: "22px 22px" }
      }
    >
      {hasVideo && (
        <>
          <HeroVideo base={mediaBase} />
          {/* A light veil (the footage stays about 90% visible), a touch darker behind the text so the
              white text reads on bright frames: on the left from 1024px, at the top and bottom below
              that, leaving the middle clear. The text itself has no shadow or glow. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 via-45% to-transparent max-lg:bg-gradient-to-b max-lg:from-black/50 max-lg:via-transparent max-lg:via-50% max-lg:to-black/40"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/25 to-transparent" />
        </>
      )}
      <Container className="relative flex flex-col pb-12 pt-8 sm:pb-14 sm:pt-12 lg:block lg:py-20">
        <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <div className="flex flex-1 flex-col justify-between gap-10 lg:block">
            <div>
              {/* The brand name is the page heading and the largest text in the hero. */}
              <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.01em] text-white sm:text-7xl lg:text-[clamp(3.5rem,5.1vw,5.6rem)]">
                {hero.eyebrow}
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
            </div>

            {/* The bottom padding keeps the buttons clear of the WhatsApp button on phones. */}
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 lg:mt-8">
                <Link href="/book" className={buttonClasses("primary", "lg", "sm:min-w-[12.5rem]")}>
                  {hero.primaryCta}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
                <Link href="/#categories" className={buttonClasses("ghost-light", "lg", "backdrop-blur-sm sm:min-w-[12.5rem]")}>
                  {hero.secondaryCta}
                </Link>
              </div>

              <p className="mt-6 text-sm text-white/70 lg:mt-10">
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
