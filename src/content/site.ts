// All copy for the site, taken from the old aod.co.in so it can be reviewed and edited in one place.
//
// NEEDS REVIEW before launch: ratings, booking counts, artist counts and the
// "escrowed payments" claim are carried over from the old site as sample data.
// Replace them with real numbers from Supabase, or remove them (see CLAUDE.md).

export const brand = {
  name: "AOD",
  fullName: "Artists on Demand",
  region: "Gujarat",
  city: "Ahmedabad",
  tagline: "Artists at your fingertips — book a verified artist as easily as you book a cab.",
  phoneDisplay: "+91 92747 39763",
  phoneHref: "tel:+919274739763",
  email: "connect@aod.co.in",
  instagramHandle: "@artistsondemand.in",
  instagramUrl: "https://www.instagram.com/artistsondemand.in/",
  // AOD's LinkedIn company page (the footer icon hides if this is empty).
  linkedinUrl: "https://www.linkedin.com/company/artists-on-demand-pvt-ltd/",
  domain: "aod.co.in",
};

export const cities = ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara", "Rajkot"];

export type IconName =
  | "camera"
  | "video"
  | "drone"
  | "mic"
  | "film"
  | "music"
  | "ticket"
  | "mic-vocal"
  | "brush"
  | "sparkles"
  | "smartphone";

export type Service = {
  name: string;
  rating?: number; // sample data — see note at top; shown only when set
  bookings?: number; // sample data — see note at top
  popular?: boolean;
};

export type Category = {
  slug: string;
  name: string;
  shortName?: string; // for small tiles (the hero's explore grid); `name` when not set
  singular: string;
  icon: IconName;
  // Category photo, with its pixel size (pages use it to show the whole photo without cropping).
  // These are mock photos for the preview — replace them with real AOD artists' work before launch.
  image?: { src: string; width: number; height: number };
  short: string;
  description: string;
  serviceNote?: string; // a line under every service on the category page ("Shot with iPhone")
  startingPrice?: string; // the owner's starting price, shown under the category page's verified line
  services: Service[];
  keywords: string[]; // other words people search with, e.g. "dj", "mua", "camera"
};

