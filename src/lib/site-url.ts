// A link to a page on the customer site. On the artists, pay and admin domains "/" points into
// that section, so NEXT_PUBLIC_SITE_URL (e.g. https://aod.co.in) turns it into a full address.
export const siteHref = (path: string) => `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}${path}`;
