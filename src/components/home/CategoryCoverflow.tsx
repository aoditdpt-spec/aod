"use client";

import { ArrowUpRight } from "lucide-react";
import { categories } from "@/content/site";
import { Icon } from "@/components/ui/Icon";
import { Coverflow } from "@/components/motion/Coverflow";

// The 10 categories in the same 3D coverflow as "Most booked services".
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
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_0,transparent_55%)]" />
            <span
              className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-500 ${
                active ? "scale-110" : ""
              }`}
            >
              <Icon name={c.icon} className="h-8 w-8 text-brand" strokeWidth={1.5} />
            </span>
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
