"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { hero } from "@/content/site";
import { searchServices } from "@/lib/search";

type Variant = "hero" | "nav";

const styles = {
  hero: {
    box: "h-14 rounded-xl bg-white pl-6 pr-1.5",
    input: "text-body",
    button: "h-11 rounded-lg bg-night px-4 text-lg text-white hover:bg-black sm:px-5",
    icon: "h-5 w-5 text-tangerine",
    label: "hidden sm:inline",
  },
  nav: {
    box: "h-10 rounded-lg border border-line bg-white pl-3 pr-1 focus-within:border-brand",
    input: "text-sm text-body",
    button: "h-8 rounded-md bg-brand px-3 text-sm text-white hover:bg-brand-hover",
    icon: "h-4 w-4",
    label: "hidden 2xl:inline",
  },
} satisfies Record<Variant, Record<string, string>>;

// Search input with ranked, typo-tolerant suggestions (see src/lib/fuzzy.ts).
// Arrow keys move through suggestions, Enter opens the highlighted one (or the best match),
// Escape closes the list. With no match, it offers the booking flow instead.
export function SearchBox({
  variant = "hero",
  autoFocus = false,
  onNavigate,
}: {
  variant?: Variant;
  autoFocus?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const id = useId();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const results = useMemo(() => searchServices(query), [query]);
  const s = styles[variant];

  const typed = query.trim().length > 0;
  const showResults = focused && results.length > 0;
  const showEmpty = focused && query.trim().length >= 2 && results.length === 0;

  function go(href: string) {
    setQuery("");
    setActive(-1);
    setFocused(false);
    onNavigate?.();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setFocused(true);
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setFocused(false);
      setActive(-1);
    }
  }

  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (!typed) return;
        go(results[active]?.href ?? results[0]?.href ?? "/book");
      }}
    >
      <div className={`flex items-center ${s.box}`}>
        {variant === "nav" && <Search className="mr-2 h-4 w-4 shrink-0 text-muted" aria-hidden />}
        <label htmlFor={`${id}-input`} className="sr-only">
          Search artists and services
        </label>
        <input
          id={`${id}-input`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setFocused(true);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder={variant === "nav" ? "Search artists & services" : hero.searchPlaceholder}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={`${id}-list`}
          aria-activedescendant={showResults && active >= 0 ? `${id}-opt-${active}` : undefined}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted ${s.input}`}
        />
        <button type="submit" aria-label="Search" className={`inline-flex shrink-0 items-center gap-2 font-medium ${s.button}`}>
          {variant === "hero" ? <Search className={s.icon} aria-hidden /> : <Search className={`${s.icon} 2xl:hidden`} aria-hidden />}
          <span className={s.label}>Search</span>
        </button>
      </div>

      {showResults && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-card border border-line bg-white py-2 shadow-xl"
        >
          {results.map((r, i) => (
            <li
              key={`${r.hint}-${r.label}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown would blur the input and close the list before the click lands
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r.href)}
              className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-sm ${
                i === active ? "bg-wash" : ""
              }`}
            >
              <span className={r.hint === "Category" ? "font-medium text-ink" : "text-ink"}>{r.label}</span>
              <span className="shrink-0 text-xs text-muted">{r.hint === "Category" ? "All services" : r.hint}</span>
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-card border border-line bg-white p-4 text-sm shadow-xl">
          <p className="text-ink">
            No match for <span className="font-medium">&ldquo;{query.trim()}&rdquo;</span>.
          </p>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => go("/book")}
            className="mt-2 inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
          >
            Tell us what you need — we&apos;ll find the artist <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </form>
  );
}
