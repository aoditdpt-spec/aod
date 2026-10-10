import Image from "next/image";
import { clientBrands } from "@/content/site";

// Logos have very different shapes (a long exhibition banner next to a square crest),
// so instead of one fixed height each gets the same visual area, capped at MAX_HEIGHT.
const AREA = 216 * 80; // in px at the 16px rem
const MAX_HEIGHT = 88;

function logoSize(width: number, height: number) {
  const aspect = width / height;
  const h = Math.min(MAX_HEIGHT, Math.sqrt(AREA / aspect));
  return { height: `${h / 16}rem`, width: `${(h * aspect) / 16}rem` };
}

function LogoList({ copy = false }: { copy?: boolean }) {
  return (
    <ul
      // The second copy only exists to make the loop seamless: hidden from screen readers,
      // and dropped entirely when the strip doesn't move.
      aria-hidden={copy || undefined}
      className={`flex shrink-0 items-center gap-x-20 pr-20 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8 motion-reduce:pr-0 ${
        copy ? "motion-reduce:hidden" : ""
      }`}
    >
      {clientBrands.map((b) => (
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

// Brands strip: logos scroll right to left without end, even under the pointer.
// Pure CSS, so it also runs without JavaScript. With reduced motion it's a still, wrapped row.
export function BrandStrip() {
  return (
    <div className="mt-14">
      <p className="text-center text-2xl font-medium text-ink sm:text-3xl">Trusted by renowned brands</p>
      <div className="mt-8 overflow-hidden py-8 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]">
        <div className="flex w-max animate-marquee motion-reduce:w-full motion-reduce:animate-none">
          <LogoList />
          <LogoList copy />
        </div>
      </div>
    </div>
  );
}
