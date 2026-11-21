"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { dismissNotice, noticeStore, type Notice } from "@/lib/notice";

// The site's own alert (showNotice in src/lib/notice.ts): a black card at the bottom of the screen
// with the message and a close button, gone by itself after a few seconds. Used everywhere the
// browser's alert box was (the admin, the artist portal, My Bookings).
export function Notices() {
  const list = useSyncExternalStore(noticeStore.subscribe, noticeStore.get, noticeStore.server);
  return (
    <div aria-live="assertive" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottom-bar,0px)+1rem)] z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <AnimatePresence initial={false}>
        {list.map((n) => (
          <Card key={n.id} n={n} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Card({ n }: { n: Notice }) {
  useEffect(() => {
    const t = window.setTimeout(() => dismissNotice(n.id), 7000);
    return () => window.clearTimeout(t);
  }, [n.id]);
  return (
    <motion.div
      role="alert"
      layout
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ y: 8, opacity: 0, transition: { duration: 0.15 } }}
      className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-paper shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)]"
    >
      <i aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
      <p className="min-w-0 flex-1 leading-relaxed">{n.text}</p>
      <button type="button" onClick={() => dismissNotice(n.id)} aria-label="Close" className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-paper/70 transition-colors hover:text-paper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="h-4 w-4">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </motion.div>
  );
}
