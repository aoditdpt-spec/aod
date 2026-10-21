import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { artistJoinMessage, getCategory, hero, verifiedArtists } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { SearchBox } from "@/components/search/SearchBox";
import { whatsappUrl } from "@/lib/whatsapp";
import { ExploreGrid } from "./ExploreGrid";
import { HeroVideo } from "./HeroVideo";

// Background footage (the files HeroVideo lists): served from public/media/, or from a storage
// bucket / CDN when NEXT_PUBLIC_MEDIA_URL is set (the same file names at that address). Without
// either, the hero keeps its plain dotted background.
const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, "");
const mediaBase = mediaUrl || "/media";
const hasVideo = Boolean(mediaUrl) || existsSync(join(process.cwd(), "public", "media", "hero-1080.mp4"));

// The two category photos beside the footage in the laptop mosaic.
const mosaic = ["makeup-artists", "musicians-djs"].map((slug) => getCategory(slug)?.image).filter((i) => i !== undefined);

// The hero, modelled on Headout's and Urban Company's homepages. One grid, laid out two ways:
// - Phones and tablets (Headout): the footage as a rounded banner with the heading over its
//   bottom, the search box overlapping the banner's lower edge, then "What are you looking for?"
//   (ExploreGrid). The navbar's own search row stays out of the way until this one scrolls off.
// - Laptops (Urban Company): heading, search and the explore card on the left; on the right a
//   mosaic of the footage and two category photos.
// The heading block shares the banner's grid cell on phones (laid over it) and has its own cell on
// laptops, so the page has one h1 and one video element.
export function Hero() {
  const media = (
    <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-night">
      {hasVideo ? (
        <HeroVideo base={mediaBase} />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(color-mix(in srgb, var(--color-tangerine) 30%, transparent) 1px, transparent 1.4px)", backgroundSize: "22px 22px" }}
        />
      )}
      {/* Darker towards the bottom, where the heading sits on phones. */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 via-55% to-black/10 lg:from-black/30 lg:via-transparent" />
    </div>
  );

  return (
    <section className="pb-8 pt-3 sm:pt-5 lg:pb-14 lg:pt-10">
      <Container>
        <div className="grid [grid-template-areas:'media'_'search'_'explore'] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-x-14 lg:[grid-template-areas:'text_media'_'search_media'_'explore_media']">
          {/* The footage: the banner on phones, the big tile of the mosaic on laptops. */}
          <div className="grid aspect-[4/5] max-h-[60svh] w-full [grid-area:media] sm:aspect-[16/10] lg:aspect-auto lg:max-h-none lg:min-h-[36rem] lg:grid-cols-[1.45fr_1fr] lg:gap-3">
            {media}
            <div className="hidden grid-rows-2 gap-3 lg:grid">
              {mosaic.map((img) => (
                <div key={img.src} className="relative overflow-hidden rounded-[1.75rem] bg-peach">
                  <Image src={img.src} alt="" fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Heading: over the banner on phones (white), beside the mosaic on laptops. */}
          <div className="relative z-[1] self-end px-5 pb-12 [grid-area:media] sm:px-8 lg:self-end lg:px-0 lg:pb-0 lg:[grid-area:text]">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm lg:bg-peach lg:text-ink lg:backdrop-blur-none">
              <BadgeCheck className="h-4 w-4 text-apricot lg:text-brand" aria-hidden />
              {verifiedArtists.short}
            </p>
            <h1 className="mt-3 text-[2.35rem] font-bold leading-[1.05] !text-white sm:text-5xl lg:mt-5 lg:text-[clamp(2.75rem,3.9vw,4.1rem)] lg:!text-ink">
              {hero.title}
            </h1>
            <p className="mt-3 max-w-xl text-[0.9375rem] text-white/85 sm:text-lg lg:mt-5 lg:text-body">{hero.subtitle}</p>
          </div>

          {/* The search box, overlapping the banner's lower edge on phones. */}
          <div id="hero-search" className="relative z-[2] -mt-7 px-3 [grid-area:search] sm:px-6 lg:mt-8 lg:px-0">
            <SearchBox variant="hero" />
          </div>

          <div className="mt-7 [grid-area:explore] lg:mt-8">
            <ExploreGrid />
            <p className="mt-5 text-sm text-muted">
              {hero.artistLine}{" "}
              <a
                href={whatsappUrl(artistJoinMessage)}
                target="_blank"
                rel="noopener noreferrer"
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
