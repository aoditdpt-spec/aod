// "Brief for the artists": the optional box after the event details in the booking questions
// (src/components/home/ArtistBrief.tsx), written in the customer's own words and saved as `note`.
// It used to be quick questions for each kind of artist plus preferences and reference links;
// those questions stay here only so older bookings' briefs (`byCategory`, `preferences`,
// `references`) still read correctly everywhere.
// The brief is saved with the booking (`brief`) and travels with it: the WhatsApp message, the
// team's and customer's emails, the sheet, the admin's booking drawer, and the artist portal.
// No imports, so it can be checked on its own and used on the server and in the browser alike.

export type BriefQuestion = {
  id: string;
  label: string;
  kind: "one" | "many" | "text";
  options?: string[];
  placeholder?: string;
};

export type BriefAnswers = Record<string, string | string[]>;
export type Brief = {
  byCategory?: Record<string, BriefAnswers>; // category slug → question id → answer
  preferences?: string; // about the artist: "a female makeup artist", "Gujarati-speaking"
  references?: string; // links to looks, edits or playlists they like
  note?: string; // anything else
};

const coverage: BriefQuestion = { id: "coverage", label: "Coverage", kind: "one", options: ["Up to 4 hours", "Half day", "Full day", "More than one day"] };
const languages = (id = "languages", label = "Languages"): BriefQuestion => ({ id, label, kind: "many", options: ["Gujarati", "Hindi", "English", "Punjabi"] });

export const briefQuestions: Record<string, BriefQuestion[]> = {
  photographers: [
    { id: "style", label: "Photography style", kind: "many", options: ["Candid", "Traditional", "Cinematic", "Documentary", "Fashion / editorial"] },
    coverage,
    { id: "deliverables", label: "What you'd like", kind: "many", options: ["Edited photos", "All the photos (unedited too)", "Printed album", "Sneak peeks the same day"] },
    { id: "shots", label: "Must-have shots", kind: "text", placeholder: "Family portraits, the varmala, décor details…" },
  ],
  cinematographers: [
    { id: "film", label: "Films you'd like", kind: "many", options: ["Highlight film (3–5 min)", "Full-length film", "Teaser", "Reels"] },
    { id: "style", label: "Style", kind: "one", options: ["Cinematic", "Documentary", "Traditional"] },
    coverage,
    { id: "moments", label: "Moments to capture", kind: "text", placeholder: "Entry, vows, speeches, the after-party…" },
  ],
  "drone-pilots": [
    { id: "shots", label: "Shots you want", kind: "many", options: ["Aerial photos", "Aerial video", "Venue reveal", "Baraat / procession"] },
    { id: "permission", label: "Drones allowed at the venue?", kind: "one", options: ["Yes", "Not sure", "Please help us check"] },
  ],
  "anchors-hosts": [
    languages(),
    { id: "tone", label: "Tone", kind: "one", options: ["Formal", "Fun and interactive", "A mix"] },
    { id: "audience", label: "Audience", kind: "one", options: ["Under 100", "100–300", "300–1,000", "More than 1,000"] },
    { id: "segments", label: "What they'll host", kind: "text", placeholder: "Welcome, games, award ceremony, couple's entry…" },
  ],
  editors: [
    { id: "material", label: "What needs editing", kind: "many", options: ["Photos", "Wedding film", "Reels", "Album design"] },
    { id: "files", label: "The footage", kind: "one", options: ["I'll share the files", "From the AOD shoot"] },
    { id: "turnaround", label: "When you need it", kind: "one", options: ["Within a week", "2–3 weeks", "No rush"] },
    { id: "style", label: "Edits you like", kind: "text", placeholder: "Moody, bright, fast cuts, slow and emotional…" },
  ],
  "musicians-djs": [
    { id: "act", label: "Act", kind: "one", options: ["DJ", "Live band", "Solo instrumentalist", "DJ with live dhol"] },
    { id: "music", label: "Music", kind: "many", options: ["Bollywood", "Punjabi", "Garba / Gujarati", "English / EDM", "Retro", "Sufi"] },
    { id: "sound", label: "Sound and lights", kind: "one", options: ["The artist brings them", "The venue has sound", "Not sure"] },
    { id: "songs", label: "Must-play (or never-play) songs", kind: "text", placeholder: "Opening song, the couple's song…" },
  ],
  comedians: [
    languages("language", "Language"),
    { id: "audience", label: "Audience", kind: "one", options: ["Corporate", "Family, all ages", "Adults only"] },
    { id: "length", label: "Set length", kind: "one", options: ["15–20 min", "30–45 min", "An hour or more"] },
    { id: "avoid", label: "Topics to avoid", kind: "text", placeholder: "Politics, religion…" },
  ],
  singers: [
    { id: "music", label: "Songs", kind: "many", options: ["Bollywood", "Sufi / ghazal", "Garba / folk", "Devotional", "Western"] },
    languages(),
    { id: "accompaniment", label: "Music behind them", kind: "one", options: ["A live band", "A backing track", "Not sure"] },
    { id: "songs", label: "Songs you'd love to hear", kind: "text", placeholder: "Kesariya, a garba medley…" },
  ],
  "makeup-artists": [
    { id: "looks", label: "Looks needed", kind: "many", options: ["Bride / groom", "Family members", "Guests", "A shoot"] },
    { id: "people", label: "How many people", kind: "one", options: ["1", "2–3", "4–6", "7 or more"] },
    { id: "style", label: "Style", kind: "one", options: ["Natural / soft glam", "HD / airbrush", "Bold glam", "Not sure yet"] },
    { id: "extras", label: "Also", kind: "many", options: ["Hair styling", "Saree / dupatta draping", "A trial session"] },
  ],
  models: [
    { id: "work", label: "The work", kind: "many", options: ["Product / e-commerce", "Fashion / apparel", "Ramp", "Promotional event"] },
    { id: "look", label: "The look you want", kind: "text", placeholder: "Age range, height, style, wardrobe…" },
    { id: "usage", label: "Where the photos will be used", kind: "many", options: ["Social media", "Website", "Print", "Hoardings / ads"] },
  ],
  "content-creators": [
    { id: "platforms", label: "Platforms", kind: "many", options: ["Instagram Reels", "YouTube Shorts", "Website / ads"] },
    { id: "count", label: "How many videos", kind: "one", options: ["1–2", "3–5", "6–10", "More than 10"] },
    { id: "style", label: "Style", kind: "many", options: ["Same-day event reels", "Product / UGC", "Talking to camera", "Trends"] },
    { id: "posting", label: "Posted by", kind: "one", options: ["Us", "A collab post with the creator", "Not sure"] },
  ],
};

