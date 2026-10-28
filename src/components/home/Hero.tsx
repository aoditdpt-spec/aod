import { existsSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { hero, verifiedArtists } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { SearchBox } from "@/components/search/SearchBox";
import { portalHref } from "@/lib/site-url";
import { ExploreGrid } from "./ExploreGrid";
import { HeroDemo } from "./HeroMotion";
import { HeroVideo } from "./HeroVideo";

// Background footage (the files HeroVideo lists): served from public/media/, or from a storage
// bucket / CDN when NEXT_PUBLIC_MEDIA_URL is set (the same file names at that address). Without
// either, the hero keeps its plain dotted background.
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, "");
const mediaBase = mediaUrl || "/media";
const hasVideo = Boolean(mediaUrl) || existsSync(join(process.cwd(), "public", "media", "artists-1080.mp4"));
const dots = "radial-gradient(color-mix(in srgb, var(--color-tangerine) 30%, transparent) 1px, transparent 1.4px)";

// Two heroes, one shown at a time (CSS), each playing the footage only while it is the one shown:
// the app-style hero on phones and tablets, the full-screen video hero on laptops.
export function Hero() {
  return (
    <>
      <HeroApp />
      <HeroDesktop />
    </>
  );
}

// Phones and tablets, modelled on Headout's homepage: the footage as a rounded banner with the
// heading over its bottom, the search box overlapping the banner's lower edge, then "What are you
// looking for?" (ExploreGrid). The navbar's own search row stays out of the way until this one
// scrolls off.
function HeroApp() {
  return (
    <section className="pb-8 pt-3 sm:pt-5 lg:hidden">
      <Container>
        <div className="grid [grid-template-areas:'media'_'search'_'explore']">
          <div className="relative aspect-[4/5] max-h-[60svh] w-full overflow-hidden rounded-[1.75rem] bg-night [grid-area:media] sm:aspect-[16/10]">
            {hasVideo ? (
              <HeroVideo base={mediaBase} media="(max-width: 1023.98px)" />
            ) : (
              <div aria-hidden className="absolute inset-0" style={{ backgroundImage: dots, backgroundSize: "22px 22px" }} />
            )}
            {/* Darker towards the bottom, where the heading sits. */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 via-55% to-black/10" />
          </div>

          {/* The heading, laid over the banner's bottom. */}
          <div className="relative z-[1] self-end px-5 pb-12 [grid-area:media] sm:px-8">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4 text-apricot" aria-hidden />
              {verifiedArtists.short}
            </p>
            {/* The brand name is the heading, as on laptops; the promise and the subtitle follow. */}
            <h1 className="mt-3 text-[2.35rem] font-bold leading-[1.05] !text-white sm:text-5xl">{hero.desktop.title}</h1>
            <p className="mt-2 text-lg font-semibold leading-snug text-white sm:text-2xl">{hero.title}</p>
            <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-lg">{hero.subtitle}</p>
          </div>

          {/* The search box, overlapping the banner's lower edge. */}
          <div id="hero-search" className="relative z-[2] -mt-7 px-3 [grid-area:search] sm:px-6">
            <SearchBox variant="hero" />
          </div>

          <div className="mt-7 [grid-area:explore]">
            <ExploreGrid />
            <p className="mt-5 text-sm text-muted">
              {hero.artistLine}{" "}
              <a
                href={portalHref("/artists/apply")}
                className="font-semibold text-brand underline underline-offset-4 hover:text-brand-hover"
              >
                {hero.artistLink}
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

// Laptops: a full-screen hero in the style of a brand campaign page. The footage fills the whole
// first screen edge to edge (under the sticky navbar), a light gradient keeps the white text
// readable on the left, and the live booking steps float on the right in a frosted-glass panel.
function HeroDesktop() {
  const copy = hero.desktop;
  return (
    <section
      // Fills the screen under the sticky navbar (about 4.1rem tall).
      className="relative hidden min-h-[calc(100svh-4.1rem)] items-center overflow-hidden bg-night lg:flex"
      style={hasVideo ? undefined : { backgroundImage: dots, backgroundSize: "22px 22px" }}
    >
      {hasVideo && (
        <>
          <HeroVideo base={mediaBase} media="(min-width: 1024px)" />
          {/* A light veil (the footage stays about 90% visible), a touch darker behind the text on
              the left so the white text reads on bright frames. The text itself has no shadow or glow. */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 via-45% to-transparent" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/25 to-transparent" />
        </>
      )}
      <Container className="relative py-20">
        <div className="grid grid-cols-[1.1fr_1fr] items-center gap-16">
          <div>
            {/* The brand name is the page heading and the largest text in the hero. */}
            <h1 className="text-[clamp(3.5rem,5.1vw,5.6rem)] font-bold leading-[0.95] tracking-[-0.01em] text-white">{copy.title}</h1>
            <p className="mt-6 max-w-[35rem] text-xl leading-snug text-white/90">
              {copy.subtitle.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-6">
              <VerifiedArtists variant="inline" dark />
            </div>

            <div className="mt-8 flex gap-4">
              <Link href="/book" className={buttonClasses("primary", "lg", "min-w-[12.5rem]")}>
                {copy.primaryCta}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link href="/#categories" className={buttonClasses("ghost-light", "lg", "min-w-[12.5rem] backdrop-blur-sm")}>
                {copy.secondaryCta}
              </Link>
            </div>

            <p className="mt-10 text-sm text-white/70">
              {hero.artistLine}{" "}
              <a
                href={portalHref("/artists/apply")}
                className="font-medium text-apricot underline underline-offset-4 hover:text-white"
              >
                {hero.artistLink}
              </a>
            </p>
          </div>

          {/* Live booking steps on dark, lightly blurred glass: narrower than the column, set to
              its right edge and a little below centre. */}
          <div className="mt-20 w-full max-w-[38rem] justify-self-end rounded-[1.5rem] border border-white/15 bg-black/30 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-[5px]">
            <HeroDemo />
          </div>
        </div>
      </Container>
    </section>
  );
}
