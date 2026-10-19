import type { MetadataRoute } from "next";
import { brand, categories } from "@/content/site";
import { publishedPosts } from "@/server/blog";

// Rebuilt at most once an hour, and when the team changes a post (for the blog's addresses).
export const revalidate = 3600;

// The customer site only: the Dispute Desk, artist portal and admin are on their own domains.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `https://${brand.domain}`;
  const posts = (await publishedPosts()).filter((p) => !p.sample);
  return [
    { url: base, priority: 1 },
    { url: `${base}/book`, priority: 0.9 },
    { url: `${base}/book/personal`, priority: 0.8 },
    { url: `${base}/book/business`, priority: 0.8 },
    { url: `${base}/business`, priority: 0.8 },
    { url: `${base}/for-artists`, priority: 0.8 },
    { url: `${base}/blog`, priority: 0.7 },
    { url: `${base}/about`, priority: 0.6 },
    { url: `${base}/privacy`, priority: 0.3 },
    { url: `${base}/terms`, priority: 0.3 },
    { url: `${base}/refund-policy`, priority: 0.3 },
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}`, priority: 0.7 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, priority: 0.6 })),
  ];
}