// Asked once for the whole request, whoever is booked.
export const briefCommon = {
  title: "Brief for the artists",
  optional: "Optional",
  intro: "Anything that helps the artists quote and come prepared, in your own words.",
  preferences: { label: "Anything about the artist you'd prefer?", placeholder: "A female makeup artist, a Gujarati-speaking anchor, someone who has worked at this venue…" },
  references: { label: "Reference links", placeholder: "Instagram, Pinterest or YouTube links to looks, edits or playlists you like" },
  note: { label: "Brief for the artists", placeholder: "The style you like, must-have shots, songs, looks, links to references, dress code, the schedule…" },
  labels: { preferences: "Artist preferences", references: "References", note: "Brief" },
};

const MAX_TEXT = 300;
const MAX_COMMON = 1000;
const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+\n/g, "\n").slice(0, max) : "");

// Only what the questions allow: known categories (the ones booked), known questions, listed
// choices, text cut to length; empty answers dropped. Used by the form and again by the server.
export function cleanBrief(input: unknown, categories: string[]): Brief {
  const raw = (input && typeof input === "object" ? input : {}) as Brief;
  const out: Brief = {};
  const byCategory: Record<string, BriefAnswers> = {};
  for (const slug of categories) {
    const given = raw.byCategory?.[slug];
    if (!given || typeof given !== "object") continue;
    const answers: BriefAnswers = {};
    for (const q of briefQuestions[slug] ?? []) {
      const v = given[q.id];
      if (q.kind === "text") {
        const t = clip(v, MAX_TEXT);
        if (t) answers[q.id] = t;
      } else if (q.kind === "one") {
        if (typeof v === "string" && q.options?.includes(v)) answers[q.id] = v;
      } else {
        const picked = (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === "string" && Boolean(q.options?.includes(x)));
        if (picked.length) answers[q.id] = [...new Set(picked)];
      }
    }
    if (Object.keys(answers).length) byCategory[slug] = answers;
  }
  if (Object.keys(byCategory).length) out.byCategory = byCategory;
  for (const key of ["preferences", "references", "note"] as const) {
    const t = clip(raw[key], MAX_COMMON);
    if (t) out[key] = t;
  }
  return out;
}

export const briefIsEmpty = (b: Brief | undefined) => !b || (!b.byCategory && !b.preferences && !b.references && !b.note);

// One category's answers as label and value, in the questions' order.
export function briefRows(brief: Brief | undefined, slug: string): { label: string; value: string }[] {
  const answers = brief?.byCategory?.[slug];
  if (!answers) return [];
  return (briefQuestions[slug] ?? [])
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => ({ label: q.label, value: [answers[q.id]].flat().join(", ") }));
}

// The answers for everyone: preferences, references and anything else.
export function briefCommonRows(brief: Brief | undefined): { label: string; value: string }[] {
  if (!brief) return [];
  return (["preferences", "references", "note"] as const).filter((k) => brief[k]).map((k) => ({ label: briefCommon.labels[k], value: brief[k]! }));
}

// The brief as lines for the WhatsApp message, emails and the sheet:
//   "Photographers: Photography style: Candid, Cinematic · Coverage: Full day"
//   "Artist preferences: …"
// `name` turns a category slug into its name; `only` limits it to some categories (a sheet tab).
export function briefLines(brief: Brief | undefined, name: (slug: string) => string, only?: string[]): string[] {
  if (!brief) return [];
  const slugs = Object.keys(brief.byCategory ?? {}).filter((s) => !only || only.includes(s));
  return [
    ...slugs.map((s) => `${name(s)}: ${briefRows(brief, s).map((r) => `${r.label}: ${r.value}`).join(" · ")}`),
    ...briefCommonRows(brief).map((r) => `${r.label}: ${r.value.replace(/\n+/g, " ")}`),
  ];
}
