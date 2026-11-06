"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

// Phones and tablets, on a category page: a bar above the tab bar with the category and a Book
// button to the booking questions (#book), like the "Check availability" bar on Headout's pages.
// It shows once the visitor has scrolled past the header and hides while the questions are on
// screen. While it shows, the WhatsApp button moves up above it (`data-book-bar` on <html>).
export function StickyBookBar({ name, label }: { name: string; label: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [atForm, setAtForm] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const form = document.getElementById("book");
    const seen = form ? new IntersectionObserver(([e]) => setAtForm(e.isIntersecting), { threshold: 0.05 }) : null;
    if (form) seen?.observe(form);
    return () => {
      window.removeEventListener("scroll", onScroll);
      seen?.disconnect();
    };
  }, []);

  const shown = scrolled && !atForm;
  useEffect(() => {
    if (shown) document.documentElement.dataset.bookBar = "";
    else delete document.documentElement.dataset.bookBar;
    return () => {
      delete document.documentElement.dataset.bookBar;
    };
  }, [shown]);

  return (
    <div
      aria-hidden={!shown}
      inert={!shown}
      className={`fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur transition-transform duration-300 lg:hidden ${
        shown ? "translate-y-0" : "translate-y-[calc(100%+4.25rem)]"
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">Verified · clear quotes</p>
          <p className="truncate font-bold text-ink">{name}</p>
        </div>
        <a href="#book" className={buttonClasses("primary", "md", "shrink-0")}>
          {label} <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </div>
  );
}
