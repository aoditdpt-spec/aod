"use client";

import Link from "@/components/ui/AppLink";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { brand, nav, navLinks, whatsappUrl } from "@/data/site";
import { useMounted } from "@/lib/use-mounted";

const ease = [0.22, 1, 0.36, 1] as const;
const stagger: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const links = navLinks;

// Phones and tablets: the full-screen menu between the top bar and the bottom bar (which keeps
// My Bookings and Get Your Artist on show), big text links and nothing else to work out. It's put straight into <body> (the bar's blur would otherwise trap it), locks the
// page's scroll while open, and closes on any link, Escape or a page change.
export function MobileMenu({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          key="menu"
          role="dialog"
          aria-modal="true"
          aria-label={nav.menu}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="fixed inset-x-0 bottom-[var(--bottom-bar)] top-0 z-40 overflow-y-auto bg-paper pt-14 lg:hidden"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="shown"
            className="flex min-h-full flex-col px-4 pb-6 pt-2 sm:px-6"
          >
            <nav aria-label={nav.menu}>
              {links.map((l) => (
                <motion.div key={l.href} variants={rise}>
                  <Link
                    href={l.href}
                    onClick={onClose}
                    className="block border-b border-line py-5 text-3xl font-medium tracking-tight text-ink transition-colors active:text-muted"
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div variants={rise} className="mt-auto pt-10">
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center rounded-lg border border-line text-[15px] font-medium text-ink"
                >
                  {nav.whatsapp}
                </a>
                <a href={brand.phoneHref} className="flex h-12 items-center justify-center rounded-lg border border-line text-[15px] font-medium text-ink">
                  {nav.call}
                </a>
              </div>
              <p className="mt-6 text-sm text-muted">
                {brand.fullName} · {brand.city}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
