import type { MetadataRoute } from "next";
import { brand } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The artist portal is for signed-in artists; its pages also carry noindex.
    rules: { userAgent: "*", allow: "/", disallow: "/artists" },
    sitemap: `https://${brand.domain}/sitemap.xml`,
  };
}
