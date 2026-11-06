import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { samplePosts } from "@/content/blog";
import type { Post } from "@/lib/admin-store";
import { backendEnabled } from "@/lib/backend";
import { fromRow } from "@/server/rows";

// The blog's published posts, for the public pages (src/app/(site)/blog), the sitemap and the feed.
// Live: read with the publishable key and nobody signed in, so row-level security only ever returns
// published posts, and the pages stay cached (no cookies are read). Preview (no keys): the sample
// posts in src/content/blog.ts, marked `sample`. If the database can't be reached the blog shows
// as empty rather than failing.

export type PublicPost = Post & { sample?: boolean };

const isLive = (p: Post) => p.status === "published" && Boolean(p.publishedAt) && p.publishedAt! <= new Date().toISOString();

function publicClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function publishedPosts(): Promise<PublicPost[]> {
  if (!backendEnabled) return samplePosts.filter(isLive).map((p) => ({ ...p, sample: true }));
  try {
    const { data, error } = await publicClient()
      .from("posts")
      .select("*")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map(fromRow.post);
  } catch (e) {
    console.error("[blog] couldn't load posts", e);
    return [];
  }
}

export async function postBySlug(slug: string): Promise<PublicPost | null> {
  if (!/^[a-z0-9-]{1,100}$/.test(slug)) return null;
  if (!backendEnabled) {
    const p = samplePosts.find((x) => x.slug === slug && isLive(x));
    return p ? { ...p, sample: true } : null;
  }
  try {
    const { data, error } = await publicClient().from("posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    if (error) throw new Error(error.message);
    const post = data ? fromRow.post(data) : null;
    return post && isLive(post) ? post : null;
  } catch (e) {
    console.error("[blog] couldn't load a post", e);
    return null;
  }
}
