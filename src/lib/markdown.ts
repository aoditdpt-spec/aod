// A small Markdown reader for blog posts and newsletters, written in the admin. It understands
// what a non-developer needs and nothing more:
//   # or ## Heading, ### Smaller heading      **bold**, *italic* or _italic_
//   - item or * item (a list), 1. item          [link text](https://…)
//   > a quote                                    ![photo description](https://…) on its own line
//   --- (a line across)                          a single line break stays a line break
// It parses into blocks (no HTML is ever passed through), which src/components/blog/Markdown.tsx
// shows on the site and `toHtml` / `toText` turn into an email. Links only go to http(s), mailto:,
// tel: or the site's own paths; photos only come from https or the site. No imports, so
// scripts/markdown-check.mts can test it on its own.

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; c: Inline[] }
  | { t: "em"; c: Inline[] }
  | { t: "link"; href: string; c: Inline[] }
  | { t: "br" };

export type Block =
  | { t: "h2" | "h3"; c: Inline[] }
  | { t: "p"; c: Inline[] }
  | { t: "quote"; c: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] }
  | { t: "img"; src: string; alt: string }
  | { t: "hr" };

// Where a link may go, or null (then only its text shows).
export function safeHref(href: string): string | null {
  const h = href.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(h)) return h;
  if (/^\/(?!\/)/.test(h)) return h; // the site's own pages, never //other-site
  if (/^#[\w-]+$/.test(h)) return h;
  return null;
}

// Where a photo may come from, or null.
export function safeImage(src: string): string | null {
  const s = src.trim();
  if (/^https:\/\/[^\s"'<>]+$/i.test(s)) return s;
  if (/^\/(?!\/)[^\s"'<>]*$/.test(s)) return s;
  return null;
}

// ---- Inline: bold, italic, links, line breaks ----

const patterns: { re: RegExp; make: (m: RegExpExecArray) => Inline }[] = [
  {
    re: /\[([^\]]+)\]\(([^)\s]+)\)/,
    make: (m) => {
      const href = safeHref(m[2]);
      return href ? { t: "link", href, c: inline(m[1]) } : { t: "text", v: m[1] };
    },
  },
  { re: /\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/, make: (m) => ({ t: "strong", c: inline(m[1]) }) },
  { re: /(?<![\w*])\*(?!\s)([^*\n]+?)\*(?![\w*])/, make: (m) => ({ t: "em", c: inline(m[1]) }) },
  { re: /(?<![\w])_(?!\s)([^_\n]+?)_(?![\w])/, make: (m) => ({ t: "em", c: inline(m[1]) }) },
];

export function inline(text: string): Inline[] {
  const out: Inline[] = [];
  let rest = text;
  while (rest) {
    // The earliest match of any pattern wins.
    let best: { index: number; length: number; node: Inline } | null = null;
    for (const p of patterns) {
      const m = p.re.exec(rest);
      if (m && (!best || m.index < best.index)) best = { index: m.index, length: m[0].length, node: p.make(m) };
    }
    if (!best) {
      pushText(out, rest);
      break;
    }
    if (best.index > 0) pushText(out, rest.slice(0, best.index));
    out.push(best.node);
    rest = rest.slice(best.index + best.length);
  }
  return out;
}

// Text, with each line break kept as a break.
function pushText(out: Inline[], text: string) {
  text.split("\n").forEach((part, i) => {
    if (i > 0) out.push({ t: "br" });
    if (part) out.push({ t: "text", v: part });
  });
}

// ---- Blocks ----

export function parse(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const endPara = () => {
    if (para.length) blocks.push({ t: "p", c: inline(para.join("\n").trim()) });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      endPara();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+?)\s*#*$/.exec(trimmed);
    if (heading) {
      endPara();
      blocks.push({ t: heading[1].length === 3 ? "h3" : "h2", c: inline(heading[2]) });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      endPara();
      blocks.push({ t: "hr" });
      continue;
    }
    const image = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed);
    if (image) {
      endPara();
      const src = safeImage(image[2]);
      if (src) blocks.push({ t: "img", src, alt: image[1].trim() });
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      endPara();
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) quote.push(lines[i++].trim().replace(/^>\s?/, ""));
      i--;
      blocks.push({ t: "quote", c: inline(quote.join("\n").trim()) });
      continue;
    }
    const bullet = /^[-*+]\s+/;
    const numbered = /^\d+[.)]\s+/;
    if (bullet.test(trimmed) || numbered.test(trimmed)) {
      endPara();
      const kind = bullet.test(trimmed) ? bullet : numbered;
      const items: Inline[][] = [];
      while (i < lines.length && kind.test(lines[i].trim())) items.push(inline(lines[i++].trim().replace(kind, "")));
      i--;
      blocks.push({ t: kind === bullet ? "ul" : "ol", items });
      continue;
    }
    para.push(line);
  }
  endPara();
  return blocks;
}

