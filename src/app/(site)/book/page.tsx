import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, PartyPopper } from "lucide-react";
import { bookingChoice } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { linkCard, linkText, linkTitle } from "@/components/ui/cards";

export const metadata: Metadata = {
  title: "Book an artist",
  description: "Booking for a personal event or for your business? Pick one and get curated artist matches.",
  alternates: { canonical: "/book" },
};

const options = [
  { href: "/book/personal", icon: PartyPopper, ...bookingChoice.personal },
  { href: "/book/business", icon: Briefcase, ...bookingChoice.business },
];

// Choosing screen: every "book" button on the site lands here first.
export default function BookPage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-normal sm:text-5xl">{bookingChoice.title}</h1>
        <p className="mt-4 text-lg text-body">{bookingChoice.subtitle}</p>
        <div className="mt-6">
          <VerifiedArtists variant="inline" />
        </div>
      </div>

      <StaggerList className="mt-12 grid gap-6 md:grid-cols-2">
        {options.map(({ href, icon: I, label, text, image }) => (
          <StaggerItem key={href}>
            <Link
              href={href}
              className={`flex h-full flex-col rounded-[1.5rem] bg-white p-3 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 sm:p-4 ${linkCard}`}
            >
              {/* The photo on top with the icon on a small tile, as Headout's cards. */}
              <span className="relative block aspect-[16/9] overflow-hidden rounded-[1.1rem] bg-peach">
                <Image src={image} alt="" fill preload sizes="(min-width: 768px) 40rem, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 backdrop-blur-sm">
                  <I className="h-6 w-6 text-brand" strokeWidth={1.5} aria-hidden />
                </span>
              </span>
              <span className="flex flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-5">
                <span className={`mt-6 text-2xl font-medium text-ink sm:text-3xl ${linkTitle}`}>{label}</span>
                <span className={`mt-2 flex-1 text-muted ${linkText}`}>{text}</span>
                <span className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 font-medium text-white transition-colors group-hover:bg-brand-hover">
                  {label}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </span>
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>
    </Container>
  );
}
