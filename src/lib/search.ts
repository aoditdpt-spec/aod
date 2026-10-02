import { categories } from "@/content/site";
import { buildIndex, rank, type SearchResult } from "./fuzzy";

export type { SearchResult };

const index = buildIndex(categories);

// Ranked, typo-tolerant search over categories and services (see ./fuzzy.ts).
export function searchServices(query: string, limit = 6): SearchResult[] {
  return rank(index, query, limit);
}