// ---- Email: HTML (with inline styles, which email apps keep) and plain text ----

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type HtmlStyles = Partial<Record<"h2" | "h3" | "p" | "quote" | "ul" | "ol" | "li" | "img" | "hr" | "a", string>>;

function inlineHtml(nodes: Inline[], styles: HtmlStyles): string {
  return nodes
    .map((n) => {
      if (n.t === "text") return escapeHtml(n.v);
      if (n.t === "br") return "<br>";
      if (n.t === "strong") return `<strong>${inlineHtml(n.c, styles)}</strong>`;
      if (n.t === "em") return `<em>${inlineHtml(n.c, styles)}</em>`;
      return `<a href="${escapeHtml(n.href)}"${attr(styles.a)}>${inlineHtml(n.c, styles)}</a>`;
    })
    .join("");
}

const attr = (style?: string) => (style ? ` style="${escapeHtml(style)}"` : "");

export function toHtml(blocks: Block[], styles: HtmlStyles = {}): string {
  return blocks
    .map((b) => {
      switch (b.t) {
        case "h2":
        case "h3":
          return `<${b.t}${attr(styles[b.t])}>${inlineHtml(b.c, styles)}</${b.t}>`;
        case "p":
          return `<p${attr(styles.p)}>${inlineHtml(b.c, styles)}</p>`;
        case "quote":
          return `<blockquote${attr(styles.quote)}>${inlineHtml(b.c, styles)}</blockquote>`;
        case "ul":
        case "ol":
          return `<${b.t}${attr(styles[b.t])}>${b.items.map((it) => `<li${attr(styles.li)}>${inlineHtml(it, styles)}</li>`).join("")}</${b.t}>`;
        case "img":
          return `<img src="${escapeHtml(b.src)}" alt="${escapeHtml(b.alt)}"${attr(styles.img)}>`;
        case "hr":
          return `<hr${attr(styles.hr)}>`;
      }
    })
    .join("\n");
}

function inlineText(nodes: Inline[]): string {
  return nodes
    .map((n) => {
      if (n.t === "text") return n.v;
      if (n.t === "br") return "\n";
      if (n.t === "link") {
        const label = inlineText(n.c);
        return label === n.href ? n.href : `${label} (${n.href})`;
      }
      return inlineText(n.c);
    })
    .join("");
}

export function toText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.t) {
        case "h2":
          return inlineText(b.c).toUpperCase();
        case "h3":
        case "p":
          return inlineText(b.c);
        case "quote":
          return inlineText(b.c)
            .split("\n")
            .map((l) => `> ${l}`)
            .join("\n");
        case "ul":
          return b.items.map((it) => `- ${inlineText(it)}`).join("\n");
        case "ol":
          return b.items.map((it, i) => `${i + 1}. ${inlineText(it)}`).join("\n");
        case "img":
          return b.alt ? `[Photo: ${b.alt}]` : "";
        case "hr":
          return "———";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

// ---- Helpers for posts ----

// "How to pick a wedding photographer!" → "how-to-pick-a-wedding-photographer"
export const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");

export const isSlug = (s: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

// About 200 words a minute, at least 1.
export const readingMinutes = (markdown: string) => Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 200));
