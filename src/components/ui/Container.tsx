import type { ReactNode } from "react";

// Page-width wrapper used by every section (max 1280px content, 16px gutter on phones).
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1312px] px-4 sm:px-8 ${className}`}>{children}</div>;
}
