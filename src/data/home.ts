// Homepage copy. Headings and buttons are in Title Case; sentences are not.
// No ratings, counts or promises that aren't real yet (the old site's audit rules).

export const hero = {
  // "Book a <word>" (small a), one word after another (the owner's list, 2026-11-19). The words are singular
  // so they read after "a"; a word starting with a vowel gets "an" (Book an Anchor).
  before: "Book",
  words: ["Photographer", "Cinematographer", "Drone Operator", "Anchor", "Host", "Musician", "Singer", "Model", "Influencer"],
  label: "Book a verified artist.", // what screen readers hear for the heading
};

// The grid under the hero's heading (HeroMosaic.tsx): 5 columns by 2 rows on laptops, text and
// photos taking turns (text, photo, text, photo, text / photo, text, photo, text, photo), in the
// style of snappr.com. Photos: the owner's set (public/home); the model and the singer swapped places
// the drone pilot took the comedian's place and a DJ the singer's (2026-11-20).
// PLACEHOLDER FIGURES, on request (2026-11-19, "pure larp"): these numbers are not real AOD data.
// The old-site audit rule is to show only real numbers, so replace them with real figures (or
// remove them) before launch.
export const heroMosaic: ({ kind: "text"; value: string; label: string } | { kind: "photo"; src: string; alt: string })[] = [
  { kind: "text", value: "100K+", label: "Photos Shot" },
  { kind: "photo", src: "/home/photographer-main.jpg", alt: "A photographer setting up a camera in a studio" },
  { kind: "text", value: "60K+", label: "Frames Of Video Delivered" },
  { kind: "photo", src: "/home/model.jpg", alt: "A model at a studio shoot" },
  { kind: "text", value: "500+", label: "Hours Of Live Music" },
  { kind: "photo", src: "/home/anchor.jpg", alt: "An anchor on stage at a corporate event" },
  { kind: "text", value: "20+", label: "Events Hosted By Our Anchors" },
  { kind: "photo", src: "/home/drone-pilot.jpg", alt: "A drone pilot flying a drone at sunset" },
  { kind: "text", value: "1M+", label: "Views On Reels We Made" },
  { kind: "photo", src: "/home/dj.jpg", alt: "A live band playing to a crowd" },
];

// Each category's picture on the homepage cards (public/categories/icons): the owner's set, made in
// the style of Urban Company's category icons (2026-11-19): people at work, on white (the cards
// blend the white away). Stand-Up Comedians is the owner's comedian with a mic (2026-11-20).
export const categoryIcons: Record<string, string> = {
  // Transparent cut-outs (2026-11-21), 512px squares, each person standing on the bottom edge.
  "photo-video": "/categories/icons/cutout-photographer.png",
  "anchors-hosts": "/categories/icons/cutout-anchor.png",
  "musicians-djs": "/categories/icons/cutout-musician.png",
  comedians: "/categories/icons/cutout-comedian.png",
  "models-creators": "/categories/icons/cutout-model.png",
  "makeup-styling": "/categories/icons/cutout-makeup.png",
};

export const categoriesSection = {
  title: "Who Are You Looking For?",
};

// The logo strip after the GATE section (BrandStrip.tsx): white logos on black. Sizes are the
// files' own (public/brands-white), so each can be scaled to the same visual area.
export const brandStrip = {
  title: "Brands We've Worked With",
  logos: [
    { name: "GATE 2026, GCCI Annual Trade Expo", src: "/brands-white/gate-2026.png", w: 439, h: 160 },
    { name: "Galco", src: "/brands-white/galco.png", w: 452, h: 142 },
    { name: "Power Hydrotech", src: "/brands-white/power-hydrotech.png", w: 864, h: 194 },
    { name: "Atoa Technologies", src: "/brands-white/atoa.png", w: 467, h: 136 },
    { name: "Meraki", src: "/brands-white/meraki.png", w: 269, h: 148 },
    { name: "Swastik Furnaces", src: "/brands-white/swastik.png", w: 241, h: 153 },
    { name: "Ganesh Housing", src: "/brands-white/ganesh-housing.png", w: 476, h: 220 },
    { name: "Concord Biotech", src: "/brands-white/concord-biotech.png", w: 875, h: 159 },
    { name: "KYB Conmat", src: "/brands-white/kyb-conmat.png", w: 667, h: 161 },
    { name: "House Of Starts", src: "/brands-white/house-of-starts.png", w: 440, h: 220 },
  ],
};

// Beside the hero's heading (Hero.tsx); their own "Book With Confidence" section was removed.
export const promises = {
  title: "Our Promises",
  items: ["Trained & Experienced Professionals", "Vetted & Background-Verified", "Transparent & Fixed Pricing"],
};

export const partner = {
  label: "Our Work",
  title: "Official Partner Of GCCI GATE Expo 2026",
  film: "AOD's coverage of GATE 2026", // for screen readers
  // Under the film, as on aod.co.in: the expo's logo and a caption, then the GCCI line.
  logo: { src: "/brands/gate-2026-expo.png", alt: "GATE 2026" },
  filmTitle: "GCCI GATE Expo 2026",
  filmText: "Event coverage by AOD: the venue from above, the inaugural session and the show floor.",
  trustLogo: { src: "/brands/gcci.png", alt: "GCCI" },
  trust: "Trusted by the Gujarat Chamber of Commerce & Industry and its 7,500+ direct members.",
};

// The places beside the booking site, each on its own address; the section turns black as it
// scrolls into view (in place of the old For Business / For Artists section).
export const places = {
  title: "AOD, All In One Place",
  items: [
    { title: "Dispute Desk", text: "A problem with a booking? We hear both sides and help settle it.", address: "resolve.aod.co.in", href: "/resolve" },
    { title: "Artist Portal", text: "Join AOD, get booking requests and manage your work.", address: "artists.aod.co.in", href: "/artists" },
    { title: "AOD For Business", text: "Events, shoots and expos for your company, in one account.", address: "aod.co.in/business", href: "/business" },
  ],
};

export const closing = {
  title: "Ready When You Are.",
};

export const footer = {
  tagline: "Book a verified artist as easily as you book a cab.",
  columns: [
    {
      title: "Book",
      links: [
        { href: "/categories/photo-video", label: "Photography & Film" },
        { href: "/categories/anchors-hosts", label: "Anchors and Hosts" },
        { href: "/categories/musicians-djs", label: "Musicians & Live Band" },
        { href: "/categories/comedians", label: "Stand-Up Comedians" },
        { href: "/categories/models-creators", label: "Models & Creators" },
        { href: "/categories/makeup-styling", label: "Makeup & Styling" },
      ],
    },
    {
      title: "AOD",
      links: [
        { href: "/business", label: "For Business" },
        { href: "/for-artists", label: "For Artists" },
        { href: "/resolve", label: "Dispute Desk" },
        { href: "/about", label: "About Us" },
        { href: "/my-bookings", label: "My Bookings" },
        { href: "/blog", label: "Blog" },
      ],
    },
    {
      title: "Policies",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms Of Use" },
        { href: "/refund-policy", label: "Cancellation & Refunds" },
      ],
    },
  ],
};
