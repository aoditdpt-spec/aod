import { BadgeCheck } from "lucide-react";
import { business, stats } from "@/content/site";
import { Container } from "@/components/ui/Container";

// Headline numbers plus the GATE Expo credential. Rendered on the server so crawlers see real values.
export function Stats() {
  return (
    <Container className="py-16">
      <h2 className="text-center text-3xl font-normal sm:text-[40px]">Trusted across Gujarat</h2>
      <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <li key={s.label} className="rounded-card border border-line px-4 py-6 text-center">
            <p className="text-4xl font-medium text-ink">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-peach px-4 py-2 text-sm font-medium text-ink">
        <BadgeCheck className="h-4 w-4 text-brand" aria-hidden />
        {business.caseStudy.label}
      </p>
    </Container>
  );
}
