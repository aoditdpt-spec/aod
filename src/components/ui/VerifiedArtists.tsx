import { BadgeCheck, Check } from "lucide-react";
import { verifiedArtists } from "@/content/site";

// The "every artist is verified" promise, in three sizes:
// `band` for a full homepage section, `card` beside booking forms, `inline` as a one-line pill.
export function VerifiedArtists({ variant = "card", dark = false }: { variant?: "band" | "card" | "inline"; dark?: boolean }) {
  if (variant === "inline") {
    return (
      <p
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
          dark ? "bg-white/10 text-white" : "bg-peach/60 text-ink"
        }`}
      >
        <BadgeCheck className={`h-4 w-4 shrink-0 ${dark ? "text-apricot" : "text-brand"}`} aria-hidden />
        {verifiedArtists.short}
      </p>
    );
  }

  if (variant === "band") {
    return (
      <section className="grid items-center gap-8 rounded-[1.5rem] bg-peach/50 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white">
            <BadgeCheck className="h-7 w-7 text-brand" strokeWidth={1.5} aria-hidden />
          </span>
          <h2 className="mt-6 text-3xl font-normal sm:text-[2.5rem] sm:leading-tight">{verifiedArtists.title}</h2>
          <p className="mt-4 max-w-xl text-lg text-body">{verifiedArtists.text}</p>
        </div>
        <Points />
      </section>
    );
  }

  return (
    <aside className="rounded-[1.25rem] border border-line bg-peach/40 p-6">
      <p className="flex items-center gap-2 font-medium text-ink">
        <BadgeCheck className="h-5 w-5 text-brand" aria-hidden />
        {verifiedArtists.title}
      </p>
      <p className="mt-2 text-sm text-body">{verifiedArtists.text}</p>
      <div className="mt-4">
        <Points compact />
      </div>
    </aside>
  );
}

function Points({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={compact ? "space-y-2" : "space-y-4"}>
      {verifiedArtists.points.map((p) => (
        <li
          key={p}
          className={`flex items-center gap-3 text-ink ${compact ? "text-sm" : "rounded-card bg-white p-5 text-lg"}`}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-brand text-white ${
              compact ? "h-5 w-5" : "h-8 w-8"
            }`}
          >
            <Check className={compact ? "h-3 w-3" : "h-4 w-4"} aria-hidden />
          </span>
          {p}
        </li>
      ))}
    </ul>
  );
}
