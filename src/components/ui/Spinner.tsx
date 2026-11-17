// A small turning ring in the current text colour, for buttons and anything waiting on the server.
// With `label`, screen readers announce it (role="status"); without, it's decoration next to text
// that already says what's happening ("Saving…"). It keeps turning, more slowly, under reduced
// motion, because it's the only sign that something is still happening.
export function Spinner({ className = "h-4 w-4", label }: { className?: string; label?: string }) {
  return (
    <span role={label ? "status" : undefined} className="inline-flex shrink-0">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`${className} animate-spin motion-reduce:[animation-duration:2s]`}>
        <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
        <path d="M21.5 12A9.5 9.5 0 0 0 12 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

// The AOD loader for whole pages and panels: the "A." monogram (as in the browser-tab icon)
// inside a turning orange ring, with a line saying what's loading. Fills `className`'s height
// and centres itself, so the footer doesn't jump up while a page loads.
export function PageLoader({ label = "Loading…", className = "min-h-[60vh]" }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 ${className}`}>
      <span className="relative flex h-16 w-16 items-center justify-center">
        <Spinner className="absolute inset-0 h-16 w-16 text-brand" />
        <span aria-hidden className="font-display text-xl font-bold leading-none text-brand">
          A.
        </span>
      </span>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
