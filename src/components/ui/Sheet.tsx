"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// A bottom sheet, as phone apps use for menus and pickers: it slides up over a dimmed page and
// closes on a tap outside it, the ✕, Escape, a swipe down on its handle or title, or a move
// to another page (so it never stays open over the page the visitor went to). The page behind
// doesn't scroll while it's open. From 640px it sits as a card in the middle of the screen.
// `bottomGap` leaves room for the app's tab bar under it (otherwise it covers the bar). It renders into <body>: inside the
// navbar (whose blur makes it the box that fixed children are placed in) it would open in the header.
export function Sheet({
  open,
  onClose,
  title,
  children,
  bottomGap = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  bottomGap?: boolean;
}) {
  const titleId = useId();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const pathname = usePathname();
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Close when the page changes (a link inside, the tab bar, the browser's back button).
  useEffect(() => {
    closeRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          key="sheet"
          className={`fixed inset-x-0 top-0 flex items-end justify-center bg-ink/45 sm:items-center sm:p-6 ${
            bottomGap ? "bottom-0 z-[60] max-lg:bottom-[calc(4.25rem+env(safe-area-inset-bottom))]" : "bottom-0 z-[62]"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:max-w-lg sm:rounded-[1.5rem] ${
              bottomGap ? "max-lg:max-h-[calc(100svh-6rem-env(safe-area-inset-bottom))]" : ""
            }`}
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ y: "100%", transition: { duration: 0.2 } }}
          >
            {/* The handle and title: swipe down here to close (the list below scrolls freely). */}
            <m.div
              className="shrink-0 touch-none px-4 pt-2.5"
              onPanEnd={(_, info) => {
                if (info.offset.y > 60 || info.velocity.y > 400) onClose();
              }}
            >
              <div className="mx-auto h-1.5 w-11 rounded-full bg-line sm:hidden" aria-hidden />
              <div className="flex items-center justify-between py-2">
                <h2 id={titleId} className="text-xl font-bold">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="press -mr-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-wash text-ink hover:bg-peach"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </m.div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              {children}
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
