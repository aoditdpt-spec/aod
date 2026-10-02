import Link from "next/link";
import { Check } from "lucide-react";
import { bookingOptions } from "@/content/site";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type Option = (typeof bookingOptions)[keyof typeof bookingOptions];

// "Choose how you want to book" — personal events vs AOD for Business.
export function BookingOptions() {
  return (
    <section className="relative py-20">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-wash to-transparent bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(194,65,12,0.05)_14px_15px)]"
      />
      <Container className="relative">
        <h2 className="text-center text-3xl font-normal sm:text-[40px]">Choose how you want to book</h2>
        <p className="mt-6 text-center text-lg text-ink">One-off celebrations or a year of brand shoots — we&apos;ve got both.</p>

        <div className="mx-auto mt-12 grid max-w-[928px] gap-8 md:grid-cols-2">
          <OptionCard option={bookingOptions.personal} href="/book/personal" />
          <OptionCard option={bookingOptions.business} href="/book/business" featured />
        </div>
      </Container>
    </section>
  );
}

function OptionCard({ option, href, featured = false }: { option: Option; href: string; featured?: boolean }) {
  return (
    <article
      className={`relative flex flex-col rounded-[1.25rem] bg-white p-8 ${
        featured ? "border border-apricot shadow-[0_8px_24px_rgba(249,115,22,0.15)]" : "border border-line"
      }`}
    >
      {featured && (
        <span className="absolute right-0 top-0 rounded-bl-xl rounded-tr-[1.25rem] bg-apricot px-3 py-1 text-xs font-medium uppercase tracking-wide text-ink">
          For brands
        </span>
      )}
      <h3 className="text-2xl font-normal">{option.name}</h3>
      <p className="mt-1 text-xs text-muted">{option.audience}</p>
      <p className="mt-5 text-sm text-muted">{option.text}</p>
      <hr className="my-6 border-line" />
      <p className="text-ink">{option.includesLabel}</p>
      <ul className="mt-5 flex-1 space-y-3 text-sm text-muted">
        {option.features.map((f) => (
          <li key={f} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Link href={href} className={buttonClasses(featured ? "primary" : "outline", "md", "mt-8 w-full")}>
        {option.cta}
      </Link>
    </article>
  );
}
