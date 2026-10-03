"use client";

import type { IconName } from "@/content/site";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import { Rating } from "@/components/ui/Rating";
import { Ring3D } from "@/components/motion/Ring3D";

export type ServiceItem = {
  service: string;
  category: string;
  slug: string;
  icon: IconName;
  rating: number;
  bookings: number;
};

// The most-booked services on the rotating 3D globe. Cards are wide on laptops and
// narrower on phones (sized in Ring3D), so neighbours sit close together.
export function MostBookedRing({ items }: { items: ServiceItem[] }) {
  return (
    <Ring3D
      items={items}
      label="Most booked services"
      getKey={(item) => item.service}
      getLabel={(item) => item.service}
      getHref={(item) => `/categories/${item.slug}`}
      renderCard={(item) => (
        <>
          <PhotoPlaceholder icon={item.icon} label={item.service} className="min-h-0 flex-1" />
          <div className="shrink-0 px-3 pb-2 pt-4">
            <h3 className="truncate text-lg font-medium group-hover:text-brand">{item.service}</h3>
            <p className="text-sm text-muted">{item.category}</p>
            <div className="mt-2">
              <Rating rating={item.rating} count={item.bookings} unit="bookings" />
            </div>
          </div>
        </>
      )}
    />
  );
}
