"use client";

import Link from "next/link";
import { ArrowRight, Check, Search } from "lucide-react";
import type { ReactNode } from "react";
import { onboardingStages, sampleArtist, sampleStage } from "@/content/artist-portal";
import { blockedDatesStore, modeStore, profileStore, type ArtistProfile, type PreviewMode } from "@/lib/artist-store";
import { whatsappUrl } from "@/lib/whatsapp";
import { BookingCard, useBookings } from "./BookingCard";
import { Badge, Panel } from "./form";
import { OnboardingTimeline } from "./OnboardingTimeline";

// Profile checklist: what's left before the profile is complete. Uploads and identity can't be
// checked yet (nothing is uploaded in the preview), so they always show as to-do.
export function useProfileChecks(): { label: string; done: boolean; href: string }[] {
  const profile: ArtistProfile = profileStore.use() ?? { ...sampleArtist, agreeTerms: true };
  const blocked = blockedDatesStore.use();
  return [
    { label: "Services and experience", done: profile.services.length > 0 && !!profile.experience, href: "/artists/profile" },
    { label: "About your work", done: profile.bio.trim().length >= 40, href: "/artists/profile" },
    { label: "Portfolio links", done: profile.links.length > 0, href: "/artists/portfolio" },
    { label: "Portfolio photos and videos", done: false, href: "/artists/portfolio" },
    { label: "Identity (DigiLocker)", done: false, href: "/artists/documents" },
    { label: "Days you're unavailable", done: blocked.length > 0, href: "/artists/availability" },
  ];
}

function ProfileStrength() {
  const checks = useProfileChecks();
  const done = checks.filter((c) => c.done).length;
  const pct = Math.round((done / checks.length) * 100);
  return (
    <Panel title="Profile strength" text="A complete profile gets matched more often.">
      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-wash" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-medium text-ink">{pct}%</span>
      </div>
      <ul className="mt-5 space-y-1">
        {checks.map((c) => (
          <li key={c.label}>
            <Link href={c.href} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-wash">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.done ? "bg-brand text-white" : "ring-1 ring-line"}`}
              >
                {c.done && <Check className="h-3 w-3" aria-hidden />}
              </span>
              <span className={`flex-1 ${c.done ? "text-muted line-through" : "text-ink"}`}>{c.label}</span>
              {!c.done && <ArrowRight className="h-4 w-4 text-muted" aria-hidden />}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function ModeSwitch() {
  const mode = modeStore.use();
  const options: [PreviewMode, string][] = [
    ["live", "Live artist"],
    ["applicant", "New applicant"],
  ];
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted">Preview as</span>
      <div role="radiogroup" aria-label="Preview as" className="flex rounded-lg bg-white p-1 ring-1 ring-line">
        {options.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => modeStore.set(value)}
            className={`rounded-md px-3 py-1.5 font-medium transition-colors ${mode === value ? "bg-brand text-white" : "text-body hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-[1.25rem] border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-medium text-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

const sampleTag = <Badge>Sample data</Badge>;

export function Dashboard() {
  const mode = modeStore.use();
  const profile = profileStore.use();
  const bookings = useBookings();
  const name = (profile?.fullName || sampleArtist.fullName).split(/\s+/)[0];
  const requests = bookings.filter((b) => b.status === "new");
  const quoted = bookings.filter((b) => b.status === "quoted");
  const upcoming = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium sm:text-4xl">Hi, {name}</h1>
          <p className="mt-2 text-body">
            {mode === "live" ? "Here's what's happening with your bookings." : "Here's where your application stands."}
          </p>
        </div>
        <ModeSwitch />
      </div>

      {mode === "applicant" ? (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Your onboarding" text={`Step ${sampleStage + 1} of ${onboardingStages.length}`} action={sampleTag}>
            <OnboardingTimeline
              current={sampleStage}
              detail={
                <div className="rounded-xl bg-peach/40 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Search className="h-4 w-4 text-brand" aria-hidden /> Our team is reviewing your portfolio
                  </p>
                  <p className="mt-1 text-sm text-body">We&apos;ll message you on WhatsApp if we need anything else.</p>
                  <a
                    href={whatsappUrl("Hi AOD, I have a question about my artist application.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm font-medium text-brand underline underline-offset-4 hover:text-brand-hover"
                  >
                    Have a question? Message us
                  </a>
                </div>
              }
            />
          </Panel>
          <div className="space-y-6">
            <ProfileStrength />
            <Panel title="While we review">
              <ul className="space-y-2 text-sm text-body">
                {[
                  "Add more of your best photos or clips to your portfolio",
                  "Verify your identity with DigiLocker on the Documents page",
                  "Mark the days you can't work under Availability",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="New requests" value={requests.length} note="Waiting for your reply" />
            <Stat label="Quotes sent" value={quoted.length} note="Waiting for the customer" />
            <Stat label="Upcoming bookings" value={upcoming.length} note="Confirmed" />
            <Stat label="Reply time" value="2 hrs" note="Sample: your average" />
          </div>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Panel
              title="New booking requests"
              text="Reply with your quote. The customer sees 3 matched artists."
              action={
                <Link href="/artists/bookings" className="text-sm font-medium text-brand hover:text-brand-hover">
                  All bookings
                </Link>
              }
            >
              {requests.length === 0 ? (
                <p className="rounded-xl bg-wash p-6 text-center text-sm text-muted">You&apos;re all caught up. New requests appear here.</p>
              ) : (
                <div className="space-y-4">
                  {requests.map((b) => (
                    <BookingCard key={b.id} booking={b} compact />
                  ))}
                </div>
              )}
            </Panel>
            <div className="space-y-6">
              <Panel title="Next booking" action={sampleTag}>
                {upcoming[0] ? <BookingCard booking={upcoming[0]} compact /> : <p className="text-sm text-muted">No bookings coming up.</p>}
              </Panel>
              <ProfileStrength />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
