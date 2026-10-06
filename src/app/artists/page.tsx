import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { mainSiteUrl, portal } from "@/content/artist-portal";
import { categories } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PortalHeader } from "@/components/artists/PortalChrome";
import { SignIn } from "@/components/artists/SignIn";

export const metadata: Metadata = {
  // The layout's title template only applies to pages below /artists, so this one is spelled out.
  title: { absolute: `Sign in — ${portal.name}` },
  alternates: { canonical: "/artists" },
};

// Portal start page: sign in, or apply to join.
export default function ArtistsHome() {
  return (
    <>
      <PortalHeader
        right={
          <Link href={mainSiteUrl} className="text-sm text-muted hover:text-brand">
            Back to the main site
          </Link>
        }
      />
      <Container className="flex-1 py-10 sm:py-16">
        <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">{portal.name}</p>
            <h1 className="mt-4 text-4xl font-medium leading-[1.08] sm:text-5xl">{portal.signIn.title}</h1>
            <p className="mt-5 max-w-xl text-lg text-body">{portal.signIn.subtitle}</p>
            <ul className="mt-8 space-y-3">
              {portal.signIn.points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-ink">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>

            <Link
              href="/artists/apply"
              className="group mt-10 flex items-center justify-between gap-4 rounded-[1.25rem] bg-night p-6 text-white transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <span>
                <span className="block text-lg font-medium">Not with AOD yet?</span>
                <span className="mt-1 block text-sm text-white/70">Apply online. Zero joining fees, and an in-person meeting before you go live.</span>
              </span>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand">
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>

            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Who we're onboarding">
              {categories.map((c) => (
                <li key={c.slug} className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs text-ink">
                  <Icon name={c.icon} className="h-3.5 w-3.5 text-brand" /> {c.name}
                </li>
              ))}
            </ul>
          </div>
          <SignIn />
        </div>
      </Container>
    </>
  );
}
