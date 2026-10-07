"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { howItWorks } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { PhotoPlaceholder } from "@/components/ui/PhotoPlaceholder";
import type { AnyIconName } from "@/components/ui/Icon";
import { StaggerItem, StaggerList } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";

const tabs = [
  { id: "clients", label: "For booking", icons: ["sparkles", "camera", "signature"] },
  { id: "artists", label: "For artists", icons: ["handshake", "camera", "video"] },
] as const;

// Three photo cards that switch between the booking and the artist journey.
export function HowItWorks() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("clients");
  const active = tabs.find((t) => t.id === tab)!;
  const steps = howItWorks[tab];

  return (
    <Container className="py-16">
      <section id="how-it-works" className="scroll-mt-24">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <h2 className="text-3xl font-normal sm:text-[2.5rem]">How it works</h2>
          <div role="tablist" aria-label="How it works for" className="grid grid-cols-2 rounded-xl border border-body/40 p-0.5 sm:w-[21.875rem]">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-lg py-2 text-[0.9375rem] transition-colors ${
                  tab === t.id ? "border-2 border-ink font-medium text-ink" : "text-body hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Keyed by tab so switching tabs plays the wave again. */}
        <StaggerList key={tab} className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <StaggerItem key={s.title}>
              <TiltCard fill={false} className="rounded-card">
                <PhotoPlaceholder icon={active.icons[i] as AnyIconName} label={s.title} className="aspect-[3/2]" />
              </TiltCard>
              <h3 className="mt-6 text-xl font-normal">
                <span className="mr-2 text-brand-bright">{i + 1}.</span>
                {s.title}
              </h3>
              <p className="mt-2 text-body">{s.text}</p>
            </StaggerItem>
          ))}
        </StaggerList>

        {tab === "clients" && (
          <p className="mt-10 flex items-start gap-3 rounded-card bg-wash p-5 text-ink">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
            {howItWorks.replacement}
          </p>
        )}
      </section>
    </Container>
  );
}
