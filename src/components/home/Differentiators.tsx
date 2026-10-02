import { BadgeCheck, Tag, Zap } from "lucide-react";
import { differentiators } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { MatchPrompt } from "./MatchPrompt";

const icons = [Zap, BadgeCheck, Tag];

// Dark card: headline + quick request box on the left, three promises on the right.
export function Differentiators() {
  return (
    <Container className="py-16">
      <section className="grid overflow-hidden rounded-[1.5rem] bg-night p-2 lg:grid-cols-2">
        <div className="rounded-[1.25rem] bg-night-soft bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgba(255,255,255,0.03)_14px_15px)] px-6 py-12 sm:px-12 sm:py-16">
          <h2 className="text-4xl font-medium leading-[1.1] !text-white sm:text-5xl">
            {differentiators.title[0]}
            <br />
            <span className="text-apricot">{differentiators.title[1]}</span>
          </h2>
          <p className="mt-6 text-lg text-white">Tell us what you need — we&apos;ll send 3 curated matches.</p>
          <MatchPrompt />
        </div>

        <ul className="flex flex-col justify-center gap-4 px-4 py-10 sm:px-12">
          {differentiators.items.map((item, i) => {
            const I = icons[i];
            return (
              <li key={item.title} className="flex gap-4 rounded-card border border-night-line bg-white/[0.03] p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tangerine/15">
                  <I className="h-5 w-5 text-tangerine" aria-hidden />
                </span>
                <div>
                  <h3 className="font-medium !text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </Container>
  );
}
