// Checks that search returns the right top result for common queries and misspellings.
// Run with: npm run check:search
import { categories } from "../src/content/site.ts";
import { buildIndex, rank } from "../src/lib/fuzzy.ts";

const index = buildIndex(categories);

// query → the label expected in first place
const cases: Record<string, string> = {
  photo: "Photographers",
  fotography: "Photographers",
  phtogaphy: "Photographers",
  photgrapher: "Photographers",
  camera: "Photographers",
  weding: "Wedding photography",
  "wedding dj": "Wedding / sangeet DJ",
  dj: "Musicians & DJs",
  deejay: "Musicians & DJs",
  mua: "Makeup Artists",
  makup: "Makeup Artists",
  "bridal makup": "Makeup Artists",
  anchr: "Anchors & Hosts",
  emcee: "Corporate emcee",
  dron: "Drone Pilots",
  videographer: "Cinematographers",
  vidoe: "Cinematographers",
  cinematografer: "Cinematographers",
  standup: "Stand-up Comedians",
  singer: "Singers & Vocalists",
  garba: "Garba night vocals",
  edtor: "Editors",
  "need a photographer for my wedding": "Wedding photography",
};

let failed = 0;
for (const [query, expected] of Object.entries(cases)) {
  const top = rank(index, query, 3).map((r) => r.label);
  const ok = top[0] === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${query.padEnd(36)} → ${top.join(" | ") || "(no results)"}${ok ? "" : `   (expected "${expected}")`}`);
}

for (const query of ["xyzqq", "qwerty"]) {
  const top = rank(index, query, 3);
  if (top.length > 0) failed++;
  console.log(`${top.length === 0 ? "✓" : "✗"} ${query.padEnd(36)} → ${top.length === 0 ? "(no results, as expected)" : top.map((r) => r.label).join(" | ")}`);
}

console.log(failed === 0 ? "\nAll search checks passed." : `\n${failed} search check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
