import type { Metadata } from "next";
import Link from "@/components/ui/AppLink";
import { Container } from "@/components/ui/Container";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Dots } from "@/components/ui/Dots";
import { primaryButton } from "@/components/ui/buttons";

export const metadata: Metadata = {
  title: "Page Not Found",
  description:
    "This page doesn't exist. Book a verified artist from the AOD homepage.",
};

// Our own 404, inside the site's navbar and footer. It also replaces Next's built-in one, whose
// dark-mode style (a black page on phones and laptops set to dark) stayed behind after going
// back to the homepage, turning it black until a refresh.
export default function NotFound() {
  return (
    <SiteChrome>
      <main className="flex-1">
        <Container className="pb-24 pt-8 sm:pt-10 lg:pb-32 lg:pt-14">
          <p className="text-sm text-muted">404</p>
          <h1 className="mt-4 text-5xl sm:text-7xl">
            <Dots>Page Not Found.</Dots>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            This page doesn&apos;t exist or has moved.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/" className={primaryButton}>
              Go Home
            </Link>
          </div>
        </Container>
      </main>
    </SiteChrome>
  );
}
