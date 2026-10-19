import type { MetadataRoute } from "next";
import { brand } from "@/content/site";
import { portal } from "@/content/artist-portal";
import { resolution } from "@/content/resolution";
import { sectionLink, type Section } from "@/lib/site-url";

// The web app manifests that let each site be installed as an app (Add to Home screen, or the
// install button in the address bar). The customer site's is src/app/manifest.ts; the artist
// portal, admin and Resolution Centre each get their own (src/app/manifests/[file]/route.ts,
// linked from their layouts), so each installs as its own app opening at its own front page.
// The service worker is public/sw.js.

// The rounded "A." tile, and for Android's shaped icons a full-bleed orange square with "AOD."
// inside the safe zone (public/icons/, made from src/app/icon.png and public/aod-wordmark.png).
const icons: MetadataRoute.Manifest["icons"] = [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
];

// White title bar and splash screen, like the site's navbar.
const base = {
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#ffffff",
  lang: "en-IN",
  dir: "ltr",
  icons,
} satisfies MetadataRoute.Manifest;

const shortcut = (name: string, url: string): NonNullable<MetadataRoute.Manifest["shortcuts"]>[number] => ({
  name,
  url,
  icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
});

export function siteManifest(): MetadataRoute.Manifest {
  return {
    ...base,
    id: "/",
    name: `${brand.name} — ${brand.fullName}`,
    short_name: brand.name,
    description: "Book verified photographers, cinematographers, DJs, anchors, makeup artists and more in Gujarat.",
    start_url: "/",
    scope: "/",
    categories: ["lifestyle", "entertainment", "business"],
    shortcuts: [shortcut("Book an artist", "/book"), shortcut("My bookings", "/my-bookings")],
    // Android's install dialog shows these like an app store listing ("narrow" on phones, "wide" on
    // laptops). Taken from the site as the installed app looks (public/screenshots/); retake them
    // when the pages change a lot.
    screenshots: [
      { src: "/screenshots/home.webp", sizes: "780x1688", type: "image/webp", form_factor: "narrow", label: "Book verified artists in Gujarat" },
      { src: "/screenshots/book.webp", sizes: "780x1688", type: "image/webp", form_factor: "narrow", label: "Three quick questions to book" },
      { src: "/screenshots/menu.webp", sizes: "780x1688", type: "image/webp", form_factor: "narrow", label: "Everything in AOD, one tap away" },
      { src: "/screenshots/wide-home.webp", sizes: "1366x768", type: "image/webp", form_factor: "wide", label: "Artists On Demand" },
    ],
  };
}

// On its own domain (artists.aod.co.in) a section's front page is "/"; on localhost it is /artists.
const sections: Record<Section, { name: string; short: string; description: string; shortcuts: [string, string][] }> = {
  artists: {
    name: portal.name,
    short: "AOD Artists",
    description: "Booking requests, your profile, portfolio and availability as an AOD artist.",
    shortcuts: [
      ["Booking requests", "/artists/bookings"],
      ["Availability", "/artists/availability"],
    ],
  },
  admin: {
    name: "AOD Admin",
    short: "AOD Admin",
    description: "Admin panel for the Artists on Demand team.",
    shortcuts: [
      ["Bookings", "/admin/bookings"],
      ["Applications", "/admin/applications"],
    ],
  },
  resolve: {
    name: resolution.title,
    short: "AOD Resolve",
    description: "Raise a problem with an AOD booking, follow it and escalate it.",
    shortcuts: [
      ["Raise a case", "/resolve/new"],
      ["Track a case", "/resolve/track"],
    ],
  },
};

export const manifestSections = Object.keys(sections) as Section[];
export const sectionManifestPath = (section: Section) => `/manifests/${section}.webmanifest`;

export function sectionManifest(section: Section): MetadataRoute.Manifest {
  const s = sections[section];
  const home = sectionLink(`/${section}`);
  return {
    ...base,
    id: home,
    name: s.name,
    short_name: s.short,
    description: s.description,
    start_url: home,
    scope: home,
    shortcuts: s.shortcuts.map(([name, url]) => shortcut(name, sectionLink(url))),
  };
}
