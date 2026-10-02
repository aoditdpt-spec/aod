// Typo-tolerant, ranked search over categories and services.
// Pure functions with no imports from the app, so they can be tested on their own.

export type SearchResult = { label: string; hint: string; href: string };

type SearchableCategory = {
  slug: string;
  name: string;
  keywords: string[];
  services: { name: string; popular?: boolean; bookings: number }[];
};

type Field = { words: string[]; weight: number };

type Entry = SearchResult & {
  fields: Field[];
  label: string;
  normLabel: string;
  isCategory: boolean;
  boost: number;
};

// Words that carry no meaning in a search like "need a photographer for my wedding".
const STOP_WORDS = new Set(["a", "an", "the", "for", "in", "at", "of", "and", "my", "me", "i", "need", "want", "book", "near", "best", "good", "cheap", "to", "with"]);

const MIN_TOKEN_SCORE = 35;

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

// Sound-alike spelling, so "fotography" and "photography" look the same:
// ph→f, ck/q→k, z→s, w→v, trailing y→i, and doubled letters collapsed.
function phonetic(word: string): string {
  return word
    .replace(/ph/g, "f")
    .replace(/ck/g, "k")
    .replace(/q/g, "k")
    .replace(/z/g, "s")
    .replace(/w/g, "v")
    .replace(/y$/, "i")
    .replace(/(.)\1+/g, "$1");
}

// Edit distance that also counts swapped neighbouring letters ("phtoo") as one edit.
function distance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => {
    const row = new Array<number>(cols).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

// How many typos to forgive for a word of this length.
function allowedTypos(length: number): number {
  if (length <= 4) return 0;
  if (length <= 5) return 1;
  if (length <= 8) return 2;
  return 3;
}

// 0–100: how well one typed word matches one word in the index.
function tokenScore(query: string, word: string): number {
  if (word === query) return 100;
  if (word.startsWith(query)) return 70 + (25 * query.length) / word.length;
  if (query.length >= 3 && word.includes(query)) return 50;
  if (query.length < 3) return 0;

  const pq = phonetic(query);
  const pw = phonetic(word);
  if (pw === pq) return 92;
  if (pw.startsWith(pq)) return 65 + (20 * pq.length) / pw.length;

  const allowed = allowedTypos(query.length);
  if (allowed === 0) return 0;

  let best = 0;
  // A typo in the whole word: "fotografy" ~ "photography".
  const whole = distance(pq, pw);
  if (whole <= allowed) best = 75 - whole * 10;
  // A typo in a half-typed word: "phtog" ~ the start of "photography".
  if (pw.length > pq.length) {
    const partial = Math.min(distance(pq, pw.slice(0, pq.length)), distance(pq, pw.slice(0, pq.length + 1)));
    if (partial <= allowed) best = Math.max(best, 62 - partial * 10);
  }
  return best;
}

export function buildIndex(categories: SearchableCategory[]): Entry[] {
  return categories.flatMap((c) => {
    const keywordWords = c.keywords.flatMap(words);
    const category: Entry = {
      label: c.name,
      hint: "Category",
      href: `/categories/${c.slug}`,
      normLabel: normalize(c.name),
      isCategory: true,
      boost: 12, // a category outranks a single service when both match equally well
      fields: [
        { words: [...words(c.name), normalize(c.name).replace(/ /g, "")], weight: 1 },
        { words: keywordWords, weight: 0.95 },
      ],
    };
    const services: Entry[] = c.services.map((s) => ({
      label: s.name,
      hint: c.name,
      href: `/categories/${c.slug}`,
      normLabel: normalize(s.name),
      isCategory: false,
      boost: (s.popular ? 3 : 0) + s.bookings / 100,
      fields: [
        { words: [...words(s.name), normalize(s.name).replace(/ /g, "")], weight: 1 },
        { words: words(c.name), weight: 0.7 },
        { words: keywordWords, weight: 0.65 },
      ],
    }));
    return [category, ...services];
  });
}

function bestFor(token: string, entry: Entry): number {
  let best = 0;
  for (const field of entry.fields) {
    for (const word of field.words) {
      const score = tokenScore(token, word) * field.weight;
      if (score > best) best = score;
    }
  }
  return best;
}

// Ranked results. Every typed word must match something; if nothing matches all of
// them, fall back to entries matching any word, so a partly wrong query still helps.
export function rank(index: Entry[], query: string, limit = 6): SearchResult[] {
  const all = words(query);
  const meaningful = all.filter((w) => !STOP_WORDS.has(w));
  const tokens = meaningful.length > 0 ? meaningful : all;
  if (tokens.length === 0) return [];

  const phrase = tokens.join(" ");
  const scored = index.map((entry) => {
    const perToken = tokens.map((t) => bestFor(t, entry));
    const matched = perToken.filter((s) => s >= MIN_TOKEN_SCORE).length;
    let score = perToken.reduce((sum, s) => sum + (s >= MIN_TOKEN_SCORE ? s : 0), 0);
    if (matched > 0) {
      if (entry.normLabel.startsWith(phrase)) score += 40;
      else if (entry.normLabel.includes(phrase)) score += 20;
      score += entry.boost;
    }
    return { entry, score, matched };
  });

  const full = scored.filter((s) => s.matched === tokens.length);
  const pool = full.length > 0 ? full : scored.filter((s) => s.matched > 0);

  return pool
    .sort((a, b) => b.score - a.score || a.entry.label.length - b.entry.label.length)
    .slice(0, limit)
    .map(({ entry }) => ({ label: entry.label, hint: entry.hint, href: entry.href }));
}
