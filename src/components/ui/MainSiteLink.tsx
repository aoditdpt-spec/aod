import { ArrowLeft } from "lucide-react";
import { siteHref } from "@/lib/site-url";

// "Back to main site": a button in the header of every separate site (the artist portal, the
// admin and the Dispute Desk), always visible, to www.aod.co.in. A plain link, since it leaves
// the subdomain. `compact` shows only the arrow below 640px (the admin's crowded phone header).
export function MainSiteLink({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={siteHref("/")}
      aria-label="Back to the main site, aod.co.in"
      className="press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-peach px-3 text-sm font-medium text-ink transition-colors hover:bg-brand hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span className={compact ? "hidden sm:inline" : undefined}>
        <span className="sm:hidden">Main site</span>
        <span className="hidden sm:inline">Back to main site</span>
      </span>
    </a>
  );
}
