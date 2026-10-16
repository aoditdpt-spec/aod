import Link from "next/link";
import { Check } from "lucide-react";
import { bookingOptions } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";
import { tiltText, tiltTitle, tiltZoom } from "@/components/ui/cards";

type Option = (typeof bookingOptions)[keyof typeof bookingOptions];

// "Choose how you want to book" — personal events vs AOD for Business.
export function BookingOptions() {
  return (
    <section className="relative py-20">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[26.25rem] bg-gradient-to-b from-wash to-transparent bg-[repeating-linear-gradient(135deg,transparent_0_14px,color-mix(in_srgb,var(--color-brand)_5%,transparent)_14px_15px)]"
      />
      <Container className="relative">
        <h2 className="text-center text-3xl font-normal sm:text-[2.5rem]">Choose how you want to book</h2>
        <p className="mt-6 text-center text-lg text-ink">One-off celebrations or a year of brand shoots — we&apos;ve got both.</p>

        <StaggerList className="mt-12 grid gap-8 md:grid-cols-2">
          <StaggerItem>
            <OptionCard option={bookingOptions.personal} href="/book/personal" />
          </StaggerItem>
          <StaggerItem>
            <OptionCard option={bookingOptions.business} href="/book/business" featured />
          </StaggerItem>
        </StaggerList>
      </Container>
    </section>
  );
}

function OptionCard({ option, href, featured = false }: { option: Option; href: string; featured?: boolean }) {
  return (
    <TiltCard
      max={4}
      className={`flex flex-col rounded-[1.25rem] bg-white p-8 ${featured ? "border border-apricot" : "border border-line"}`}
    >
      {featured && (
        <span className="absolute right-0 top-0 rounded-bl-xl rounded-tr-[1.25rem] bg-apricot px-3 py-1 text-xs font-medium uppercase tracking-wide text-ink">
          For brands
        </span>
      )}
      <h3 className={`text-2xl font-bold ${tiltTitle}`}>{option.name}</h3>
      <p className={`mt-1 text-xs text-muted ${tiltText}`}>{option.audience}</p>
      <p className={`mt-5 text-sm text-muted ${tiltText}`}>{option.text}</p>
      <hr className="my-6 border-line" />
      <p className={`text-ink ${tiltText}`}>{option.includesLabel}</p>
      <ul className={`mt-5 flex-1 space-y-3 text-sm text-muted ${tiltText}`}>
        {option.features.map((f) => (
          <li key={f} className="flex gap-3">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 text-ink ${tiltZoom}`} aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Link href={href} className={buttonClasses(featured ? "primary" : "outline", "md", "mt-8 w-full")}>
        {option.cta}
      </Link>
    </TiltCard>
  );
}
