import Image from "next/image";
import { brandStrip } from "@/data/home";

// Brands AOD has worked with, on black (in the style of snappr.com's strip), with no heading (the
// title is for screen readers only): every logo pure white
// at 80% (public/brands-white, made from the main site's logos with their backgrounds and white
// parts cut out), sliding slowly in one row that never ends and fading at both edges. Each logo
// gets the same visual area rather than the same height, so wide and square logos look balanced.
// Under reduced motion the row stands still and wraps.
const AREA = 5200; // px² per logo

export function BrandStrip() {
  const logos = brandStrip.logos.map((l) => {
    const h = Math.round(Math.sqrt((AREA * l.h) / l.w));
    return { ...l, height: h, width: Math.round((h * l.w) / l.h) };
  });
  const row = (copy: number) =>
    logos.map((l) => (
      <li key={`${copy}-${l.src}`} aria-hidden={copy > 0} className={`flex shrink-0 items-center px-8 sm:px-12 ${copy > 0 ? "motion-reduce:hidden" : ""}`}>
        <Image src={l.src} alt={copy > 0 ? "" : l.name} width={l.width} height={l.height} style={{ width: l.width, height: l.height }} className="opacity-80" />
      </li>
    ));
  return (
    <section aria-label={brandStrip.title} className="overflow-hidden bg-ink py-14 text-paper lg:py-16">
      <div className="[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="marquee flex w-max motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8">
          {row(0)}
          {row(1)}
        </ul>
      </div>
    </section>
  );
}
