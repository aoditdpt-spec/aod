import type { ReactNode } from "react";

// Cards that don't open anything (facts, promises, checks). They used to tilt, pop up and zoom on
// hover; for the clean, minimal look (design-tests/) they now sit still. The name and props stay
// so every caller works unchanged; `group/tilt` is kept for any styles that still key off it.
// The card fills its grid cell (`fill`) unless something sits under it in the same cell.
export function TiltCard({
  children,
  className = "",
  fill = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  fill?: boolean;
}) {
  return <div className={`group group/tilt relative ${fill ? "h-full" : ""} ${className}`}>{children}</div>;
}
