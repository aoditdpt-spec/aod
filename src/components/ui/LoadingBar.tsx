"use client";

import { useEffect, useState } from "react";
import { NAVIGATE_EVENT } from "@/lib/navigate-event";
import { Spinner } from "./Spinner";

// The thin orange bar across the top of every page while something loads: from the first paint
// until the page, its pictures and fonts have arrived, and on every move to another page until
// the address has changed (the new page is then on screen). A move that takes longer than about
// half a second also shows a "Loading…" pill at the bottom of the screen. The bar is in the server
// HTML already, so it shows before any script runs; without JavaScript a <noscript> rule in the
// root layout hides it. Quick moves (a prefetched page, an admin drawer opening) finish before
// anything appears, so nothing flickers.
//
// There are no route-level loading.tsx screens on purpose: React puts a large page's content
// behind its loading screen in the built HTML (shown first, swapped by a script), so every first
// visit flashed the spinner and visitors without JavaScript saw only the spinner.
export function LoadingBar() {
  const [state, setState] = useState<"loading" | "done" | "idle">("loading");
  const [slow, setSlow] = useState(false); // a move to another page taking a while

  useEffect(() => {
    let show: number | undefined;
    let pill: number | undefined;
    let poll: number | undefined;
    let safety: number | undefined;
    let hide: number | undefined;
    const stopAll = () => {
      window.clearTimeout(show);
      window.clearTimeout(pill);
      window.clearInterval(poll);
      window.clearTimeout(safety);
      window.clearTimeout(hide);
    };
    const finish = () => {
      stopAll();
      setSlow(false);
      setState((s) => (s === "idle" ? "idle" : "done"));
      hide = window.setTimeout(() => setState("idle"), 450);
    };

    // The first load.
    if (document.readyState === "complete") finish();
    else {
      window.addEventListener("load", finish, { once: true });
      safety = window.setTimeout(finish, 15_000);
    }

    // Moves to another page: done once the address changes (or after 15 seconds, whatever happens).
    const here = () => location.pathname + location.search;
    function onNavigate(e: Event) {
      const to = new URL(String((e as CustomEvent<string>).detail), location.href);
      const from = here();
      if (to.pathname + to.search === from) return;
      stopAll();
      show = window.setTimeout(() => setState("loading"), 150);
      pill = window.setTimeout(() => setSlow(true), 600);
      poll = window.setInterval(() => {
        if (here() !== from) finish();
      }, 100);
      safety = window.setTimeout(finish, 15_000);
    }
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => {
      stopAll();
      window.removeEventListener("load", finish);
      window.removeEventListener(NAVIGATE_EVENT, onNavigate);
    };
  }, []);

  return (
    <div aria-hidden data-loading-bar>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] overflow-hidden transition-opacity duration-300 ${state === "idle" ? "opacity-0" : "opacity-100"}`}
      >
        {state === "loading" ? (
          <span className="absolute inset-y-0 left-0 w-1/3 animate-loading-bar rounded-full bg-brand shadow-[0_0_10px_var(--color-brand)] motion-reduce:w-2/3 motion-reduce:animate-none" />
        ) : (
          <span className="absolute inset-0 bg-brand" />
        )}
      </div>
      <div
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 transition duration-200 ${slow ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
      >
        <span className="flex items-center gap-2 rounded-full bg-night px-4 py-2 text-sm font-medium text-white shadow-lg">
          <Spinner className="h-4 w-4 text-brand" /> Loading…
        </span>
      </div>
    </div>
  );
}
