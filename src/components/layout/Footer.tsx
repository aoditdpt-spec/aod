import Image from "next/image";
import Link from "@/components/ui/AppLink";
import { footer } from "@/data/home";
import { brand, whatsappUrl } from "@/data/site";
import { Container } from "@/components/ui/Container";

// The black band at the end of every page: who AOD is and how to reach it, then the links.
export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Image src="/aod-wordmark-sm.png" alt="AOD." width={71} height={20} unoptimized className="h-5 w-auto" />
            <p className="mt-4 max-w-xs text-sm text-paper/60">{footer.tagline}</p>
            <div className="mt-6 space-y-1.5 text-sm">
              <a href={brand.phoneHref} className="block hover:text-paper/70">
                {brand.phoneDisplay}
              </a>
              <a href={`mailto:${brand.email}`} className="block hover:text-paper/70">
                {brand.email}
              </a>
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="block hover:text-paper/70">
                WhatsApp Us
              </a>
            </div>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-medium">{col.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-paper/60">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-paper">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-paper/15 pt-6 text-sm text-paper/50 md:mt-14">
          <span>© 2026 {brand.fullName}</span>
          <span>{brand.city}, Gujarat</span>
        </div>
      </Container>
    </footer>
  );
}
