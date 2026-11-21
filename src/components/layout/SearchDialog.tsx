"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { categories, nav } from "@/data/site";
import { SearchIcon } from "@/components/ui/SearchIcon";
import { createSearch } from "@/lib/fuzzy";
import { searchEntries, type SearchResult as Result } from "@/lib/search-index";
import { useMounted } from "@/lib/use-mounted";
import { startTyping } from "@/lib/typing";

// Built once: every category and service, ready for the typo-tolerant search (src/lib/fuzzy.ts).
const entries = searchEntries(categories);
const find = createSearch(entries);
const allCategories = entries.map((e) => e.item).filter((r) => r.isCategory);

// The empty box lists the categories; anything typed is searched, spelling mistakes and all.
const search = (query: string): Result[] => (query.trim() ? find(query) : allCategories);

const ease = [0.22, 1, 0.36, 1] as const;

const LAPTOP = "(min-width: 1024px)";
function useLaptop() {
  return useSyncExternalStore(
    (onChange) => {
      const q = window.matchMedia(LAPTOP);
      q.addEventListener("change", onChange);
      return () => q.removeEventListener("change", onChange);
    },
    () => window.matchMedia(LAPTOP).matches,
    () => true,
  );
}

// The search (the navbar's search, or Ctrl / ⌘ K).
// Laptops: a box over the dimmed page. Phones and tablets: as on apple.com, a white panel that
// fills the screen under the top bar (whose menu button turns into the close cross), with a large
// search field and the results fading in one after another.
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mounted = useMounted();
  const laptop = useLaptop();

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open &&
        (laptop ? (
          <motion.div
            key="search-laptop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onPointerDown={(e) => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={nav.searchLong}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease }}
              className="mx-auto mt-[12vh] w-full max-w-xl overflow-hidden rounded-xl bg-paper shadow-2xl"
            >
              <LaptopPanel onClose={onClose} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="search-phone"
            role="dialog"
            aria-modal="true"
            aria-label={nav.searchLong}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="fixed inset-x-0 bottom-[var(--bottom-bar)] top-14 z-40 overflow-y-auto bg-paper"
          >
            <PhonePanel onClose={onClose} />
          </motion.div>
        ))}
    </AnimatePresence>,
    document.body,
  );
}

// What both looks share: the query, the highlighted row, the keys and the typing placeholder.
function useSearchBox(onClose: () => void) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = search(query);
  const input = useRef<HTMLInputElement>(null);

  // The empty box types artists and services, as the bar in the navbar does.
  useEffect(
    () =>
      startTyping(nav.searchWords, (text) => {
        if (input.current) input.current.placeholder = text;
      }),
    [],
  );

  function go(r: Result | undefined) {
    if (!r) return;
    onClose();
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") go(results[active]);
  }

  const inputProps = {
    ref: input,
    autoFocus: true,
    value: query,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setActive(0);
    },
    placeholder: nav.searchWords[0],
    "aria-label": nav.searchLong,
    enterKeyHint: "search" as const,
  };

  return { query, active, setActive, results, go, onKeyDown, inputProps };
}

const inputReset = "min-w-0 flex-1 appearance-none border-0 bg-transparent text-ink shadow-none outline-none ring-0 placeholder:text-muted focus:outline-none focus:ring-0 focus-visible:outline-none";

function LaptopPanel({ onClose }: { onClose: () => void }) {
  const { query, active, setActive, results, go, onKeyDown, inputProps } = useSearchBox(onClose);
  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 border-b border-line pl-4 pr-2">
        <SearchIcon className="h-5 w-5 shrink-0 text-ink" />
        <input {...inputProps} className={`h-14 text-base ${inputReset}`} />
        <button type="button" onClick={onClose} className="h-10 rounded-full px-3 text-[15px] text-muted transition-colors hover:bg-wash hover:text-ink">
          {nav.close}
        </button>
      </div>

      {results.length > 0 ? (
        <ul role="listbox" aria-label="Results" className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
          {results.map((r, i) => (
            <li key={r.key} role="option" aria-selected={i === active}>
              <button
                type="button"
                onPointerMove={() => setActive(i)}
                onClick={() => go(r)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${i === active ? "bg-wash" : ""}`}
              >
                <Image src={r.category.image} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-md bg-wash object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{r.title}</span>
                  <span className="block truncate text-[13px] text-muted">{r.detail}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <NoMatch query={query} />
      )}
    </div>
  );
}

// Phones: apple.com's search. The field slides down into place, then the list's rows follow one
// after another; each new set of results does the same.
const list: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.03, delayChildren: 0.08 } } };
const row: Variants = {
  hidden: { opacity: 0, y: -6 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

function PhonePanel({ onClose }: { onClose: () => void }) {
  const { query, results, go, onKeyDown, inputProps } = useSearchBox(onClose);
  const typed = query.trim().length > 0;

  return (
    <div onKeyDown={onKeyDown} className="px-6 pb-8 pt-5 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex items-center gap-3"
      >
        <SearchIcon className="h-6 w-6 shrink-0 text-muted" />
        <input {...inputProps} className={`h-12 text-2xl font-medium tracking-tight ${inputReset}`} />
      </motion.div>

      {results.length > 0 ? (
        <>
          <motion.p
            key={typed ? "results" : "popular"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.08 } }}
            className="mt-8 text-xs text-muted"
          >
            {typed ? "Results" : "Popular"}
          </motion.p>
          {/* Keyed by what's typed, so each new set of results fades in from the top again. */}
          <motion.ul key={query.trim()} variants={list} initial="hidden" animate="shown" className="mt-3">
            {results.map((r) => (
              <motion.li key={r.key} variants={row}>
                <button type="button" onClick={() => go(r)} className="block w-full py-2.5 text-left active:opacity-60">
                  <span className="block text-[17px] font-medium leading-snug text-ink">{r.title}</span>
                  {!r.isCategory && <span className="block text-[13px] text-muted">{r.detail}</span>}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </>
      ) : (
        <NoMatch query={query} />
      )}
    </div>
  );
}

function NoMatch({ query }: { query: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="font-medium text-ink">Nothing matches &ldquo;{query}&rdquo;</p>
      <p className="mt-1 text-sm text-muted">Try another word, such as a category or a kind of artist.</p>
    </div>
  );
}
