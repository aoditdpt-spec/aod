import { dotParts } from "@/lib/dots";

// Text with the logo's orange full stops (see src/lib/dots.ts and .dot-stop in globals.css). For
// big headings only.
export function Dots({ children }: { children: string }) {
  return (
    <>
      {dotParts(children).map((p, i) =>
        p.kind === "text" ? (
          p.text
        ) : (
          <span key={i} className="dot-stop">
            {p.text}
          </span>
        ),
      )}
    </>
  );
}
