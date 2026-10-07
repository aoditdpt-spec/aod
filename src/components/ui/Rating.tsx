import { Star } from "lucide-react";

export function Rating({ rating, count, unit }: { rating: number; count: number; unit: string }) {
  return (
    <p className="flex items-center gap-1 text-sm text-muted">
      <Star aria-hidden className="h-4 w-4 fill-brand-bright text-brand-bright" />
      <span className="font-medium text-ink">{rating.toFixed(2).replace(/0$/, "")}</span>
      <span>
        ({count} {unit})
      </span>
    </p>
  );
}

// Five stars filled to `value` out of 5 (4.9 fills the fifth star nine-tenths of the way).
export function Stars({ value, className = "h-5 w-5" }: { value: number; className?: string }) {
  const row = (fill: string) =>
    Array.from({ length: 5 }, (_, i) => <Star key={i} aria-hidden className={`${className} shrink-0 ${fill}`} />);
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className="relative inline-flex gap-0.5">
      <span className="inline-flex gap-0.5">{row("fill-line text-line")}</span>
      <span className="absolute inset-y-0 left-0 inline-flex gap-0.5 overflow-hidden" style={{ width: `${(value / 5) * 100}%` }}>
        {row("fill-brand-bright text-brand-bright")}
      </span>
    </span>
  );
}
