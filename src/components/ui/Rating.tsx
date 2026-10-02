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
