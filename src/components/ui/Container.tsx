import type { ReactNode } from "react";

// Full-width wrapper used by every section: content runs edge to edge with a small side gutter.
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`w-full px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
