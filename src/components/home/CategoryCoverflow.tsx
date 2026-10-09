"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { Coverflow } from "@/components/motion/Coverflow";

// The 10 categories in the 3D coverflow carousel, each with its photo (mock photos for now,
// see `image` in site.ts) and the category icon on a small tile; without a photo, the icon alone.
export function CategoryCoverflow() {
  return (
    <Coverflow
      items={categories}
      label="Artist categories"
      getKey={(c) => c.slug}
      getLabel={(c) => c.name}
      getHref={(c) => `/categories/${c.slug}`}
      renderCard={(c, active) => (
        <>
          <div className="relative flex aspect-[16/11] items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-wash via-peach/40 to-apricot/50">
            {c.image ? (
              <>
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="(min-width: 640px) 19rem, 17rem"
                  draggable={false}
                  className={`object-cover transition-transform duration-500 ${active ? "scale-105" : ""}`}
                />
                {/* A faint shade at the bottom so the icon tile stands out on bright photos. */}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 shadow-sm backdrop-blur-sm">
                  <Icon name={c.icon} className="h-[1.125rem] w-[1.125rem] text-brand" strokeWidth={1.5} />
                </span>
              </>
            ) : (
              <>
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_0,transparent_55%)]" />
                <span
                  className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-500 ${
                    active ? "scale-110" : ""
                  }`}
                >
                  <Icon name={c.icon} className="h-8 w-8 text-brand" strokeWidth={1.5} />
                </span>
              </>
            )}
          </div>
          <div className="px-3 pb-2 pt-4">
            <h3 className="text-lg font-medium group-hover:text-brand">{c.name}</h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted">{c.short}</p>
            <span className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm font-medium text-brand">
              {c.services.length} services
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </>
      )}
    />
  );
}
