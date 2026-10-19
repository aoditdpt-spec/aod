"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

// A link to a section of a page ("/#resolution-centre"). Next.js ignores a click on a link to the
// address the browser is already on, so once the address ends in #resolution-centre, clicking the
// link again (after scrolling away) did nothing. On the same page this scrolls to the section
// every time; from another page it is an ordinary link. Other links pass straight through.
export function SectionLink({ href, onClick, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    const [path, id] = href.split("#");
    if (e.defaultPrevented || !id || (path || "/") !== pathname || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    history.replaceState(history.state, "", `#${id}`);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
