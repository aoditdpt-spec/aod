// How cards react to the pointer, in two kinds (shared by server and client components; kept out
// of "use client" files, whose exports reach server components as references rather than strings).
//
// - Cards that open a page (a category, a service, a portal, a contact): on hover an orange border
//   appears, the card takes a light orange tint, the title turns orange and extra bold and the
//   other text bold. They don't tilt. `linkCard` (or `linkCardDark` on dark backgrounds) on the
//   card, which also makes it the hover `group`; `linkTitle` on its title; `linkText` on its
//   other lines. On touch screens they press in a little when tapped (`press` in globals.css).
// - Cards that don't open anything (facts, promises, checks): TiltCard (src/components/motion),
//   which tilts towards the pointer, pops up and zooms in a little; inside it, the icon or picture
//   zooms in (`tiltZoom`) and the text turns bold (`tiltTitle` on the title, `tiltText` on other
//   lines). No colour change, glow or light on them. `tiltText` thickens the letters with a thin
//   outline in their own colour rather than a heavier font, so longer lines don't re-wrap and
//   make the card jump (it passes down to everything inside, so keep it off buttons).
export const linkCard =
  "press group border border-line duration-200 hover:border-brand hover:bg-peach/40 hover:ring-1 hover:ring-brand";
export const linkCardDark =
  "press group border border-night-line duration-200 hover:border-tangerine hover:bg-white/10 hover:ring-1 hover:ring-tangerine";
export const linkTitle = "transition-colors group-hover:font-extrabold group-hover:text-brand";
export const linkText = "group-hover:font-semibold";
export const tiltZoom = "transition-transform duration-300 group-hover/tilt:scale-110";
export const tiltTitle = "group-hover/tilt:font-extrabold";
export const tiltText = "group-hover/tilt:[-webkit-text-stroke:0.35px_currentColor]";
