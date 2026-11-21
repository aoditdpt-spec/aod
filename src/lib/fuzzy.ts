// Typo-tolerant, ranked search. No imports from the app, so `npm run check:search` can test it on
// its own. It forgives the mistakes people make on a phone keyboard:
// - typos and swapped letters: "bisthdas" → birthday, "phtoographer" → photographer
// - spelling by sound: "fotografer" → photographer, "vedding" → wedding
// - half-typed words, with or without a typo: "cinem", "cinma" → cinematographer
// - joined or split words: "standup", "stand up", "pre wedding", "prewedding"
// - filler words: "need a dj for my party" searches "dj party"
// Fast enough to run on every key press: everything about the list is worked out once, and the
// typo check gives up as soon as a word is clearly too different.

export type SearchEntry<T> = {
  item: T;
  boost?: number; // added to a match's score (categories outrank a single service)
  fields: { text: string; weight: number }[]; // what it answers to, the most important first
};

type Word = { plain: string; sound: string };
type Prepared<T> = { item: T; boost: number; words: { id: number; weight: number }[]; title: string };

// Words that carry no meaning in a search like "need a photographer for my wedding".
const STOP_WORDS = new Set([
  "a", "an", "the", "for", "in", "at", "of", "and", "or", "my", "me", "i", "we", "our", "need", "needed",
  "want", "looking", "book", "booking", "hire", "near", "best", "good", "top", "cheap", "to", "with", "on", "some",
]);

const MIN_WORD_SCORE = 35; // below this a typed word doesn't count as matched

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const split = (text: string) => normalize(text).split(" ").filter(Boolean);

// Spelling by sound, so "fotografy" and "photography" look the same: ph→f, ck/q/c(a,o,u)→k,
// z→s, w→v, a final y→i, silent h after a consonant, doubled letters collapsed.
function sound(word: string): string {
  return word
    .replace(/ph/g, "f")
    .replace(/ck|q/g, "k")
    .replace(/c(?=[aou])/g, "k")
    .replace(/z/g, "s")
    .replace(/w/g, "v")
    .replace(/([bdgkt])h/g, "$1")
    .replace(/y$/, "i")
    .replace(/(.)\1+/g, "$1");
}

// Edit distance (a swap of two neighbouring letters counts as one edit), or max + 1 as soon as
// it's clear the words are more than `max` edits apart.
function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let before = new Array<number>(b.length + 1);
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  let next = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    next[0] = i;
    let smallest = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, before[j - 2] + 1);
      next[j] = d;
      if (d < smallest) smallest = d;
    }
    if (smallest > max) return max + 1;
    [before, row, next] = [row, next, before];
  }
  return row[b.length];
}

// Edits between a half-typed word and the start of a longer word (its first letters, give or
// take one), or max + 1 when the word isn't longer.
function nearStart(t: string, word: string, max: number): number {
  const k = t.length;
  if (word.length <= k + 1) return max + 1;
  let d = distance(t, word.slice(0, k), max);
  if (d > 0) d = Math.min(d, distance(t, word.slice(0, k + 1), max));
  if (d > 0) d = Math.min(d, distance(t, word.slice(0, k - 1), max));
  return d;
}

// How many mistakes to forgive in a typed word of this length.
function allowed(length: number): number {
  if (length <= 3) return 0;
  if (length <= 5) return 1;
  if (length <= 8) return 2;
  return 3;
}

