import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { categories, hero } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { linkTitle } from "@/components/ui/cards";

// "What are you looking for?" in the hero, as Urban Company's: every category as a small photo
// tile with its short name under it, plus "Get matched" for anyone unsure (12 tiles: 4 to a row on
// phones and tablets, 6 on laptops so the whole grid fits in the first screen).
// On laptops it sits in a bordered card; on phones it runs straight under the search box.
export function ExploreGrid() {
  const tile = "press group flex flex-col items-center gap-1.5 rounded-2xl p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-brand";
  const label = `text-[0.8125rem] font-semibold leading-tight text-ink sm:text-sm lg:text-[0.8125rem] ${linkTitle}`;

  return (
    <div className="lg:rounded-3xl lg:border lg:border-line lg:bg-white lg:p-6 lg:shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
      <h2 className="text-lg font-bold sm:text-xl">{hero.exploreTitle}</h2>
      <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 sm:gap-x-4 lg:grid-cols-6 lg:gap-x-2.5">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/categories/${c.slug}`} className={tile}>
              <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-wash">
                {c.image ? (
                  <Image
                    src={c.image.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 6rem, 22vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <Icon name={c.icon} className="h-7 w-7 text-brand" strokeWidth={1.5} />
                  </span>
                )}
              </span>
              <span className={label}>{c.shortName ?? c.name}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/book" className={tile}>
            <span className="flex aspect-square w-full items-center justify-center rounded-2xl bg-brand">
              <Sparkles className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} aria-hidden />
            </span>
            <span className={label}>
              <span className="block text-[0.75rem] font-medium text-muted">{hero.exploreMore.note}</span>
              {hero.exploreMore.label}
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
