import type { ReactNode } from "react";

// The page width: 1200px at most, centred, with the same side gutters as the navbar.
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
