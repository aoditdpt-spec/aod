// Complete Your Details (the artist portal, after the account is made): what kind of artist they
// are, the services they offer and each kind's own questions, as on aod.co.in's application
// (aod-old's src/content/artist-portal.ts, from AOD's Google Forms for each kind of artist),
// ported on 2026-11-21. Editors aren't here: the redesign has no Editors (see site.ts). Labels and
// choices are in Title Case like the rest of the redesign (title() below); hints stay as
// sentences. Answers are saved by "<kind>.<question id>" in the application's details, and the
// admin shows them with the kind's name and the question's short label.

import { categories } from "@/data/site";

export type WorkQuestion = {
  id: string;
  label: string;
  short: string; // the label in the admin
  kind: "one" | "many" | "text" | "long" | "link"; // long: a few lines; link: a Google Drive link to photos
  options?: string[];
  hint?: string;
  optional?: boolean;
  showIf?: { id: string; is?: string }; // without `is`: once that question has an answer other than "None"
};

// "full-time professional" -> "Full-Time Professional": every word (and every part of a hyphenated
// or slashed word) starts with a capital; words that start with anything else ("(3", "1–3") stay.
const title = (s: string) => s.replace(/(^|[\s\-/(])([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());

// The kinds of artist, each with its own questions; `cat` is the redesign's category it belongs to.
export const kinds: { id: string; name: string; cat: string }[] = [
  { id: "photographers", name: "Photographer", cat: "photo-video" },
  { id: "cinematographers", name: "Cinematographer", cat: "photo-video" },
  { id: "drone-pilots", name: "Drone Operator", cat: "photo-video" },
  { id: "anchors-hosts", name: "Anchor / Host", cat: "anchors-hosts" },
  { id: "musicians-djs", name: "Musician / Live Band", cat: "musicians-djs" },
  { id: "singers", name: "Singer", cat: "musicians-djs" },
  { id: "comedians", name: "Stand-Up Comedian", cat: "comedians" },
  { id: "models", name: "Model", cat: "models-creators" },
  { id: "content-creators", name: "Influencer / Reel Creator", cat: "models-creators" },
  { id: "makeup-artists", name: "Makeup Artist", cat: "makeup-styling" },
];
export const kindName = (id: string) => kinds.find((k) => k.id === id)?.name ?? id;

// The kind an application's craft ("Photographers", "DJ", "Reel Creator"…) and category stand for.
const crafts: Record<string, string> = {
  photographer: "photographers",
  cinematographer: "cinematographers",
  "drone operator": "drone-pilots",
  "drone pilot": "drone-pilots",
  anchor: "anchors-hosts",
  host: "anchors-hosts",
  musician: "musicians-djs",
  dj: "musicians-djs", // the kind was "DJs" until 2026-11-21
  "live band": "musicians-djs",
  singer: "singers",
  "stand-up comedian": "comedians",
  comedian: "comedians",
  model: "models",
  influencer: "content-creators",
  "reel creator": "content-creators",
  "content creator": "content-creators",
  "makeup artist": "makeup-artists",
};
const byCategory: Record<string, string> = {
  "photo-video": "photographers",
  "anchors-hosts": "anchors-hosts",
  "musicians-djs": "musicians-djs",
  comedians: "comedians",
  "models-creators": "models",
  "makeup-styling": "makeup-artists",
};
export function kindOf(craft: string, cat: string): string {
  const c = craft.trim().toLowerCase().replace(/s$/, "");
  return crafts[c] ?? byCategory[cat] ?? "photographers";
}

// Experience, as the sign-up asks it (src/components/artists/ApplyForm.tsx); checked again on the server.
export const experienceLevels = ["Less Than 1 Year", "1 To 3 Years", "3 To 5 Years", "More Than 5 Years"];

export const languages = ["Gujarati", "Hindi", "English", "Marathi", "Punjabi", "Urdu", "Bengali", "Tamil"];

// "Services You Offer": a short list for each kind (similar services joined), as on aod.co.in. A
// kind without one uses its category's services.
const serviceLists: Record<string, string[]> = {
  photographers: [
    "Corporate Events & Conferences",
    "Industrial, Architecture & Interior Shoots",
    "Portraits, Headshots & Model Portfolios",
    "Birthdays, Anniversaries & Kitty Parties",
    "Engagement Ceremony",
    "Maternity, Baby Shower & Newborn",
    "Wedding Ceremony & Reception",
    "Pre-Wedding Shoot",
    "Sangeet, Haldi & Mehendi",
    "Product Shoots",
    "Festival Shoots",
    "Fashion Lookbook & Ramp",
  ],
  cinematographers: [
    "Corporate Films, Interviews & Testimonials",
    "Conference & Summit Recap",
    "Birthday, Anniversary & Family Events",
    "Cinematic Wedding Films",
    "Pre-Wedding Films",
    "Festival & Cultural Events",
    "Reels, Shorts & Social Video",
    "Podcast",
  ],
  "drone-pilots": ["Real Estate, Resorts & Commercial", "Industrial Plants & Factories", "Destination Wedding Aerials"],
  "anchors-hosts": ["Corporate Summits, Conferences & Awards", "Panels, Webinars & Product Launches", "Weddings, Engagements & Sangeet", "Birthday & Kitty Party Host", "Podcast Host"],
  "musicians-djs": ["Corporate Gala & Brand Live Band Sets", "Wedding Sangeet & Cocktail Live Band", "Live Acoustic Sets", "Birthday & Anniversary Live Band"],
  comedians: ["Corporate Shows & Offsites", "Milestone Birthday Shows", "Wedding Sangeet Stand-Up", "Private & Bachelor / Bachelorette Parties", "College Festivals & Club Nights"],
  singers: ["Corporate & Executive Dinners", "Navratri / Garba & Dandiya", "Wedding Sangeet & Cocktail", "Sufi, Bollywood & Ghazal Nights", "Milestone Birthday & Anniversary"],
};
export function serviceOptions(kind: string): string[] {
  if (serviceLists[kind]) return serviceLists[kind];
  const cat = categories.find((c) => c.slug === kinds.find((k) => k.id === kind)?.cat);
  return cat ? [...new Set(cat.groups.flatMap((g) => g.services).map(title))] : [];
}

const yesNo = ["Yes", "No"];
const one = (id: string, label: string, short: string, options = yesNo): WorkQuestion => ({ id, label: title(label), short: title(short), kind: "one", options: options.map(title) });
const many = (id: string, label: string, short: string, options: string[]): WorkQuestion => ({ id, label: title(label), short: title(short), kind: "many", options: options.map(title), hint: "Pick all that apply." });
const typed = (id: string, label: string, short: string, hint: string): WorkQuestion => ({ id, label: title(label), short: title(short), kind: "text", hint });
// Photos of the equipment just named: a Google Drive link, asked once that question is answered
// (and not "None"), so the team sees the gear is real.
const gearPhotos = (after: string, label: string, what: string): WorkQuestion => ({
  id: "equipmentPhotos",
  label: title(label),
  short: "Equipment Photos",
  kind: "link",
  hint: `Put photos of ${what} in a Google Drive folder, set its sharing to "Anyone with the link", and paste the link here.`,
  showIf: { id: after },
});

const levels = ["Full-time Professional", "Freelance", "Part-time", "Student / Beginner"];
const level = (who: string, options = levels) => one("level", `Are you a professional ${who}?`, "Works as", options);
const travel = (what: string) => one("travel", `Are you willing to travel for ${what} if required?`, "Travels", ["Yes", "No", "Within my city only"]);
const paid = (what: string, depends = "Depends on project") => one("paid", `Are you open to paid ${what} through AOD?`, "Open to paid work", ["Yes", depends, "No"]);
// "Have you worked with brands…?" and, if yes, which ones (optional).
const brandWork = (label = "Have you worked with brands, artists or events before?", follow = "Mention notable brands, clients or events"): WorkQuestion[] => [
  one("brandWork", label, "Worked with brands"),
  { id: "brandWorkDetails", label: title(follow), short: "Brands / Clients", kind: "long", optional: true, showIf: { id: "brandWork", is: "Yes" } },
];
const camera = (who: string, what: string, specialisations: string[]): WorkQuestion[] => [
  level(who),
  many("specialisations", `Your ${what} specialisation`, "Specialisation", specialisations),
  one("editor", "Are you an editor as well, or do you have an editor with you?", "Edits / has an editor"),
  travel("shoots"),
  many("equipment", "Equipment you use", "Equipment", ["DSLR", "Mirrorless", "Gimbal", "Drone", "Studio lights"]),
  typed("cameraBrand", "Camera brand", "Camera brand", "E.g. Sony, Canon, Nikon, Fujifilm."),
  gearPhotos("cameraBrand", "Photos of your equipment (Google Drive link)", "your camera, lenses and the other gear you picked"),
  ...brandWork(),
];
const shootTypes = ["Wedding", "Pre-wedding", "Fashion", "Portrait", "Product", "Event", "Corporate", "Lifestyle", "Travel", "Creative / Cinematic", "Other"];
const filmTypes = [...shootTypes.slice(0, -1), "Podcast", "Other"];

export const workQuestions: Record<string, WorkQuestion[]> = {
  photographers: camera("photographer", "photography", shootTypes),
  cinematographers: camera("cinematographer", "cinematography", filmTypes),
  "drone-pilots": [
    level("drone pilot"),
    many("specialisations", "What do you fly for?", "Specialisation", ["Wedding", "Event", "Real estate", "Construction / progress", "Corporate", "Tourism / travel", "FPV", "Other"]),
    one("licence", "Do you have a DGCA remote pilot certificate?", "DGCA certificate"),
    typed("drones", "Drones you fly", "Drones", "E.g. DJI Mini 4 Pro, Air 3, Mavic 3."),
    gearPhotos("drones", "Photos of your drones (Google Drive link)", "your drones and controllers"),
    one("editor", "Do you edit the footage as well, or have an editor with you?", "Edits / has an editor"),
    travel("shoots"),
    ...brandWork(),
  ],
  // From the "Host / Anchor – Registration" form.
  "anchors-hosts": [
    level("host / anchor", ["Full-time Professional", "Freelance", "Part-time", "Beginner"]),
    many("specialisations", "Type of hosting experience", "Hosting experience", ["Corporate Events", "Weddings", "Stage Shows", "Live Concerts", "Award Functions", "Exhibitions / Trade Shows", "Digital / Online Events", "Radio / Podcast Hosting", "Other"]),
    many("style", "Hosting style", "Hosting style", ["Formal / Corporate", "Energetic / Entertaining", "Interactive / Crowd Engagement", "Luxury / Premium", "Youth / Fun"]),
    ...brandWork("Have you hosted events for brands or corporate clients before?", "Mention notable events or brands"),
    paid("hosting assignments", "Depends on event"),
    many("preferredEvents", "Preferred type of events", "Preferred events", ["Corporate Events", "Weddings", "Brand Launches", "College Festivals", "Private Parties", "Virtual Events"]),
    travel("events"),
  ],
  "musicians-djs": [
    level("musician or live band"),
    many("specialisations", "What you play", "Specialisation", ["Wedding / Sangeet", "Club / Lounge", "Corporate", "Bollywood", "Garba / Dandiya", "Live band", "Sufi / Ghazal", "Instrumental", "Other"]),
    one("lineUp", "Do you perform solo or with a band?", "Line-up", ["Solo", "Duo", "Band (3 or more)"]),
    many("equipment", "Equipment you bring", "Equipment", ["DJ controller / CDJs", "Speakers / PA", "Microphones", "Lights", "Smoke / effects", "Instruments", "None"]),
    gearPhotos("equipment", "Photos of your equipment (Google Drive link)", "the equipment you bring"),
    travel("events"),
    ...brandWork(),
  ],
  // From the "Comedian – Registration" form.
  comedians: [
    level("comedian"),
    many("specialisations", "Type of comedy you perform", "Comedy", ["Stand-up Comedy", "Observational Comedy", "Dark Comedy", "Improvisation (Improv)", "Crowd Work", "Scripted Comedy", "Character Comedy", "Other"]),
    many("performLanguages", "Languages you perform in", "Performs in", ["English", "Hindi", "Gujarati", "Hinglish", "Other"]),
    many("events", "Types of events you have performed at", "Performed at", ["Corporate Events", "Private Parties", "Weddings / Sangeet", "Clubs / Open Mics", "College Events", "Ticketed Shows", "Online Shows", "Other"]),
    one("setLength", "Average performance duration", "Set length", ["5–10 minutes", "10–20 minutes", "20–40 minutes", "40+ minutes"]),
    { ...one("crowdComfort", "Comfort level with live audience interaction", "Crowd comfort", ["1", "2", "3", "4", "5"]), hint: "1 = not comfortable, 5 = very comfortable." },
    one("customContent", "Do you create customised content for events?", "Custom content", ["Yes", "No", "Depends on requirement"]),
    ...brandWork("Have you worked with brands, artists or events before?", "Mention notable collaborations, shows or performances"),
    paid("projects"),
    travel("shows"),
  ],
  singers: [
    level("singer"),
    many("specialisations", "Genres you sing", "Genres", ["Bollywood", "Ghazal", "Sufi", "Devotional / Bhajan", "Garba / Folk", "Western", "Classical", "Retro", "Other"]),
    one("liveWith", "How do you perform?", "Performs with", ["With a live band", "With karaoke tracks", "Both"]),
    one("sound", "Do you bring your own sound system?", "Own sound system"),
    { ...gearPhotos("sound", "Photos of your sound system (Google Drive link)", "your sound system"), showIf: { id: "sound", is: "Yes" } },
    travel("events"),
    ...brandWork(),
  ],
  // From the "Makeup Artist – Registration" form.
  "makeup-artists": [
    level("make-up artist"),
    many("specialisations", "Make-up specialisation", "Specialisation", ["Bridal Make-Up", "Party / Occasion Make-Up", "Fashion / Editorial", "Celebrity / Artist Make-Up", "HD Make-Up", "Airbrush Make-Up", "Natural / Minimal Look", "Special Effects (SFX)", "Other"]),
    ...brandWork("Have you worked with brands, artists, salons or events before?", "Mention notable collaborations or clients"),
    typed("products", "Make-up products / brands you use", "Products", "E.g. MAC, Huda Beauty, Bobbi Brown, Kryolan."),
    one("hygiene", "Do you follow proper hygiene and sanitisation practices?", "Hygiene", ["Yes, strictly", "Yes, basic hygiene", "Learning / Improving"]),
    paid("collaborations"),
    many("preferredProjects", "Preferred type of projects", "Preferred projects", ["Bridal Assignments", "Brand Shoots", "Artist / Influencer Shoots", "Fashion Shows", "Events", "Commercial Campaigns"]),
    travel("assignments"),
  ],
  models: [
    level("model"),
    many("specialisations", "Kind of modelling", "Specialisation", ["Fashion / Ramp", "Print / Catalogue", "Commercial / Ads", "Ethnic / Bridal", "Fitness", "Promotional / Hostess", "Other"]),
    typed("height", "Your height", "Height", "E.g. 5′7″ or 170 cm."),
    one("portfolioShoot", "Do you have a professional portfolio shoot?", "Portfolio shoot"),
    travel("shoots"),
    ...brandWork(),
  ],
  "content-creators": [
    level("content creator"),
    many("specialisations", "Content you make", "Content", ["Instagram reels", "Brand content", "Event reels (same day)", "UGC / product videos", "Food", "Fashion / Lifestyle", "Travel", "Other"]),
    one("process", "Do you shoot and edit yourself?", "Shoots / edits", ["Shoot and edit", "Shoot only", "Edit only"]),
    one("onCamera", "Do you appear on camera?", "On camera"),
    many("equipment", "Equipment you use", "Equipment", ["Phone", "Mirrorless / DSLR", "Gimbal", "Microphone", "Lights", "Drone"]),
    gearPhotos("equipment", "Photos of your equipment (Google Drive link)", "the equipment you picked"),
    one("followers", "Your Instagram followers", "Followers", ["Under 1K", "1K–10K", "10K–50K", "50K–1L", "Over 1L"]),
    ...brandWork(),
  ],
};

// The label of a saved answer in the admin: "Photographer: Camera Brand". Older answers saved by
// category ("photo-video.level") fall back to their id.
export function workAnswerLabel(key: string) {
  const [kind, id] = key.split(".");
  const q = workQuestions[kind]?.find((x) => x.id === id);
  return `${kindName(kind)}: ${q?.short ?? id}`;
}

// Whether a question is on screen for one kind's answers (keyed by question id): a `showIf`
// question only after the given choice, or (without one) once that question has an answer other
// than "None".
export function workQuestionShown(q: WorkQuestion, answers: Record<string, string | string[] | undefined>) {
  if (!q.showIf) return true;
  const given = [answers[q.showIf.id] ?? []].flat().filter((a) => a.trim() !== "");
  return q.showIf.is !== undefined ? given.includes(q.showIf.is) : given.some((a) => a !== "None");
}

// "None" can't be picked with another choice; "Other" asks for the artist's own words, kept as
// "Other: <what they wrote>".
export const OTHER = "Other";
const otherPrefix = `${OTHER}: `;
export const isOther = (answer: string) => answer === OTHER || answer.startsWith(otherPrefix);
export const otherText = (answers: string[]) => answers.find((a) => a.startsWith(otherPrefix))?.slice(otherPrefix.length) ?? "";
export const withOtherText = (text: string) => (text.trim() ? `${otherPrefix}${text.trimStart().slice(0, 60)}` : OTHER);
// A "many" answer after a tap on `choice`.
export function toggleChoice(previous: string[], choice: string): string[] {
  const on = choice === OTHER ? previous.some(isOther) : previous.includes(choice);
  if (on) return previous.filter((c) => (choice === OTHER ? !isOther(c) : c !== choice));
  if (choice === "None") return ["None"];
  return [...previous.filter((c) => c !== "None"), choice];
}
