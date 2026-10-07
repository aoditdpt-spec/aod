"use client";

import type { IconName } from "@/content/site";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { Rating } from "@/components/ui/Rating";
import { Coverflow } from "@/components/motion/Coverflow";

export type ServiceItem = {
  service: string;
  category: string;
  slug: string;
  icon: IconName;
  rating: number;
  bookings: number;
};

// The most-booked services in the same sliding 3D coverflow as the categories.
export function MostBookedCoverflow({ items }: { items: ServiceItem[] }) {
  return (
    <Coverflow
      items={items}
      label="Most booked services"
      getKey={(item) => item.service}
      getLabel={(item) => item.service}
      getHref={(item) => `/categories/${item.slug}`}
      renderCard={(item) => (
        <>
          <PhotoPlaceholder icon={item.icon} label={item.service} className="aspect-[16/11]" />
          <div className="px-3 pb-2 pt-4">
            <h3 className="truncate text-lg font-medium group-hover:text-brand">{item.service}</h3>
            <p className="text-sm text-muted">{item.category}</p>
            <div className="mt-3 border-t border-line pt-3">
              <Rating rating={item.rating} count={item.bookings} unit="bookings" />
            </div>
          </div>
        </>
      )}
    />
  );
}
