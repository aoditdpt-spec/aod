import type { ReactNode } from "react";

// Simple Markdown for blog posts and newsletters, as on aod.co.in: headings (## and ###),
// paragraphs, lists (- or 1.), **bold**, *italic* and [links](https://…). It builds React elements
// and never passes HTML through; links go only to http(s), mailto, tel or the site's own pages.

const safeHref = (h: string) => (/^(https?:\/\/|mailto:|tel:|\/)/i.test(h) ? h : "");

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("*")) out.push(<em key={k}>{t.slice(1, -1)}</em>);
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t) ?? [];
      const safe = safeHref(href ?? "");
      out.push(
        safe ? (
          <a key={k} href={safe} className="underline underline-offset-4" {...(/^https?:/.test(safe) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            {label}
          </a>
        ) : (
          label
        ),
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text, className = "" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "), `p${blocks.length}`)}</p>);
    para = [];
    if (list) {
      const items = list.items.map((it, i) => <li key={i}>{inline(it, `l${blocks.length}-${i}`)}</li>);
      blocks.push(list.ordered ? <ol key={blocks.length} className="list-decimal pl-6">{items}</ol> : <ul key={blocks.length} className="list-disc pl-6">{items}</ul>);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{2,3})\s+(.*)$/.exec(line);
    const li = /^\s*(?:([-*])|(\d+)\.)\s+(.*)$/.exec(line);
    if (!line.trim()) flush();
    else if (h) {
      flush();
      blocks.push(h[1].length === 2 ? <h2 key={blocks.length} className="mt-8 text-3xl">{h[2]}</h2> : <h3 key={blocks.length} className="mt-6 text-2xl">{h[2]}</h3>);
    } else if (li) {
      if (para.length) flush();
      const ordered = !!li[2];
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push(li[3]);
    } else {
      if (list) flush();
      para.push(line.trim());
    }
  }
  flush();
  return <div className={`space-y-4 ${className}`}>{blocks}</div>;
}