// 0–100: how well one typed word matches one word of the list.
function wordScore(typed: string, typedSound: string, word: Word): number {
  const w = word.plain;
  if (w === typed) return 100;
  if (w.startsWith(typed)) return 70 + (25 * typed.length) / w.length;
  if (typed.length < 3) return 0;
  if (w.includes(typed)) return 50;

  // Sound-alike only for words with some substance ("zzzz" sounds like "s", which isn't one).
  const s = word.sound;
  if (typedSound.length >= 3) {
    if (s === typedSound) return 92;
    if (s.startsWith(typedSound)) return 65 + (20 * typedSound.length) / s.length;
  }

  const max = allowed(typed.length);
  if (max === 0) return 0;
  // People rarely get the first letters wrong: skip the slower checks unless the start agrees
  // (in spelling or by sound). Keeps a search well under a millisecond.
  if (typed[0] !== w[0] && typed[0] !== w[1] && typed[1] !== w[0] && typedSound[0] !== word.sound[0]) return 0;
  const n = typedSound.length; // sound-alike checks only once it has some substance
  let best = 0;
  // A mistake in the whole word: "bisthdas" ~ "birthday". Going by sound counts one more
  // mistake, so loose sound-alikes ("brithday" ~ "bridal") don't creep in.
  const whole = Math.min(distance(typed, w, max), n >= 3 ? distance(typedSound, s, max) + 1 : max + 1);
  if (whole <= max) best = 75 - whole * 10;
  // A mistake in a half-typed word: "cinma" ~ the start of "cinematographer" (by sound, one
  // more mistake, as above).
  const part = Math.min(nearStart(typed, w, max), n >= 3 ? nearStart(typedSound, s, max) + 1 : max + 1);
  if (part <= max) best = Math.max(best, 62 - part * 10);
  return best;
}

export function createSearch<T>(entries: SearchEntry<T>[]) {
  // Every different word in the list, once: entries share many (a service answers to its
  // category's name and search words too), so each typed word is compared with each word once.
  const vocab: Word[] = [];
  const vocabIndex = new Map<string, number>();
  const wordId = (plain: string) => {
    let id = vocabIndex.get(plain);
    if (id === undefined) {
      id = vocab.push({ plain, sound: sound(plain) }) - 1;
      vocabIndex.set(plain, id);
    }
    return id;
  };

  const prepared: Prepared<T>[] = entries.map((e) => {
    const byWord = new Map<number, number>();
    const add = (word: string, weight: number) => {
      if (!word) return;
      const id = wordId(word);
      if ((byWord.get(id) ?? 0) < weight) byWord.set(id, weight);
    };
    for (const f of e.fields) {
      const parts = split(f.text);
      parts.forEach((p) => add(p, f.weight));
      // Joined forms, so "standup" and "prewedding" find "Stand-up" and "Pre-Wedding".
      for (let i = 0; i + 1 < parts.length; i++) add(parts[i] + parts[i + 1], f.weight);
    }
    return {
      item: e.item,
      boost: e.boost ?? 0,
      title: normalize(e.fields[0]?.text ?? ""),
      words: [...byWord].map(([id, weight]) => ({ id, weight })),
    };
  });

  // The best matches for what was typed, best first. Every meaningful word typed must match;
  // if no entry matches them all, entries matching some of them are shown instead.
  return function search(query: string, limit = 40): T[] {
    const all = split(query);
    const meaningful = all.filter((w) => !STOP_WORDS.has(w));
    const typed = meaningful.length > 0 ? meaningful : all;
    if (typed.length === 0) return [];
    const phrase = typed.join(" ");
    // Each typed word against each different word of the list, once.
    const scores = typed.map((t) => {
      const ts = sound(t);
      return vocab.map((w) => wordScore(t, ts, w));
    });

    const scored = prepared.map((entry) => {
      let score = 0;
      let matched = 0;
      for (const perWord of scores) {
        let best = 0;
        for (const { id, weight } of entry.words) {
          const s = perWord[id] * weight;
          if (s > best) best = s;
        }
        if (best >= MIN_WORD_SCORE) {
          matched++;
          score += best;
        }
      }
      if (matched > 0) {
        if (entry.title.startsWith(phrase)) score += 40;
        score += entry.boost;
      }
      return { entry, score, matched };
    });

    const full = scored.filter((s) => s.matched === typed.length);
    const pool = full.length > 0 ? full : scored.filter((s) => s.matched > 0);
    return pool
      .sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length)
      .slice(0, limit)
      .map((s) => s.entry.item);
  };
}
