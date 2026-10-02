import type { MetadataRoute } from "next";
import { brand, categories } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${brand.domain}`;
  return [
    { url: base, priority: 1 },
    { url: `${base}/book`, priority: 0.9 },
    { url: `${base}/book/personal`, priority: 0.8 },
    { url: `${base}/book/business`, priority: 0.8 },
    { url: `${base}/business`, priority: 0.8 },
    { url: `${base}/for-artists`, priority: 0.8 },
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}`, priority: 0.7 })),
  ];
}
