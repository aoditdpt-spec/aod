import type { MetadataRoute } from "next";
import { brand } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The artist portal, payment page and admin panel aren't for search; their pages also carry noindex.
    rules: { userAgent: "*", allow: "/", disallow: ["/artists", "/pay", "/admin"] },
    sitemap: `https://${brand.domain}/sitemap.xml`,
  };
}
