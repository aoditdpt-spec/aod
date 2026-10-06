import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { onboardingStages } from "@/content/artist-portal";

// Joining AOD as a vertical timeline: done stages ticked, the current one highlighted.
// `current` indexes onboardingStages; `detail` is shown under the current stage.
export function OnboardingTimeline({ current, detail }: { current: number; detail?: ReactNode }) {
  return (
    <ol className="relative">
      {onboardingStages.map((s, i) => {
        const done = i < current;
        const now = i === current;
        const last = i === onboardingStages.length - 1;
        return (
          <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span aria-hidden className={`absolute left-[0.9rem] top-8 h-[calc(100%-2rem)] w-0.5 ${done ? "bg-brand" : "bg-line"}`} />
            )}
            <span
              className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                done ? "bg-brand text-white" : now ? "bg-white text-brand ring-2 ring-brand" : "bg-wash text-muted ring-1 ring-line"
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <div className="pt-0.5">
              <p className={`font-medium ${now ? "text-brand" : done ? "text-ink" : "text-muted"}`}>
                {s.title}
                {now && <span className="sr-only"> (current step)</span>}
              </p>
              <p className="mt-0.5 text-sm text-muted">{s.text}</p>
              {now && detail && <div className="mt-3">{detail}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
