// The logo's orange dot, carried into big headings: every full stop turns AOD orange (only full
// stops; the dots over i and j stay the text's colour, on request 2026-11-18). Splits text into
// plain runs and full stops; Dots.tsx renders it for React and `dotsHtml()` writes the same as
// HTML (for text set straight on the page, such as the hero's scrambling word). No imports.

export type DotPart = { kind: "text" | "stop"; text: string };

export function dotParts(text: string): DotPart[] {
  const parts: DotPart[] = [];
  for (const piece of text.split(/(\.)/)) {
    if (!piece) continue;
    parts.push({ kind: piece === "." ? "stop" : "text", text: piece });
  }
  return parts;
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function dotsHtml(text: string): string {
  return dotParts(text)
    .map((p) => (p.kind === "stop" ? `<span class="dot-stop">.</span>` : escape(p.text)))
    .join("");
}
