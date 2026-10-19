import { blog } from "@/content/blog";
import { brand } from "@/content/site";
import { publishedPosts } from "@/server/blog";

// The blog's RSS feed (/blog/rss.xml), for feed readers and tools that share new posts
// automatically. Cached like the blog pages.
export const revalidate = 3600;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const base = `https://www.${brand.domain}`;
  const posts = (await publishedPosts()).filter((p) => !p.sample);
  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${base}/blog/${p.slug}</link>
      <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
      <pubDate>${new Date(p.publishedAt ?? p.createdAt).toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join("\n")}
    </item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(`${blog.title} — ${brand.fullName}`)}</title>
    <link>${base}/blog</link>
    <description>${esc(blog.description)}</description>
    <language>en-IN</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