export const categories: Category[] = [
  {
    slug: "photographers",
    image: { src: "/categories/photographers.jpg", width: 655, height: 449 },
    name: "Photographers",
    singular: "Photographer",
    icon: "camera",
    keywords: ["photo", "photography", "photographer", "photoshoot", "camera", "pics", "pictures", "candid", "shoot"],
    short: "Weddings, events, portraits & product shoots",
    description:
      "Verified photographers with reviewed portfolios — from candid wedding coverage to crisp product catalogues. Portfolio-reviewed, no negotiation.",
    startingPrice: "Booking starts from ₹1,499/- per hour",
    services: [
      { name: "Corporate Events / Conferences / Summits", rating: 4.84, bookings: 246, popular: true },
      { name: "Architecture & Interior Shoot (Hotels / Cafes / Real Estate)" },
      { name: "Industrial / Factory Plant Shoot" },
      { name: "Executive Portraits & Corporate Headshots" },
      { name: "Birthday Celebrations (Kids & Adults)", rating: 4.88, bookings: 178, popular: true },
      { name: "Anniversaries & Silver/Golden Jubilees" },
      { name: "Engagement Ceremony" },
      { name: "Kitty Parties & Casual Get-togethers" },
      { name: "Maternity & Baby Shower Shoot" },
      { name: "Newborn / Infant Shoot" },
      { name: "Wedding Ceremony", rating: 4.9, bookings: 214, popular: true },
      { name: "Pre-Wedding Shoot" },
      { name: "Sangeet & Cocktail Night" },
      { name: "Haldi & Mehendi Rituals" },
      { name: "Wedding Reception" },
      { name: "Product Shoot" },
      { name: "Festival Shoots (Navratri, Diwali)" },
      { name: "Fashion Lookbook & Ramp Shoot" },
      { name: "Model / Actor Portfolio Shoot" },
      { name: "Gift A Photoshoot Voucher" },
    ],
  },
  {
    slug: "cinematographers",
    image: { src: "/categories/cinematographers.jpg", width: 900, height: 619 },
    name: "Cinematographers",
    shortName: "Cinematographers",
    singular: "Cinematographer",
    icon: "video",
    keywords: ["video", "videography", "videographer", "cinematography", "film", "filmmaker", "movie", "shoot", "reels", "camera"],
    short: "Wedding films, corporate videos & reels",
    description:
      "Cinematic wedding films, corporate AVs and social-first reels — shot and delivered on time by verified professionals.",
    startingPrice: "Booking starts from ₹1,999/- per hour",
    services: [
      { name: "Corporate Brand Film & Profile Video" },
      { name: "Executive Interviews & Client Testimonials" },
      { name: "Corporate Conference & Summit Recap" },
      { name: "Birthday & Anniversary Video Coverage" },
      { name: "Private Family Event Highlights" },
      { name: "Afterparty & Social Gathering Video" },
      { name: "Full Cinematic Wedding Film", rating: 4.9, bookings: 156, popular: true },
      { name: "Wedding Teasers & Highlight Film" },
      { name: "Pre-Wedding Cinematic Film" },
      { name: "Cultural & Festival Event Video" },
      { name: "Instagram Reels & Mobile Trending Videos" },
      { name: "YouTube Shorts & Vertical Social Content" },
      { name: "Podcast" },
    ],
  },
  {
    slug: "drone-pilots",
    image: { src: "/categories/drone-pilots.jpg", width: 655, height: 358 },
    name: "Drone Pilots",
    singular: "Drone Pilot",
    icon: "drone",
    keywords: ["drone", "aerial", "fpv", "uav", "flyover"],
    short: "Licensed aerial photo & film coverage",
    description:
      "DGCA-compliant drone pilots for aerial wedding shots, real-estate walkthroughs and event flyovers. Equipment included.",
    services: [
      { name: "Real Estate Land & Property Survey" },
      { name: "Resort, Hotel & Commercial Exterior Showcase" },
      { name: "Industrial Plant & Factory Fly-Through" },
      { name: "Destination Wedding Aerial Coverage" },
    ],
  },
  {
    slug: "anchors-hosts",
    image: { src: "/categories/anchors-hosts.jpg", width: 995, height: 684 },
    name: "Anchors & Hosts",
    singular: "Anchor / Host",
    icon: "mic",
    keywords: ["anchor", "host", "emcee", "mc", "compere", "presenter"],
    short: "Corporate & private events, weddings & expos",
    description:
      "Bilingual anchors and emcees who keep your event moving — sangeets, award nights, product launches and exhibition booths.",
    services: [
      { name: "Corporate Summit & Annual Conference Host" },
      { name: "Annual Corporate Awards Ceremony Emcee" },
      { name: "Podcast Host" },
      { name: "Ring Ceremony & Engagement Host" },
      { name: "Wedding Ceremony & Reception Emcee" },
      { name: "Sangeet Night Host (Couple & Family Games)" },
      { name: "Panel Discussion Moderator & Webinar Host" },
      { name: "Product Launch, Press Meet & Expo Presenter" },
      { name: "Birthday Party Host (Kids / Adults)" },
      { name: "Kitty Party & Casual Social Host" },
    ],
  },
  {
    slug: "editors",
    image: { src: "/categories/editors.jpg", width: 720, height: 495 },
    name: "Editors",
    singular: "Editor",
    icon: "film",
    keywords: ["editing", "editor", "edit", "post production", "retouch", "album", "colour grading", "color grading"],
    short: "Photo, film & reel post-production",
    description:
      "Fast, reliable post-production — wedding albums, highlight films, reels and colour grading with express delivery add-ons.",
    startingPrice: "Booking starts from ₹999/- per hour",
    services: [
      { name: "Podcast Editing" },
      { name: "Social Media Reels" },
      { name: "UGC Content Edits" },
      { name: "Full Cinematic Wedding Film Post-Production" },
      { name: "Birthday & Private Party Recap Edits" },
      { name: "Instagram Reels & YouTube Shorts Cutdowns" },
      { name: "YouTube Long-Form Content Editing & Color Grading" },
    ],
  },
  {
    slug: "musicians-djs",
    image: { src: "/categories/musicians-djs.jpg", width: 1000, height: 688 },
    name: "Musicians & DJs",
    singular: "Musician / DJ",
    icon: "music",
    keywords: ["dj", "deejay", "music", "musician", "band", "live music", "instrumentalist", "dance"],
    short: "Live bands, instrumentalists & party DJs",
    description:
      "From soulful live sets to packed dance floors — verified musicians and DJs with their own equipment, ready for any stage.",
    services: [
      { name: "Corporate Gala Dinner Background Music" },
      { name: "Corporate Annual Party DJ Set" },
      { name: "Retail Brand Store Launch / Promotional DJ Set" },
      { name: "Wedding Sangeet & Cocktail Party DJ" },
      { name: "Mehendi Sundowner Live Acoustic Set" },
      { name: "Milestone Birthday & Anniversary DJ" },
    ],
  },
  {
    slug: "comedians",
    image: { src: "/categories/comedians.jpg", width: 1000, height: 688 },
    name: "Stand-up Comedians",
    shortName: "Comedians",
    singular: "Comedian",
    icon: "ticket",
    keywords: ["comedy", "comedian", "stand up", "standup", "comic", "humour", "humor"],
    short: "Corporate shows & private gigs",
    description:
      "Clean corporate sets or no-holds-barred private shows — verified comics with real stage time.",
    services: [
      { name: "Corporate Annual Day Show (Clean / Corporate Humor)" },
      { name: "Corporate Offsite & Leadership Retreat Set" },
      { name: "Client Appreciation Dinner Show" },
      { name: "Milestone Birthday Show (30th, 40th, 50th)" },
      { name: "Wedding Sangeet Stand-up Routine / Icebreaker" },
      { name: "Bachelor / Bachelorette Party Comedy Set" },
      { name: "Private House Party / Farmhouse Comedy Show" },
      { name: "College Cultural Festival & Club Night" },
    ],
  },
  {
    slug: "singers",
    image: { src: "/categories/singers.jpg", width: 535, height: 291 },
    name: "Singers & Vocalists",
    shortName: "Singers",
    singular: "Singer",
    icon: "mic-vocal",
    keywords: ["singer", "singing", "vocalist", "vocals", "sufi", "ghazal", "garba", "bollywood"],
    short: "Playback, sufi, garba & live vocals",
    description:
      "Wedding sangeets, sufi nights, garba evenings and corporate galas — vocalists with verified live-performance experience.",
    services: [
      { name: "Corporate Gala Dinner Acoustic Vocal Set" },
      { name: "Executive Dinner Live Vocal Performance" },
      { name: "Navratri / Garba & Dandiya Raas Vocals" },
      { name: "Wedding Sangeet & Cocktail Live Singing" },
      { name: "Sufi Night & Bollywood Unplugged Session" },
      { name: "Ghazal Soiree for Receptions & Jubilees" },
      { name: "Milestone Birthday & Anniversary Live Vocals" },
    ],
  },
  {
    slug: "makeup-artists",
    image: { src: "/categories/makeup-artists.jpg", width: 655, height: 449 },
    name: "Makeup Artists",
    singular: "Makeup Artist",
    icon: "brush",
    keywords: ["makeup", "make up", "mua", "beautician", "bridal", "hair", "hairstyle", "beauty"],
    short: "Bridal, party & editorial looks",
    description:
      "HD bridal, party glam and editorial looks — kit-verified artists who arrive on time with everything they need.",
    services: [
      { name: "Bridal makeup", rating: 4.91, bookings: 167, popular: true },
      { name: "Party makeup", rating: 4.87, bookings: 203, popular: true },
      { name: "Editorial / shoot makeup", rating: 4.86, bookings: 71 },
      { name: "Hair styling add-on", rating: 4.84, bookings: 89 },
    ],
  },
  {
    slug: "models",
    image: { src: "/categories/models.jpg", width: 1000, height: 688 },
    name: "Models",
    singular: "Model",
    icon: "sparkles",
    keywords: ["model", "modelling", "modeling", "ramp", "fashion", "promoter"],
    short: "Brand shoots, ramp & promotions",
    description:
      "Portfolio-verified models for product campaigns, ramp shows, showroom launches and promotional events.",
    services: [
      { name: "Brand / product shoot", rating: 4.85, bookings: 58, popular: true },
      { name: "Ramp / fashion show", rating: 4.88, bookings: 43 },
      { name: "Promotional event", rating: 4.82, bookings: 67 },
    ],
  },
  {
    slug: "content-creators",
    name: "Reel Creator",
    shortName: "Reel Creator",
    singular: "Reel Creator",
    icon: "smartphone",
    // A stock photo (iStock 1311101155) for the preview, like the other category photos.
    image: { src: "/categories/content-creators.webp", width: 612, height: 408 },
    keywords: ["content", "content creator", "creator", "reels", "reel", "instagram", "insta", "ugc", "influencer", "social media", "shorts"],
    short: "Reels, brands & UGC, shot with iPhone",
    description:
      "Verified creators who plan, shoot and edit scroll-stopping reels and social content for brands, launches and events.",
    serviceNote: "Shot with iPhone",
    services: [
      { name: "Instagram reels", rating: 4.87, bookings: 64, popular: true },
      { name: "Brand content shoot", rating: 4.85, bookings: 41 },
      { name: "Event reels (same day)", rating: 4.86, bookings: 37 },
      { name: "UGC / product videos", rating: 4.83, bookings: 29 },
    ],
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

// The laptop homepage's "Book from these services" panel under the category carousel (eyebrow to
// button), and the category photo tiles (CategoryTiles, on /categories and a category page's "You
// can also book"): a tile per category straight to its booking questions, and one for anyone unsure.
export const bookByCategory = {
  eyebrow: "Book now",
  title: "Book from these services",
  text: "Pick who you need. Tell us about your event and we'll send curated matches with clear quotes.",
  button: "Book now",
  tileAction: "Book now",
  unsure: { title: "Not sure who to book?", action: "Get matched" },
};

// The Categories page (/categories), the app tab bar's Categories tab.
export const categoriesPage = {
  title: "All categories",
  text: "Every kind of artist AOD books, all verified. Pick one to tell us about your event.",
};

// The number of categories rounded down to the ten, as "10+" (11 categories today; 20 would read "20+").
export const categoryCountLabel = `${Math.floor(categories.length / 10) * 10}+`;

// Sample data — see note at top.
export const stats = [
  // `visual` picks the small graphic under the number (drawn in src/components/home/Stats.tsx).
  // Wording from the owner's Canva notes (2026-11-06), on every screen size.
  { value: "150+", label: "verified artists", visual: "artists" },
  { value: "4.9", label: "customer rating", visual: "stars" },
  { value: "5+", label: "talent categories", visual: "categories" },
  { value: "100%", label: "customer satisfaction", visual: "smile" },
] as const;

// Brands that trust AOD, shown in the scrolling strip under the stats ("Trusted by renowned brands").
// Logos live in public/brands/: cut out of their backgrounds, cropped tight, 160–240px tall.
// `width` / `height` are the image's real pixel size (the strip uses them for the shape).
export const clientBrands = [
  { name: "Aluminium Bharat", logo: "/brands/aluminium-bharat-logo.png", width: 1955, height: 251 },
  { name: "ATOA Technologies", logo: "/brands/atoa-technologies.png", width: 491, height: 160 },
  { name: "Meraki", logo: "/brands/meraki.png", width: 280, height: 160 },
  { name: "GTZ", logo: "/brands/gtz.png", width: 219, height: 160 },
  // GATE (GCCI's trade expo) sits half a loop away from the round GCCI badge further down, so the two never appear side by side.
  { name: "GATE 2026 – GCCI Annual Trade Expo", logo: "/brands/gate-2026-expo.png", width: 439, height: 160 },
  { name: "Lalaji", logo: "/brands/lalaji.png", width: 269, height: 160 },
  { name: "HI Interior Hardware", logo: "/brands/hi-interior-hardware.png", width: 181, height: 160 },
  { name: "Ralco Extrusion", logo: "/brands/ralco-extrusion.png", width: 276, height: 160 },
  { name: "Saru Aikoh Chemicals", logo: "/brands/saru-aikoh-chemicals-logo.png", width: 714, height: 240 },
  { name: "MMR Mayur Group", logo: "/brands/mmr-mayur-group.png", width: 195, height: 160 },
  { name: "Swastik Furnaces", logo: "/brands/swastik-furnaces.png", width: 246, height: 160 },
  { name: "FCT Surface Innovators", logo: "/brands/fct.png", width: 359, height: 160 },
  { name: "Galco", logo: "/brands/galco.png", width: 468, height: 160 },
  { name: "Power Hydrotech", logo: "/brands/power-hydrotech-logo.png", width: 910, height: 240 },
  { name: "Ayodhya", logo: "/brands/ayodhya-logo.png", width: 353, height: 240 },
  { name: "Shree Ramji Buildcon Group", logo: "/brands/shree-ramji-logo.png", width: 330, height: 240 },
  { name: "Concord Biotech", logo: "/brands/concord-biotech.png", width: 876, height: 160 },
  { name: "Arvind Smartspaces", logo: "/brands/arvind-smartspaces.png", width: 527, height: 204 },
  { name: "Gujarat Chamber of Commerce & Industry", logo: "/brands/gcci.png", width: 220, height: 220 },
  { name: "Ganesh Housing", logo: "/brands/ganesh-housing.png", width: 476, height: 220 },
  { name: "HoneyVeda", logo: "/brands/honeyveda.png", width: 582, height: 185 },
  { name: "House of Starts", logo: "/brands/house-of-starts.png", width: 440, height: 220 },
  { name: "Aegis Infoware", logo: "/brands/aegis-infoware.png", width: 396, height: 220 },
  { name: "NeeRain", logo: "/brands/neerain.png", width: 585, height: 185 },
  { name: "KYB Conmat", logo: "/brands/kyb-conmat.png", width: 667, height: 161 },
  { name: "Organilicious", logo: "/brands/organilicious.png", width: 1081, height: 160 },
  { name: "Mandalam", logo: "/brands/mandalam.png", width: 164, height: 220 },
  { name: "Swarnim Touch Communications", logo: "/brands/swarnim-touch.png", width: 407, height: 200 },
];

export const guarantees = [
  { icon: "tag", label: "Transparent upfront quotes" },
  { icon: "lock", label: "Escrowed payments" }, // not built yet — see note at top
  { icon: "refresh", label: "Replacement guarantee" },
  { icon: "signature", label: "Digital contract on every booking" },
] as const;

export const hero = {
  title: "Book verified artists for every event",
  exploreTitle: "What are you looking for?",
  exploreMore: { label: "Get matched", note: "Not sure?" },
  artistLine: "Are you an artist?",
  artistLink: "Join AOD",
  searchPlaceholder: "Search for 'wedding photographer'",
  // Laptops keep the full-screen video hero (HeroDesktop): the brand name as the heading, two
  // buttons and the booking walk-through. The fields above are the phone and tablet hero's, whose
  // heading is the same brand name (desktop.title), with `title` under it.
  desktop: {
    title: "Artists On Demand",
    // Each entry is shown on its own line.
    subtitle: ["Every artist you need, all in one place.", "Book talent without the chase."],
    primaryCta: "Get yours now",
    secondaryCta: "Browse categories",
    // Animated walk-through of a booking shown beside the headline. Illustrative steps, not real customers.
    demo: [
      { icon: "camera", title: "Request sent", text: "Event photographer · Ahmedabad · 14 Oct" },
      { icon: "sparkles", title: "Curated matches ready", text: "Verified, with clear quotes" },
      { icon: "signature", title: "Booking confirmed", text: "Digital contract shared on WhatsApp" },
    ],
  },
};

// Booking features shown on the homepage ("Book with confidence"). Cancellation and
// rescheduling are new promises for the relaunch — confirm the exact policy before launch.
// AOD doesn't offer meeting artists in person; the trust promise is that every artist is verified.
export const features = [
  {
    icon: "calendar-x",
    title: "Last-minute cancellation",
    text: "Plans change. Cancel your booking even at the last moment.",
  },
  {
    icon: "calendar-sync",
    title: "Reschedule to another day",
    text: "Event date moved? Shift your booking to another day instead of losing it.",
  },
  {
    icon: "badge-check",
    title: "Every artist verified thoroughly",
    text: "Portfolio review, background checks and a trial booking before any artist goes live.",
  },
  {
    icon: "refresh",
    title: "Replacement guarantee",
    text: "If an artist cancels, AOD sends a verified substitute — you are never stranded.",
  },
  {
    icon: "tag",
    title: "Transparent quotes",
    text: "One clear quote per curated match — no haggling, no surprises.",
  },
  {
    icon: "signature",
    title: "Digital contract",
    text: "Every booking comes with a digital contract, so everyone knows what's agreed.",
  },
] as const;

export type Audience = "personal" | "business";

// The choosing screen at /book.
// Photos for the personal / business choices (/book and the homepage's "Choose how you want to
// book"): category photos for now (mock, see `image` on categories); swap in real AOD shoots.
export const bookingPhotos = {
  // Only phones and tablets show these photos (laptops show the icon alone): a photographer at a
  // wedding (the owner's choice), and AOD's own drone shot of the GATE 2026 expo (public/media/gate-2026.webp).
  personal: "/categories/photographers.jpg",
  business: "/media/gate-2026.webp",
};

export const bookingChoice = {
  title: "What are you booking for?",
  subtitle: "Pick one — we'll ask a few quick questions and send curated matches.",
  personal: {
    label: "For personal events",
    text: "Weddings, sangeets, parties, pre-wedding and portrait shoots.",
    image: bookingPhotos.personal,
  },
  business: {
    label: "For business",
    text: "Corporate events, expos, brand shoots and recurring content on contract.",
    image: bookingPhotos.business,
  },
};

// Trust message shown on the homepage, booking and category pages: every artist is verified.
export const verifiedArtists = {
  short: "Every AOD artist has been verified thoroughly",
  title: "Only thoroughly verified artists.",
  text: "We don't list strangers. Every artist on AOD is checked by our team, from their portfolio and past work to their background and references, before they're ever sent to your event.",
  points: [
    "Portfolio and past work reviewed",
    "Background and references checked",
    "Trial booking before going live",
  ],
};

// The GATE 2026 section on the homepage, after the stats: AOD's own expo coverage,
// copied from the portfolio section on expos.aod.co.in. Only real AOD work goes here. The film's
// files are public/media/gate-2026-1080*.mp4 with gate-2026.webp as the poster.
export const portfolio = {
  title: "Official partner with GCCI GATE Expo 2026",
  film: {
    label: "AOD's coverage of GATE 2026",
    logo: "/brands/gate-2026-expo.png",
    logoAlt: "GATE 2026",
    title: "GCCI GATE Expo 2026",
    text: "Event coverage by AOD: the venue from above, the inaugural session and the show floor.",
  },
  trustLogo: "/brands/gcci.png",
  trust: "Trusted by the Gujarat Chamber of Commerce & Industry and its 7,500+ direct members.",
};

// The pre-filled WhatsApp message for artists who'd rather ask on WhatsApp than apply online
// ("Join AOD" links go to the artist portal's application, /artists/apply).
export const artistJoinMessage = "Hi Artists on Demand! I am an artist and I want to join AOD.";

// The booking questions on each category page: that category is already picked, with how many
// of them, and other artists for the same event can be added. `name` is the category's name.
export const categoryBooking = {
  eyebrow: (name: string) => `Book ${name.toLowerCase()}`,
  title: "Tell us what you need",
  barButton: "Book now", // the phone bar at the bottom of a category page
  text: (name: string) =>
    `Say how many ${name.toLowerCase()} you need, and add any other artists for the same event. One request, and we reply with curated matches for each.`,
};

// "Not sure who to book?" on the homepage: the intro beside the booking questions.
// Its "What happens next" steps reuse howItWorks.clients.
export const getMatched = {
  eyebrow: "Free curated matching",
  title: "Not sure who to book?",
  text: "Tell us who you need, the occasion, the date and details — takes 2 minutes. We'll send curated matches.",
  nextTitle: "What happens next",
  talkTitle: "Prefer to talk?",
};

export const howItWorks = {
  clients: [
    { title: "Tell us your need", text: "Who you need, the occasion, date and details — takes 2 minutes." },
    {
      title: "Get curated matches",
      text: "Verified artists with clear quotes. No scrolling through 500 profiles.",
    },
    { title: "Book & relax", text: "Secure payment, digital contract, on-time delivery." },
  ],
  // Joining AOD: every artist is verified before going live.
  artists: [
    {
      title: "Apply with your work",
      text: "Share your portfolio, links and experience online. Our team reviews every application.",
    },
    {
      title: "Portfolio & background check",
      text: "Our creative team reviews your style and quality, and verifies your identity and references.",
    },
    {
      title: "Trial booking & go live",
      text: "One supervised booking to confirm professionalism and punctuality — then the bookings start coming.",
    },
  ],
};

// The bottom tab bar on phones and tablets (website and installed app alike) and its "More" sheet
// (src/components/layout/AppTabBar.tsx): a way to every place in AOD, since the app has no address bar. Paths into the separate sites
// (/artists, /admin, /resolve) open their own domains (portalHref()).
export const appMenu = {
  tabs: [
    { href: "/", label: "Explore", icon: "explore" },
    { href: "/categories", label: "Categories", icon: "grid" },
    { href: "/book", label: "Book", icon: "book" },
    { href: "/my-bookings", label: "Bookings", icon: "ticket" },
  ],
  more: "More",
  title: "Everything in AOD",
  cityTitle: "Your city",
  groups: [
    {
      title: "Book",
      links: [
        { href: "/categories", label: "All categories", note: "Photographers, DJs, anchors and more", icon: "grid" },
        { href: "/business", label: "AOD for Business", note: "Brand shoots, events and retainers", icon: "building" },
        { href: "/blog", label: "Blog", note: "Planning tips and artist stories", icon: "blog" },
      ],
    },
    {
      title: "Help",
      links: [
        { href: "/resolve", label: "Dispute Desk", note: "A dispute with a client or an artist", icon: "scale" },
        { href: "/about", label: "About us", note: "Who we are", icon: "info" },
      ],
    },
    {
      title: "For artists",
      links: [
        { href: "/artists", label: "Artist portal", note: "Sign in to your requests and profile", icon: "palette" },
        { href: "/artists/apply", label: "Join as an artist", note: "Apply online", icon: "join" },
      ],
    },
    {
      title: "AOD team",
      links: [{ href: "/admin", label: "Team sign-in", note: "The admin panel, for AOD staff", icon: "lock" }],
    },
  ],
  share: "Share AOD",
  shared: "Link copied",
  shareText: "Book verified photographers, DJs, anchors, makeup artists and more with AOD.",
  whatsapp: "Chat on WhatsApp",
  call: "Call us",
};

// The "Get the AOD app" popup on phones and tablets (src/components/layout/InstallPrompt.tsx).
// The safety points are what's true of an installed website: it comes from aod.co.in over HTTPS,
// needs no app store or permissions, and is a few hundred KB.
export const installApp = {
  title: "Get the AOD app",
  from: "aod.co.in",
  text: "Book artists and follow your bookings from your home screen, in one tap.",
  points: [
    { icon: "shield", text: "Safe and secure: it installs straight from aod.co.in over a secure (HTTPS) connection." },
    { icon: "phone", text: "No app store, no extra permissions, and it takes almost no space." },
  ],
  install: "Install app",
  installNote: "Your browser asks you once to confirm.",
  installing: "Done! Find AOD on your home screen.",
  notNow: "Not now",
  iosTitle: "Add AOD to your home screen",
  iosSteps: ["Tap the Share button in your browser's bar", "Choose “Add to Home Screen”", "Tap “Add”"],
  iosDone: "Got it",
};

// The homepage's "Everything in one place" section (laptops): the separate places customers and
// companies use, each its own page. (The artist "Join AOD" band that opened it was removed on request.)
export const portals = {
  eyebrow: "Everything in one place",
  title: "One AOD, a place for everyone.",
  text: "Following a booking, sorting out a problem or booking for your company: each has its own place. Here's where to go.",
  places: [
    {
      id: "bookings",
      who: "For customers",
      title: "My bookings",
      text: "Every request you've sent and every booking, in one list.",
      points: ["Follow each booking's progress", "Pay the advance or balance", "Download your photos and films"],
      cta: "Open My bookings",
      href: "/my-bookings",
    },
    {
      id: "resolve",
      who: "If there's a dispute",
      title: "Dispute Desk",
      text: "Client ghosted your invoice, or an artist didn't deliver? Booked through AOD or not, AOD hears both sides and helps settle it.",
      points: ["Get a case number straight away", "A reply within 48 hours", "Track it, and escalate if needed"],
      cta: "Raise or track a dispute",
      href: "/resolve",
    },
    {
      id: "business",
      who: "For companies",
      title: "AOD for Business",
      text: "Corporate events, brand shoots and expos, on one contract.",
      points: ["Monthly or yearly retainers", "Digital contracts and one invoice", "One point of contact"],
      cta: "See AOD for Business",
      href: "/business",
    },
  ],
};

export const bookingOptions = {
  personal: {
    name: "Personal events",
    image: bookingPhotos.personal,
    audience: "Weddings, sangeets, parties and one-off shoots",
    text: "Photographers, DJs, anchors, makeup artists & more — booked as easily as a cab.",
    includesLabel: "Every booking includes:",
    features: [
      "Curated matches — verified artists with clear quotes",
      "Transparent upfront quotes — no haggling, no surprises",
      "Escrowed payments — released after delivery",
      "Replacement guarantee — never stranded if an artist cancels",
      "Last-minute cancellation or reschedule to another day",
      "Every artist verified thoroughly",
      "Digital contract on every booking",
    ],
    cta: "Get yours now",
  },
  business: {
    image: bookingPhotos.business,
    name: "AOD for Business",
    audience: "Hotels, cafés, agencies, corporates and expos",
    text: "Product catalogues, event coverage, brand films and expo visuals — delivered by verified talent under one contract, one invoice, one point of contact.",
    includesLabel: "Everything in personal, plus:",
    features: [
      "Digital contracts on every engagement",
      "Transparent quotes upfront — budget approvals without surprises",
      "Dedicated account manager and single point of contact",
      "Priority replacement guarantee — coverage never falls through",
      "Retainers, multi-day contracts and one-off projects",
    ],
    cta: "Book for business",
  },
};

export const business = {
  eyebrow: "AOD for Business",
  title: "One partner for every shoot.",
  subtitle: bookingOptions.business.text,
  segments: [
    {
      title: "Hotels, cafés & agencies",
      text: "Monthly content shoots on retainer — food, interiors, events and social reels, delivered on a fixed calendar.",
    },
    {
      title: "Corporates & pharma",
      text: "Annual contracts for town halls, conferences, leadership shoots and product launches across locations.",
    },
    {
      title: "Expos & exhibitions",
      text: "Official visual-partner coverage: booth photography, walkthrough films and same-day social edits.",
    },
  ],
  whyTitle: "Why procurement teams like us",
  why: [
    "Digital contracts on every engagement",
    "Transparent quotes upfront — budget approvals without surprises",
    "Dedicated account manager and single point of contact",
    "Priority replacement guarantee — coverage never falls through",
    "One company account: a calendar of every booking, and each order tracked from inquiry to payment received",
  ],
  caseStudy: {
    label: "GATE Expo — Official Visual Partner",
    text: "AOD delivered end-to-end visual coverage as official partner.",
  },
  ctaTitle: "Put your shoots on autopilot",
  ctaText: "Create your company account, or tell us your annual creative calendar and we'll come back with a proposal in 48 hours.",
};

// The About us page (/about).
export const about = {
  eyebrow: "Artists on Demand",
  title: "About us",
  intro:
    "Artists on Demand is a premier artist booking platform where you can book verified, professional artists with ease — just as you book a cab. AOD provides artists across a wide range of categories, including Photographers, Videographers & Cinematographers, Hosts & Anchors, Models, Musicians, and more. You can book the artists at your convenience.",
  storyTitle: "Vision of AOD",
  story: [
    "AOD's vision is simple: booking talent for any event in Gujarat should be as easy and as trustworthy as booking a cab — every artist verified, every price clear.",
    "Finding the right artist for a wedding, a launch or a shoot usually means scrolling through hundreds of profiles, chasing replies, haggling over prices and hoping they turn up on the day.",
    "You tell AOD what you need, and AOD sends curated matches: artists AOD has verified, with clear quotes and a digital contract on every booking.",
    "For artists, AOD means the right bookings at the right rate, with zero joining fees and a team that handles the back-and-forth.",
  ],
  valuesTitle: "What AOD stands for",
  values: [
    { title: "Verified, not just listed", text: "Portfolio review, background checks and a trial booking before any artist goes live." },
    { title: "One clear price", text: "One clear quote per curated match. The price you agree is the price you pay." },
    { title: "Never stranded", text: "If an artist cancels, AOD sends a verified substitute." },
    { title: "Fair to artists", text: "Zero joining fees, and bookings that suit each artist's craft and rate." },
  ],
  contactTitle: "Talk to AOD",
  contactText: "Questions, partnerships or press — reach the AOD team directly.",
};

export const forArtists = {
  eyebrow: "For artists",
  title: "Join as an artist with AOD.",
  subtitle:
    "Your talent and potential, put in the right place at the right rate. We bring you real bookings — weddings, corporate events, expos — so you can focus on your art.",
  note: "Zero joining fees · Every artist is verified before going live",
  cta: "Ask on WhatsApp", // the WhatsApp alternative beside "Apply online"; "Join AOD" always means the portal
  // The artist portal (/artists, later artists.aod.co.in) is reached only from this page.
  applyCta: "Apply online",
  signInText: "Already with AOD?",
  signInCta: "Sign in to the artist portal",
  whyTitle: "Your talent deserves the right stage",
  why: [
    {
      title: "Your talent, in the right place",
      text: "We match you to events that fit your style, so your skills are used where they count.",
    },
    {
      title: "A fair rate for your work",
      text: "Clear quotes agreed upfront. No undercutting, no haggling — you're paid what your work is worth.",
    },
    {
      title: "Steady work",
      text: "Weddings, corporate contracts and expo coverage — regular bookings across Gujarat.",
    },
    {
      title: "Grow your potential",
      text: "A verified badge, reviews and a portfolio that grows with every booking you deliver.",
    },
  ],
  meetTitle: "We verify every artist thoroughly",
  meetText:
    "No one joins AOD from a form alone. Our team reviews your work, checks your background and references, and runs a trial booking — so clients know exactly who is walking into their event.",
  verificationTitle: "How joining works",
  verificationIntro: "Three steps, starting with your application. Once you're through, you appear in curated matches and category listings.",
  ctaTitle: "Ready to put your talent to work?",
  ctaText: "Apply in a few minutes. Our team reviews every application.",
  ctaNote: "Zero joining fees — we only earn when you do.",
};

export const finalCta = {
  title: ["stop hunting.", "start booking."],
  text: "Tell us what you need — we'll send curated matches.",
};
