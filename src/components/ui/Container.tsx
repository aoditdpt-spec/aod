import type { ReactNode } from "react";

// Wrapper used by every section: content runs nearly edge to edge with a small side gutter,
// up to the page width (`max-w-page`, about 1600px), and is centred on wider screens.
// Section backgrounds sit outside it, so they still run full width.
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}
