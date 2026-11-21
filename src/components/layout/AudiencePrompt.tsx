"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { audiencePrompt as p } from "@/data/pages";
import { dismissAudiencePrompt, setAudience, useAudience, useAudiencePromptDismissed } from "@/lib/audience";

const ease = [0.22, 1, 0.36, 1] as const;

// The first visit's question: "What Are You Booking For?", Personal Events or Business Events.
// It shows once per browser; the answer is kept (src/lib/audience.ts) until the visitor clears
// their browsing data, or presses "Change" on the booking page. The ✕ at the top right (or Escape)
// closes it without an answer for the rest of this visit (dismissAudiencePrompt); the booking form
// then books as personal events. The page behind can't scroll while it's open.
// A sheet from the bottom on phones, a card in the middle from 640px.
export function AudiencePrompt() {
  const audience = useAudience();
  const router = useRouter();
  // Not on the artists' pages (For Artists, apply, sign-in): they've come to join, not to book.
  const forArtists = usePathname().startsWith("/for-artists");
  const dismissed = useAudiencePromptDismissed();
  const open = audience === null && !forArtists && !dismissed;
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus goes to the card itself, not the first button: a focused button gets the black focus
    // ring, which looked like Personal Events was already picked. Tab still reaches both buttons.
    const t = window.setTimeout(() => box.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismissAudiencePrompt();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (audience === "unknown") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="audience"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-6"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="audience-title"
            ref={box}
            tabIndex={-1}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { duration: 0.45, ease } }}
            exit={{ y: 24, opacity: 0, transition: { duration: 0.2 } }}
            className="relative w-full rounded-t-2xl bg-paper px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 sm:max-w-xl sm:rounded-2xl sm:p-10 outline-none"
          >
            <button
              type="button"
              onClick={dismissAudiencePrompt}
              aria-label={p.close}
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-wash hover:text-ink sm:right-4 sm:top-4"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <h2 id="audience-title" className="pr-10 text-3xl sm:text-4xl">
              {p.title}
            </h2>
            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2">
              {p.choices.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setAudience(c.value)}
                  className="flex min-h-24 flex-col justify-between rounded-xl border border-line p-5 text-left transition-[border-color,transform] hover:border-ink active:scale-[0.98] sm:min-h-36"
                >
                  <span className="text-xl font-medium leading-tight text-ink sm:text-2xl">{c.title}</span>
                  <span className="mt-3 text-sm text-muted">{c.text}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setAudience("artist");
                router.push("/for-artists");
              }}
              className="mt-5 w-full text-center text-sm font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink sm:mt-6"
            >
              {p.artistSkip}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
