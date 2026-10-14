import Image from "next/image";
import { clientBrands } from "@/content/site";

// Logos have very different shapes (a long exhibition banner next to a square crest),
// so instead of one fixed height each gets the same visual area, capped at MAX_HEIGHT.
const AREA = 216 * 80; // in px at the 16px rem
const MAX_HEIGHT = 88;
const GAP = 80; // gap-x-20 between logos, in px
// Both rows move at this speed, whatever their length: each row's loop time is its width / SPEED.
const SPEED = 114; // px per second

type Brand = (typeof clientBrands)[number];

function logoHeight(width: number, height: number) {
  return Math.min(MAX_HEIGHT, Math.sqrt((AREA * height) / width));
}

function logoSize(width: number, height: number) {
  const h = logoHeight(width, height);
  return { height: `${h / 16}rem`, width: `${(h * width) / height / 16}rem` };
}

// Seconds for one loop of a row (one copy of its logos) at SPEED.
function loopSeconds(brands: readonly Brand[]) {
  const px = brands.reduce((n, b) => n + (logoHeight(b.width, b.height) * b.width) / b.height + GAP, 0);
  return Math.round(px / SPEED);
}

// Two rows: the first half of the list, then the second. (GATE and the GCCI badge end up in
// different rows, so they never appear side by side.)
const half = Math.ceil(clientBrands.length / 2);
const rows = [clientBrands.slice(0, half), clientBrands.slice(half)];

function LogoList({ brands, copy = false }: { brands: readonly Brand[]; copy?: boolean }) {
  return (
    <ul
      // The second copy only exists to make the loop seamless: hidden from screen readers,
      // and dropped entirely when the strip doesn't move.
      aria-hidden={copy || undefined}
      className={`flex shrink-0 items-center gap-x-20 pr-20 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8 motion-reduce:pr-0 ${
        copy ? "motion-reduce:hidden" : ""
      }`}
    >
      {brands.map((b) => (
        <li key={b.name} className="shrink-0">
          <Image
            src={b.logo}
            alt={copy ? "" : b.name}
            width={b.width}
            height={b.height}
            style={logoSize(b.width, b.height)}
            className="object-contain"
          />
        </li>
      ))}
    </ul>
  );
}

// Brands strip: two rows of logos that scroll without end, even under the pointer, the first
// right to left and the second left to right, at the same speed. Pure CSS, so it also runs
// without JavaScript. With reduced motion each row is a still, wrapped row.
export function BrandStrip() {
  return (
    <div className="mt-14">
      <p className="text-center text-2xl font-medium text-ink sm:text-3xl">Trusted by renowned brands</p>
      <div className="mt-8 space-y-2 overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:space-y-8 motion-reduce:[mask-image:none]">
        {rows.map((brands, i) => (
          <div
            key={i}
            style={{ animationDuration: `${loopSeconds(brands)}s` }}
            className={`flex w-max py-2 motion-reduce:w-full motion-reduce:animate-none ${i === 0 ? "animate-marquee" : "animate-marquee-reverse"}`}
          >
            <LogoList brands={brands} />
            <LogoList brands={brands} copy />
          </div>
        ))}
      </div>
    </div>
  );
}
