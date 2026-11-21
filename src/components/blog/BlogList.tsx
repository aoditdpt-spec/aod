"use client";

import Link from "@/components/ui/AppLink";
import { dayKey, shortDate, useDb, type Post } from "@/lib/app-db";
import type { BlogPost } from "@/lib/blog-view";

// The blog, as on aod.co.in: the newest post large, the rest in a grid. Only published posts whose
// date has come. Live: `posts` comes from the server. Test mode: the posts are the admin's (kept
// in this browser), labelled samples.
export function usePublished(live?: BlogPost[] | null) {
  const db = useDb();
  if (live) return live as Post[];
  if (!db) return null;
  const today = dayKey(new Date());
  return db.posts.filter((p) => (p.status === "Published" || p.status === "Scheduled") && p.date <= today).sort((a, b) => b.date.localeCompare(a.date));
}

function Cover({ post, big = false }: { post: Post; big?: boolean }) {
  return post.cover ? (
    // eslint-disable-next-line @next/next/no-img-element -- covers can be data URLs in test mode
    <img src={post.cover} alt="" className={`w-full rounded-xl object-cover ${big ? "aspect-[16/9]" : "aspect-[4/3]"}`} />
  ) : (
    <div className={`w-full rounded-xl bg-wash ${big ? "aspect-[16/9]" : "aspect-[4/3]"}`} />
  );
}

export function BlogList({ posts: live }: { posts?: BlogPost[] | null }) {
  const posts = usePublished(live);
  if (!posts) return <p className="text-muted">Loading…</p>;
  if (!posts.length) return <p className="text-lg text-muted">No posts yet.</p>;
  const [first, ...rest] = posts;
  return (
    <>
      <Link href={`/blog/${first.slug}`} className="group grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <Cover post={first} big />
        <div>
          <p className="text-sm text-muted">
            {shortDate(first.date)} · {first.tags}
          </p>
          <h2 className="mt-3 text-4xl transition-colors group-hover:text-muted sm:text-5xl">{first.title}</h2>
          <p className="mt-4 text-lg text-ink/80">{first.summary}</p>
        </div>
      </Link>
      {rest.length > 0 && (
        <ul className="mt-16 grid gap-10 border-t border-line pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <li key={p.id}>
              <Link href={`/blog/${p.slug}`} className="group block">
                <Cover post={p} />
                <p className="mt-4 text-sm text-muted">{shortDate(p.date)}</p>
                <h3 className="mt-2 text-2xl transition-colors group-hover:text-muted">{p.title}</h3>
                <p className="mt-2 text-muted">{p.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
