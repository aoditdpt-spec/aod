import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, PartyPopper } from "lucide-react";
import { bookingChoice } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { VerifiedArtists } from "@/components/ui/VerifiedArtists";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard, iconHover } from "@/components/motion/TiltCard";

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
        {options.map(({ href, icon: I, label, text }) => (
          <StaggerItem key={href}>
            <Link href={href} className="block h-full rounded-[1.5rem] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4">
              <TiltCard
                max={5}
                className="flex flex-col rounded-[1.5rem] border-2 border-line bg-white p-8 transition-[border-color,box-shadow] duration-300 hover:border-brand hover:shadow-[0_8px_24px_rgba(249,115,22,0.15)] sm:p-10"
              >
              <span className={`flex h-14 w-14 items-center justify-center rounded-xl bg-peach/60 ${iconHover}`}>
                <I className="h-7 w-7 text-brand" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="mt-8 text-2xl font-medium text-ink sm:text-3xl">{label}</span>
              <span className="mt-2 flex-1 text-muted">{text}</span>
              <span className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 font-medium text-white transition-colors group-hover:bg-brand-hover">
                {label}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </span>
              </TiltCard>
            </Link>
          </StaggerItem>
        ))}
      </StaggerList>
    </Container>
  );
}
