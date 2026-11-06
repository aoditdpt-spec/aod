"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import { useHydrated, useReducedMotionSafe } from "@/lib/motion-safe";
import { ArrowRight, Search } from "lucide-react";
import { categories, hero } from "@/content/site";
import { searchServices } from "@/lib/search";

type Variant = "hero" | "nav";

// The photo of the category a suggestion leads to (a category or one of its services).
function photoFor(href: string) {
  return categories.find((c) => href === `/categories/${c.slug}`)?.image;
}

const styles = {
  // Headout-style: a big white box with a soft shadow, the magnifier on the left and an orange
  // button (just the icon on phones).
  hero: {
    box: "h-14 rounded-2xl border border-line bg-white pl-4 pr-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] focus-within:border-brand sm:h-16 sm:pl-5 sm:pr-2",
    lead: "mr-3 h-5 w-5 text-muted",
    input: "text-base text-ink",
    button: "h-11 justify-center rounded-xl bg-brand px-3 text-white hover:bg-brand-hover sm:h-12 sm:px-6",
    icon: "h-5 w-5 sm:hidden",
    label: "hidden sm:inline",
  },
  nav: {
    box: "h-10 rounded-lg border border-line bg-white pl-3 pr-1 focus-within:border-brand max-lg:rounded-xl max-lg:border-transparent max-lg:bg-wash max-lg:focus-within:bg-white",
    lead: "mr-2 h-4 w-4 text-muted",
    input: "text-sm text-body",
    button: "h-8 rounded-md bg-brand px-3 text-sm text-white hover:bg-brand-hover",
    icon: "h-4 w-4 2xl:hidden",
    label: "hidden 2xl:inline",
  },
} satisfies Record<Variant, Record<string, string>>;

// Words the placeholder types out: every category plus each category's popular services.
const TYPED_WORDS = [
  ...categories.map((c) => c.name),
  ...categories.flatMap((c) => c.services.filter((s) => s.popular).map((s) => s.name)),
];

function shuffled<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Types a word, pauses, deletes it, then types the next one in random order (Blinkit-style).
// With `swapOnly` (visitor prefers reduced motion) it just shows a new word every few seconds.
// It writes straight into `text` (no React re-render per letter) and only runs while `box` is on
// screen, so a hidden or scrolled-away search box costs nothing.
function useTypedPlaceholder(text: RefObject<HTMLSpanElement | null>, box: RefObject<HTMLElement | null>, active: boolean, swapOnly: boolean) {
  useEffect(() => {
    const el = text.current;
    const area = box.current;
    if (!active || !el || !area) return;
    let words = shuffled(TYPED_WORDS);
    let w = 0;
    let i = 0;
    let deleting = false;
    let timer = 0;
    let visible = false;
    const nextWord = () => {
      w++;
      if (w === words.length) {
        words = shuffled(TYPED_WORDS);
        w = 0;
      }
    };
    const later = (ms: number) => {
      timer = window.setTimeout(tick, ms);
    };
    function tick() {
      timer = 0;
      if (!visible || !el) return; // resumes when the box comes back into view
      if (swapOnly) {
        el.textContent = words[w];
        nextWord();
        return later(2800);
      }
      const word = words[w];
      if (!deleting) {
        i++;
        el.textContent = word.slice(0, i);
        if (i === word.length) {
          deleting = true;
          return later(1500);
        }
        return later(65 + Math.random() * 50);
      }
      i--;
      el.textContent = word.slice(0, i);
      if (i === 0) {
        deleting = false;
        nextWord();
        return later(350);
      }
      later(30);
    }
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !timer) later(400);
    });
    seen.observe(area);
    return () => {
      seen.disconnect();
      window.clearTimeout(timer);
    };
  }, [text, box, active, swapOnly]);
}

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
  // Hydration-safe: the server renders the plain placeholder, the typing starts once the page is live.
  const hydrated = useHydrated();
  const reduce = useReducedMotionSafe();
  // Runs for everyone while the box is empty and not focused (only swaps words under reduced motion).
  const animatePlaceholder = hydrated && !focused && query === "";
  const formRef = useRef<HTMLFormElement>(null);
  const typedRef = useRef<HTMLSpanElement>(null);
  useTypedPlaceholder(typedRef, formRef, animatePlaceholder, reduce);
  const s = styles[variant];

  const hasQuery = query.trim().length > 0;
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
      ref={formRef}
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (!hasQuery) return;
        go(results[active]?.href ?? results[0]?.href ?? "/book");
      }}
    >
      <div className={`flex items-center ${s.box}`}>
        <Search className={`shrink-0 ${s.lead}`} aria-hidden />
        <label htmlFor={`${id}-input`} className="sr-only">
          Search artists and services
        </label>
        <div className="relative min-w-0 flex-1">
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
            placeholder={animatePlaceholder ? "" : variant === "nav" ? "Search artists & services" : hero.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            autoFocus={autoFocus}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showResults}
            aria-controls={`${id}-list`}
            aria-activedescendant={showResults && active >= 0 ? `${id}-opt-${active}` : undefined}
            className={`w-full bg-transparent outline-none placeholder:text-muted ${s.input}`}
          />
          {animatePlaceholder && (
            // Spans the full input width and truncates with "…", so long suggestions never spill out.
            // Greyed out like a disabled field, so it reads as a hint rather than typed text.
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 flex items-center overflow-hidden text-muted/70 ${s.input}`}
            >
              <span className="truncate">
                Search &ldquo;<span ref={typedRef} />
                {!reduce && <span className="mx-px inline-block h-[1em] w-[1.5px] translate-y-[0.12em] animate-caret bg-muted/50" />}
                &rdquo;
              </span>
            </span>
          )}
        </div>
        <button type="submit" aria-label="Search" className={`inline-flex shrink-0 items-center gap-2 font-medium ${s.button}`}>
          <Search className={s.icon} aria-hidden />
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
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm lg:gap-4 lg:px-4 lg:py-2.5 ${
                i === active ? "bg-wash" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                {/* A photo (or the magnifier) before each suggestion on phones and tablets; laptops show the text alone. */}
                {(() => {
                  const photo = photoFor(r.href);
                  return photo ? (
                    <Image src={photo.src} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg object-cover lg:hidden" />
                  ) : (
                    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wash lg:hidden">
                      <Search className="h-4 w-4 text-muted" />
                    </span>
                  );
                })()}
                <span className={`truncate ${r.hint === "Category" ? "font-medium text-ink" : "text-ink"}`}>{r.label}</span>
              </span>
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
