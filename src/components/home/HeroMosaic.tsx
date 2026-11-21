import Image from "next/image";
import type { CSSProperties } from "react";
import { heroMosaic } from "@/data/home";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";

// Under the hero's heading: ten square tiles, text and photos taking turns, in the style of
// snappr.com. Laptops and tablets: 5 columns by 2 rows (text, photo, text, photo, text / photo,
// text, photo, text, photo); phones: 2 columns by 5 rows, also taking turns (text, photo / photo,
// text / …), by swapping every other pair.
const phoneOrder = (i: number) => (Math.floor(i / 2) % 2 === 1 ? (i % 2 === 0 ? i + 1 : i - 1) : i);

export function HeroMosaic() {
  return (
    <Stagger className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
      {heroMosaic.map((t, i) => (
        <StaggerItem key={i} className="aspect-square max-sm:[order:var(--o)]" style={{ "--o": phoneOrder(i) } as CSSProperties}>
          {t.kind === "photo" ? (
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-wash sm:rounded-xl">
              <Image
                src={t.src}
                alt={t.alt}
                fill
                sizes="(min-width: 640px) 20vw, 50vw"
                priority={i < 5} // the first row is on screen at once
                className="object-cover transition-transform duration-700 ease-out hover:scale-[1.04]"
              />
            </div>
          ) : (
            // The text tiles: white on black, with only the "+" in orange. They zoom in on hover
            // like the photos (the tile stays put, its content grows inside it).
            <div className="h-full w-full overflow-hidden rounded-lg bg-ink text-paper sm:rounded-xl">
              <div className="flex h-full w-full flex-col justify-between p-4 transition-transform duration-700 ease-out hover:scale-[1.04] lg:p-6">
                <span className="text-4xl font-medium tracking-tight tabular-nums lg:text-5xl">
                  {t.value.replace(/\+$/, "")}
                  {t.value.endsWith("+") && <span className="text-brand">+</span>}
                </span>
                <span className="text-sm leading-snug lg:text-base">{t.label}</span>
              </div>
            </div>
          )}
        </StaggerItem>
      ))}
    </Stagger>
  );
}
