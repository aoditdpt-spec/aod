import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Dots } from "@/components/ui/Dots";

// The top of every inner page: a small label, one big heading (with the logo's orange dots) and,
// at most, one short line. Anything else (a button) goes in `children`.
export function PageHeader({ label, title, sub, children }: { label?: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <Container className="pb-10 pt-8 sm:pt-10 lg:pb-12 lg:pt-14">
      {label && <p className="text-sm text-muted">{label}</p>}
      <h1 className={`max-w-4xl text-5xl sm:text-6xl lg:text-7xl ${label ? "mt-4" : ""}`}>
        <Dots>{title}</Dots>
      </h1>
      {sub && <p className="mt-6 max-w-xl text-lg text-muted">{sub}</p>}
      {children && <div className="mt-9 flex flex-wrap gap-3 max-sm:*:flex-1">{children}</div>}
    </Container>
  );
}

// Two to four short points in a row, each under a thin line.
const pointCols: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" };
export function Points({ items, className = "pb-24 lg:pb-32" }: { items: { title: string; text: string }[]; className?: string }) {
  return (
    <Container className={className}>
      <ul className={`grid gap-x-8 gap-y-10 border-t border-ink pt-10 ${pointCols[items.length] ?? "md:grid-cols-3"}`}>
        {items.map((p) => (
          <li key={p.title}>
            <h2 className="text-2xl">{p.title}</h2>
            <p className="mt-2 text-muted">{p.text}</p>
          </li>
        ))}
      </ul>
    </Container>
  );
}
