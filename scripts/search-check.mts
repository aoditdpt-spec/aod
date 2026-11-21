// Checks the search: common queries and the spelling mistakes people make should find the right
// category or service near the top, nonsense should find nothing, and a search must stay fast.
// Run with `npm run check:search`. Add a case when changing the search words or the tuning.
import { categories } from "../src/data/site.ts";
import { createSearch } from "../src/lib/fuzzy.ts";
import { searchEntries } from "../src/lib/search-index.ts";

const search = createSearch(searchEntries(categories));

// [what's typed, a title that must be among the first `top` results, top]
const cases: [string, string, number][] = [
  ["photographer", "Photography & Film", 1],
  ["fotografer", "Photography & Film", 1],
  ["phtoographer", "Photography & Film", 1],
  ["photgrapher", "Photography & Film", 1],
  ["photo", "Photography & Film", 1],
  ["cinematografer", "Photography & Film", 1],
  ["cinma", "Photography & Film", 3],
  ["videographer", "Photography & Film", 1],
  ["drone", "Photography & Film", 1],
  ["dron", "Photography & Film", 1],
  ["birthday", "Birthday Celebrations (Kids & Adults)", 5],
  ["bisthdas", "Birthday Celebrations (Kids & Adults)", 5],
  ["brithday party", "Birthday Party Host (Kids / Adults)", 3],
  ["vedding", "Wedding Ceremony", 5],
  ["weding photo", "Wedding Ceremony", 3],
  ["prewedding", "Pre-Wedding Shoot", 3],
  ["pre wedding shoot", "Pre-Wedding Shoot", 1],
  ["dj", "Musicians & Live Band", 1],
  ["need a dj", "Musicians & Live Band", 1],
  ["need a dj for my party", "Corporate Annual Party Live Band Set", 3],
  ["singr", "Musicians & Live Band", 1],
  ["band", "Musicians & Live Band", 1],
  ["garba", "Navratri / Garba & Dandiya Raas Vocals", 3],
  ["standup", "Stand-Up Comedians", 1],
  ["stand up comedy", "Stand-Up Comedians", 1],
  ["comedian", "Stand-Up Comedians", 1],
  ["anchr", "Anchors and Hosts", 1],
  ["emcee", "Anchors and Hosts", 1],
  ["makup", "Makeup & Styling", 1],
  ["makeup artist", "Makeup & Styling", 1],
  ["bridal makeup", "Bridal makeup", 1],
  ["podcast", "Podcast", 3],
  ["reels", "Models & Creators", 3],
  ["influencer", "Models & Creators", 1],
  ["modle", "Models & Creators", 1],
];

// [what's typed, a title that must not show up at all]
const never: [string, string][] = [["brithday", "Bridal makeup"]];

// Typed text that must find nothing.
const nothing = ["xyzqq", "zzzz"];

let failed = 0;
for (const [query, want, top] of cases) {
  const got = search(query).map((r) => r.title);
  const at = got.indexOf(want);
  if (at === -1 || at >= top) {
    failed++;
    console.log(`FAIL "${query}": wanted "${want}" in the top ${top}, got ${JSON.stringify(got.slice(0, 5))}`);
  }
}
for (const [query, unwanted] of never) {
  if (search(query).some((r) => r.title === unwanted)) {
    failed++;
    console.log(`FAIL "${query}": "${unwanted}" should not show up`);
  }
}
for (const query of nothing) {
  const got = search(query).map((r) => r.title);
  if (got.length > 0) {
    failed++;
    console.log(`FAIL "${query}": wanted nothing, got ${JSON.stringify(got.slice(0, 5))}`);
  }
}

// Speed: every key press runs a search, so one must take well under a frame.
const queries = [...cases.map((c) => c[0]), ...nothing];
const rounds = 200;
for (const q of queries) search(q); // warm up first
const start = performance.now();
for (let i = 0; i < rounds; i++) for (const q of queries) search(q);
const each = (performance.now() - start) / (rounds * queries.length);
if (each > 2) {
  failed++;
  console.log(`FAIL speed: ${each.toFixed(3)} ms per search (limit 2 ms)`);
}

console.log(`${failed === 0 ? "All" : `${failed} failed of`} ${cases.length + never.length + nothing.length} search cases + speed · ${each.toFixed(3)} ms per search`);
process.exit(failed > 0 ? 1 : 0);
