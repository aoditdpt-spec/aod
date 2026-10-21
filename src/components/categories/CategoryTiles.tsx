import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { bookByCategory, categories, type Category } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { linkCard, linkText, linkTitle } from "@/components/ui/cards";

// A photo tile per category, straight to that category's booking questions (/categories/<slug>#book),
// plus a last tile for anyone unsure, so the grid fills evenly: 12 tiles, 3 per row on phones (as in
// Urban Company's app), 4 on tablets, 6 on laptops. Used by the Categories page (the app tab bar's
// Categories tab) and, with five `items`, a category page's "You can also book" (5 + the last
// tile = 6, still even rows).
export function CategoryTiles({ items = categories, className = "" }: { items?: Category[]; className?: string }) {
  return (
    <StaggerList className={`grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6 ${className}`}>
      {items.map((c) => (
        <StaggerItem key={c.slug}>
          <Link
            href={`/categories/${c.slug}#book`}
            className={`flex h-full flex-col rounded-2xl bg-white p-1.5 sm:p-2 ${linkCard}`}
          >
            <span className="relative block aspect-square overflow-hidden rounded-xl bg-peach">
              {c.image ? (
                <Image
                  src={c.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 13rem, (min-width: 640px) 22vw, 30vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <span className="flex h-full items-center justify-center">
                  <Icon name={c.icon} className="h-8 w-8 text-brand" strokeWidth={1.5} />
                </span>
              )}
              <span aria-hidden className="absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm sm:bottom-2 sm:left-2 sm:h-8 sm:w-8">
                <Icon name={c.icon} className="h-4 w-4 text-brand" strokeWidth={1.75} />
              </span>
            </span>
            <span className="flex flex-1 flex-col px-0.5 pb-1 pt-2.5 sm:px-1.5">
              <span className={`text-[0.8125rem] font-bold leading-tight tracking-[-0.01em] text-ink hyphens-auto [overflow-wrap:anywhere] sm:text-base sm:tracking-normal ${linkTitle}`}>{c.name}</span>
              <span className={`mt-auto inline-flex items-center gap-1 pt-1.5 text-xs font-medium text-brand sm:text-sm ${linkText}`}>
                {bookByCategory.tileAction}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </span>
          </Link>
        </StaggerItem>
      ))}
      <StaggerItem>
        <Link href="/book" className={`flex h-full flex-col rounded-2xl bg-white p-1.5 sm:p-2 ${linkCard}`}>
          <span className="flex aspect-square items-center justify-center rounded-xl bg-brand">
            <Sparkles className="h-8 w-8 text-white transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} aria-hidden />
          </span>
          <span className="flex flex-1 flex-col px-0.5 pb-1 pt-2.5 sm:px-1.5">
            <span className={`text-[0.8125rem] font-bold leading-tight tracking-[-0.01em] text-ink hyphens-auto [overflow-wrap:anywhere] sm:text-base sm:tracking-normal ${linkTitle}`}>{bookByCategory.unsure.title}</span>
            <span className={`mt-auto inline-flex items-center gap-1 pt-1.5 text-xs font-medium text-brand sm:text-sm ${linkText}`}>
              {bookByCategory.unsure.action}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </span>
        </Link>
      </StaggerItem>
    </StaggerList>
  );
}
