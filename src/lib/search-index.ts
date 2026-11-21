// What the search looks through: every category and every service in it. Only type imports, so
// `npm run check:search` can build the same list in Node.
import type { Category } from "@/data/site";
import type { SearchEntry } from "@/lib/fuzzy";

// Every service of a category (as servicesOf() in site.ts; repeated here so this file has no
// runtime imports and the check script can load it in Node).
const servicesOf = (c: Category) => c.groups.flatMap((g) => g.services);

// One row of results: a category, or a service inside one.
export type SearchResult = {
  key: string;
  title: string;
  detail: string;
  category: Category;
  href: string;
  isCategory: boolean;
};

export function searchEntries(categories: Category[]): SearchEntry<SearchResult>[] {
  return categories.flatMap((c) => [
    {
      item: { key: c.slug, title: c.name, detail: c.blurb, category: c, href: `/categories/${c.slug}`, isCategory: true },
      boost: 12, // a category outranks a single service that matches as well
      fields: [
        { text: c.name, weight: 1 },
        { text: [...c.keywords, ...c.types].join(" "), weight: 0.95 },
        { text: c.blurb, weight: 0.6 },
      ],
    },
    ...servicesOf(c).map((s) => ({
      item: {
        key: `${c.slug}:${s}`,
        title: s,
        detail: c.name,
        category: c,
        href: `/categories/${c.slug}`, // services have no page of their own
        isCategory: false,
      },
      fields: [
        { text: s, weight: 1 },
        { text: c.name, weight: 0.7 },
        { text: c.keywords.join(" "), weight: 0.65 },
      ],
    })),
  ]);
}
