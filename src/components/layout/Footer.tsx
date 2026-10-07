import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { legalDocs } from "@/content/legal";
import { brand, categories } from "@/content/site";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/Icon";
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
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#categories", label: "Browse services" },
      { href: "/business", label: "AOD for Business" },
    ],
  },
  {
    title: "For artists",
    links: [
      { href: "/for-artists", label: "Join as an artist" },
      { href: "/for-artists", label: "Zero joining fees" },
      { href: "/for-artists#verification", label: "How verification works" },
    ],
  },
  {
    title: "Policies",
    links: legalDocs.map((d) => ({ href: `/${d.slug}`, label: d.title })),
  },
];

export function Footer() {
  return (
    <footer className="px-4 pb-4 pt-16 sm:px-6 sm:pb-6 lg:px-8">
      <div className="rounded-[1.25rem] bg-night px-6 py-12 text-white sm:px-16 sm:py-14">
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
            </ul>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm text-white/60">{col.title}</h2>
              <ul className="mt-4 space-y-3 text-[0.9375rem]">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-apricot">
                      {l.label}
                    </Link>
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
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-apricot">
            <WhatsAppIcon />
          </a>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-night-line pt-6 text-sm text-white/60 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.fullName} · {brand.domain}
          </p>
          <p>Made in {brand.city}</p>
        </div>
      </div>
    </footer>
  );
}
