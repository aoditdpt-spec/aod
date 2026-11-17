import Link from "next/link";
import type { ReactNode } from "react";
import { parse, type Block, type Inline } from "@/lib/markdown";

// A blog post's or newsletter's Markdown (src/lib/markdown.ts) as page content. The reader only
// produces known elements, so nothing a writer types can run as code. Links to the site's own
// pages stay inside the app; other links open in a new tab.

function inlines(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "br":
        return <br key={i} />;
      case "strong":
        return (
          <strong key={i} className="font-semibold text-ink">
            {inlines(n.c)}
          </strong>
        );
      case "em":
        return <em key={i}>{inlines(n.c)}</em>;
      case "link":
        return n.href.startsWith("/") || n.href.startsWith("#") ? (
          <Link key={i} href={n.href} className="font-medium text-brand underline underline-offset-2 hover:text-brand-hover">
            {inlines(n.c)}
          </Link>
        ) : (
          <a key={i} href={n.href} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline underline-offset-2 hover:text-brand-hover">
            {inlines(n.c)}
          </a>
        );
    }
  });
}

function block(b: Block, i: number): ReactNode {
  switch (b.t) {
    case "h2":
      return (
        <h2 key={i} className="mt-10 text-2xl font-bold sm:text-[1.75rem]">
          {inlines(b.c)}
        </h2>
      );
    case "h3":
      return (
        <h3 key={i} className="mt-8 text-xl font-bold">
          {inlines(b.c)}
        </h3>
      );
    case "p":
      return (
        <p key={i} className="mt-5">
          {inlines(b.c)}
        </p>
      );
    case "quote":
      return (
        <blockquote key={i} className="mt-6 rounded-r-xl border-l-4 border-brand bg-wash px-5 py-4 text-ink">
          {inlines(b.c)}
        </blockquote>
      );
    case "ul":
      return (
        <ul key={i} className="mt-5 list-disc space-y-2 pl-6 marker:text-brand">
          {b.items.map((item, j) => (
            <li key={j}>{inlines(item)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="mt-5 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-brand">
          {b.items.map((item, j) => (
            <li key={j}>{inlines(item)}</li>
          ))}
        </ol>
      );
    case "img":
      return (
        <figure key={i} className="mt-8">
          {/* Photos come from the blog's storage bucket at their own size; a plain img keeps them sharp. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt={b.alt} loading="lazy" className="w-full rounded-card border border-line" />
          {b.alt && <figcaption className="mt-2 text-center text-sm text-muted">{b.alt}</figcaption>}
        </figure>
      );
    case "hr":
      return <hr key={i} className="my-10 border-line" />;
  }
}

export function Markdown({ source, className = "" }: { source: string; className?: string }) {
  return <div className={`text-[1.0625rem] leading-relaxed text-body [&>*:first-child]:mt-0 ${className}`}>{parse(source).map(block)}</div>;
}
