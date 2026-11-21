// Mock content for the frontend (no backend yet). Copy and data live here, not in the components.

export const brand = {
  name: "AOD",
  fullName: "Artists on Demand",
  city: "Ahmedabad",
  phoneDisplay: "+91 92747 39763",
  phoneHref: "tel:+919274739763",
  whatsappNumber: "919274739763",
  email: "connect@aod.co.in",
  region: "Gujarat",
  domain: "aod.co.in",
};

// Opens a WhatsApp chat with AOD, the message already typed.
export function whatsappUrl(message = "Hi AOD! I'd like to book an artist.") {
  return `https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  image: string; // the search's pictures: the category's cut-out (the old photos were deleted, 2026-11-21)
  keywords: string[]; // extra words the search understands
  // The kinds of artist in it (the categories the live site had before they were merged), asked
  // in the booking's second question. A category with one kind skips that question.
  types: string[];
  groups: { title: string; services: string[] }[]; // services by kind: search words only, not shown as pages or lists
};

// The six categories, in the owner's order and wording (2026-11-18): Photography & Film (first
// "Photos and Videos")
// (photographers, cinematographers, drone pilots), Anchors and Hosts, Musicians & Live Band
// (singers, musicians, live band; "DJs" until 2026-11-21), Stand-Up Comedians, Models & Creators (models, influencers, reel creators),
// Makeup & Styling. Editors were removed, and no prices are shown for now. The services are no
// longer listed on the site (no sub-categories on the category pages); they stay here only as
// words the search understands, each finding its category.
export const categories: Category[] = [
  {
    slug: "photo-video",
    name: "Photography & Film",
    blurb: "Photographers, Cinematographers and Drones",
    image: "/categories/icons/cutout-photographer.png",
    types: ["Photographers", "Cinematographers", "Drone Operators"],
    keywords: ["photo", "photos", "photography", "photographer", "camera", "shoot", "video", "videos", "videography", "videographer", "film", "films", "filmmaker", "cinematographer", "cinematography", "drone", "aerial"],
    groups: [
      {
        title: "Photography",
        services: [
          "Corporate Events / Conferences / Summits",
          "Architecture & Interior Shoot (Hotels / Cafes / Real Estate)",
          "Industrial / Factory Plant Shoot",
          "Executive Portraits & Corporate Headshots",
          "Birthday Celebrations (Kids & Adults)",
          "Anniversaries & Silver/Golden Jubilees",
          "Engagement Ceremony",
          "Kitty Parties & Casual Get-togethers",
          "Maternity & Baby Shower Shoot",
          "Newborn / Infant Shoot",
          "Wedding Ceremony",
          "Pre-Wedding Shoot",
          "Sangeet & Cocktail Night",
          "Haldi & Mehendi Rituals",
          "Wedding Reception",
          "Product Shoot",
          "Festival Shoots (Navratri, Diwali)",
          "Fashion Lookbook & Ramp Shoot",
          "Model / Actor Portfolio Shoot",
          "Gift A Photoshoot Voucher",
        ],
      },
      {
        title: "Films",
        services: [
          "Corporate Brand Film & Profile Video",
          "Executive Interviews & Client Testimonials",
          "Corporate Conference & Summit Recap",
          "Birthday & Anniversary Video Coverage",
          "Private Family Event Highlights",
          "Afterparty & Social Gathering Video",
          "Full Cinematic Wedding Film",
          "Wedding Teasers & Highlight Film",
          "Pre-Wedding Cinematic Film",
          "Cultural & Festival Event Video",
          "Instagram Reels & Mobile Trending Videos",
          "YouTube Shorts & Vertical Social Content",
          "Podcast",
        ],
      },
      {
        title: "Drone",
        services: [
          "Real Estate Land & Property Survey",
          "Resort, Hotel & Commercial Exterior Showcase",
          "Industrial Plant & Factory Fly-Through",
          "Destination Wedding Aerial Coverage",
        ],
      },
    ],
  },
  {
    slug: "anchors-hosts",
    name: "Anchors and Hosts",
    blurb: "Conferences, Corporate Events, Ceremonies and more",
    image: "/categories/icons/cutout-anchor.png",
    types: ["Anchors", "Hosts"],
    keywords: ["anchor", "anchors", "host", "hosts", "emcee", "mc", "compere"],
    groups: [
      {
        title: "Anchors & Hosts",
        services: [
          "Corporate Summit & Annual Conference Host",
          "Annual Corporate Awards Ceremony Emcee",
          "Podcast Host",
          "Ring Ceremony & Engagement Host",
          "Wedding Ceremony & Reception Emcee",
          "Sangeet Night Host (Couple & Family Games)",
          "Panel Discussion Moderator & Webinar Host",
          "Product Launch, Press Meet & Expo Presenter",
          "Birthday Party Host (Kids / Adults)",
          "Kitty Party & Casual Social Host",
        ],
      },
    ],
  },
  {
    slug: "musicians-djs",
    name: "Musicians & Live Band", // "DJs" renamed "Live Band" everywhere (on request, 2026-11-21); the slug stays
    blurb: "Live Bands, Singers and Musicians for Sangeets, Receptions and After-Parties",
    image: "/categories/icons/cutout-musician.png",
    types: ["Musicians", "Live Band", "Singers"],
    keywords: ["music", "musician", "musicians", "band", "bands", "dj", "djs", "singer", "singers", "vocalist", "vocals", "garba", "sufi", "ghazal"],
    groups: [
      {
        title: "Singers",
        services: [
          "Corporate Gala Dinner Acoustic Vocal Set",
          "Executive Dinner Live Vocal Performance",
          "Navratri / Garba & Dandiya Raas Vocals",
          "Wedding Sangeet & Cocktail Live Singing",
          "Sufi Night & Bollywood Unplugged Session",
          "Ghazal Soiree for Receptions & Jubilees",
          "Milestone Birthday & Anniversary Live Vocals",
        ],
      },
      {
        title: "Musicians & Live Band",
        services: [
          "Corporate Gala Dinner Background Music",
          "Corporate Annual Party Live Band Set",
          "Retail Brand Store Launch / Promotional Live Band Set",
          "Wedding Sangeet & Cocktail Party Live Band",
          "Mehendi Sundowner Live Acoustic Set",
          "Milestone Birthday & Anniversary Live Band",
        ],
      },
    ],
  },
  {
    slug: "comedians",
    name: "Stand-Up Comedians",
    blurb: "Clean, Crowd-Ready Sets for Corporate Nights, Parties and Festivals",
    image: "/categories/icons/cutout-comedian.png",
    types: ["Stand-Up Comedians"],
    keywords: ["comedy", "comedian", "comedians", "stand up", "standup"],
    groups: [
      {
        title: "Stand-up",
        services: [
          "Corporate Annual Day Show (Clean / Corporate Humor)",
          "Corporate Offsite & Leadership Retreat Set",
          "Client Appreciation Dinner Show",
          "Milestone Birthday Show (30th, 40th, 50th)",
          "Wedding Sangeet Stand-up Routine / Icebreaker",
          "Bachelor / Bachelorette Party Comedy Set",
          "Private House Party / Farmhouse Comedy Show",
          "College Cultural Festival & Club Night",
        ],
      },
    ],
  },
  {
    slug: "models-creators",
    name: "Models & Creators",
    blurb: "Runway, Brand Campaigns, Product Launches and Reels",
    image: "/categories/icons/cutout-model.png",
    types: ["Models", "Influencers", "Reel Creators"],
    keywords: ["model", "models", "modelling", "fashion", "influencer", "influencers", "creator", "creators", "content", "reel", "reels", "instagram", "ugc"],
    groups: [
      {
        title: "Models",
        services: [
          "Brand / product shoot",
          "Ramp / fashion show",
          "Promotional event",
        ],
      },
      {
        title: "Influencers & Reel Creators",
        services: [
          "Instagram reels",
          "Brand content shoot",
          "Event reels (same day)",
          "UGC / product videos",
        ],
      },
    ],
  },
  {
    slug: "makeup-styling",
    name: "Makeup & Styling",
    blurb: "Bridal Looks and Camera-Ready Glam for Every Event",
    image: "/categories/icons/cutout-makeup.png",
    types: ["Makeup Artists"], // one kind, so booking goes straight to How Many? (no hair stylists, 2026-11-21)
    keywords: ["makeup", "make up", "mua", "bridal", "stylist", "styling"],
    groups: [
      {
        title: "Makeup",
        services: [
          "Bridal makeup",
          "Party makeup",
          "Editorial / shoot makeup",
        ],
      },
    ],
  },
];

export const cities = ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara", "Rajkot"];

export type NavLink = { href: string; label: string };

// The top bar's links. Booking itself is the "Get Your Artist" button, so it isn't repeated here.
export const navLinks: NavLink[] = [
  { href: "/business", label: "For Business" },
  { href: "/for-artists", label: "For Artists" },
  { href: "/resolve", label: "Dispute Desk" }, // back in place of the Portfolio page, which was removed (2026-11-21)
  { href: "/about", label: "About Us" },
];

export const nav = {
  cta: "Get Your Artist",
  myBookings: "My Bookings",
  search: "Search",
  searchLong: "Search Artists",
  // The search bar types these one after another (any category or service people look for).
  searchWords: [
    "Photographers",
    "Wedding films",
    "Live Band",
    "Anchors",
    "Makeup artists",
    "Drone shoots",
    "Singers",
    "Stand-Up Comedians",
    "Reel creators",
    "Models",
    "Pre-wedding shoot",
    "Birthday party host",
  ],
  menu: "Menu",
  close: "Close",
  whatsapp: "WhatsApp Us",
  call: "Call Us",
};
