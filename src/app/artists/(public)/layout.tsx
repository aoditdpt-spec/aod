import Image from "next/image";
import Link from "@/components/ui/AppLink";
import { Container } from "@/components/ui/Container";
import { Footer } from "@/components/layout/Footer";

// The artist portal's sign-in and sign-up: its own small header (the logo with "Artist Portal"),
// since the portal is a separate site (artists.aod.co.in); each page carries Back To Main Site.
export default function ArtistsPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-ink bg-paper/95 backdrop-blur">
        <Container className="flex h-16 items-center gap-2.5">
          <Link href="/artists" className="flex shrink-0 items-center gap-2.5" aria-label="AOD Artist Portal">
            <Image src="/aod-wordmark-sm.png" alt="AOD." width={78} height={22} priority unoptimized className="h-[22px] w-auto" />
            <span className="rounded-full bg-wash px-2.5 py-1 text-xs font-medium text-ink">Artist Portal</span>
          </Link>
        </Container>
      </header>
      {children}
      <Footer />
    </div>
  );
}
