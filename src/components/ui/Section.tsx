import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

// A section of an inner page: a heading over a thin line, then its content.
export function Section({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Container className={`pb-20 lg:pb-28 ${className}`}>
      <div className="border-t border-line pt-10">
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </Container>
  );
}

// Numbered steps (01, 02…), each a title and a line, in a row from tablets up.
export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className={`grid gap-x-8 gap-y-8 sm:grid-cols-2 ${items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {items.map((s, i) => (
        <li key={s.title}>
          <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-2 text-xl">{s.title}</h3>
          <p className="mt-2 text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
