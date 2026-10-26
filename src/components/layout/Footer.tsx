import { ChevronDown, Mail, MapPin, Phone } from "lucide-react";
import { legalDocs } from "@/content/legal";
import { brand, categories } from "@/content/site";
import { InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/ui/Icon";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { SectionLink } from "@/components/ui/SectionLink";
import { portalHref } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";
import { Logo } from "./Navbar";

const columns = [
  {
    title: "Popular categories",
    links: categories.slice(0, 6).map((c) => ({ href: `/categories/${c.slug}`, label: c.name })),
  },
  {
    title: "For clients",
    links: [
      { href: "/book", label: "Get curated matches" },
      { href: "/my-bookings", label: "My bookings" },
      { href: "/#resolution-centre", label: "Have a dispute?" },
      { href: "/business", label: "AOD for Business" },
      { href: "/blog", label: "Blog" },
      { href: "/about", label: "About us" },
    ],
  },
  {
    title: "For artists",
    links: [
      { href: "/for-artists", label: "Join as an artist" },
      { href: "/artists/apply", label: "Apply online" },
      { href: "/artists", label: "Artist portal sign-in" },
      { href: "/for-artists#verification", label: "How verification works" },
    ],
  },
  {
    title: "Policies & help",
    links: [...legalDocs.map((d) => ({ href: `/${d.slug}`, label: d.title })), { href: "/resolve", label: "Dispute Desk" }],
  },
];

// Full-width dark band; the content lines up with the page column (max-w-page). It opens with the
// newsletter sign-up. On phones the link columns fold into tap-to-open groups, as in apps, and the
// band leaves room at the bottom for the tab bar (AppTabBar).
export function Footer() {
  return (
    <footer className="mt-16 bg-night text-white max-lg:pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-page px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-12 border-b border-night-line pb-10 lg:max-w-2xl">
          <NewsletterSignup variant="dark" />
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo size="footer" />
            <p className="mt-3 max-w-xs text-sm text-white/70">{brand.tagline}</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a href={brand.phoneHref} className="inline-flex items-center gap-2 hover:text-apricot">
                  <Phone className="h-4 w-4" aria-hidden /> {brand.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${brand.email}`} className="inline-flex items-center gap-2 hover:text-apricot">
                  <Mail className="h-4 w-4" aria-hidden /> {brand.email}
                </a>
              </li>
              <li>
                <a href={brand.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-apricot">
                  <InstagramIcon className="h-4 w-4" /> {brand.instagramHandle}
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden /> {brand.city}, {brand.region}
              </li>
            </ul>
          </div>

          {/* Phones: each column folds (no JavaScript needed). */}
          <div className="-mt-4 divide-y divide-night-line border-y border-night-line sm:hidden">
            {columns.map((col) => (
              <details key={col.title} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {col.title}
                  <ChevronDown className="h-5 w-5 text-white/60 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <ul className="space-y-3 pb-5 text-[0.9375rem] text-white/80">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <SectionLink href={portalHref(l.href)} className="hover:text-apricot">
                        {l.label}
                      </SectionLink>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>

          {columns.map((col) => (
            <div key={col.title} className="max-sm:hidden">
              <h2 className="text-sm font-semibold text-white/60">{col.title}</h2>
              <ul className="mt-4 space-y-3 text-[0.9375rem]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <SectionLink href={portalHref(l.href)} className="hover:text-apricot">
                      {l.label}
                    </SectionLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center gap-5">
          <span className="text-sm text-white/60">Follow us</span>
          <a href={brand.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${brand.instagramHandle}`} className="hover:text-apricot">
            <InstagramIcon />
          </a>
          {brand.linkedinUrl && (
            <a href={brand.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-apricot">
              <LinkedInIcon />
            </a>
          )}
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-apricot">
            <WhatsAppIcon />
          </a>
        </div>

        {/* Right padding keeps the last words clear of the floating WhatsApp button. */}
        <div className="mt-6 flex flex-col gap-2 border-t border-night-line pt-6 pr-16 text-sm text-white/60 lg:pr-20 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.fullName} · {brand.domain}
          </p>
          <p>
            {brand.city}, {brand.region} ·{" "}
            {/* The admin panel's sign-in (admin.aod.co.in), for the AOD team. */}
            <SectionLink href={portalHref("/admin")} className="hover:text-apricot">
              AOD team sign-in
            </SectionLink>
          </p>
        </div>
      </div>
    </footer>
  );
}
