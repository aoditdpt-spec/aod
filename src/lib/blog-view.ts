import type { Post as StoredPost } from "@/lib/admin-store";

// A blog post as the new blog pages show it (src/components/blog), from a post in the database
// (src/server/blog.ts). Shared by the server pages; no "use client".
export type BlogPost = { id: string; title: string; status: "Published" | "Draft" | "Scheduled"; date: string; author: string; slug: string; summary: string; body: string; tags: string; cover?: string };

export const blogPostFrom = (p: StoredPost): BlogPost => ({
  id: p.id,
  title: p.title,
  status: "Published",
  date: (p.publishedAt ?? p.createdAt).slice(0, 10),
  author: p.author,
  slug: p.slug,
  summary: p.excerpt,
  body: p.body,
  tags: p.tags.join(", "),
  cover: p.cover || undefined,
});
