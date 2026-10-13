import type { MetadataRoute } from "next";
import { brand } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The artist portal and admin panel aren't for search; their pages also carry noindex.
    rules: { userAgent: "*", allow: "/", disallow: ["/artists", "/admin"] },
    sitemap: `https://${brand.domain}/sitemap.xml`,
  };
}
