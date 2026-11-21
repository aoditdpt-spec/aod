// The server's view of the site's data. The site's own copy and categories live in src/data/site.ts
// (the new design, 2026-11-21: six categories, each with its kinds of artist); the server code,
// emails and policies read the same values through here.

import { brand as siteBrand, categories as siteCategories, cities as siteCities } from "@/data/site";

export const brand = {
  ...siteBrand,
  instagramHandle: "@artistsondemand.in",
  instagramUrl: "https://www.instagram.com/artistsondemand.in/",
  linkedinUrl: "https://www.linkedin.com/company/artists-on-demand-pvt-ltd/",
};

export const categories = siteCategories;
export const cities = siteCities;
export type Audience = "personal" | "business";

export const categoryName = (slug: string) => siteCategories.find((c) => c.slug === slug)?.name ?? slug;
