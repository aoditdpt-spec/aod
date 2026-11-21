"use client";

import Link from "@/components/ui/AppLink";
import { useParams } from "next/navigation";
import { shortDate } from "@/lib/app-db";
import { Markdown } from "@/components/ui/Markdown";
import { Dots } from "@/components/ui/Dots";
import { usePublished } from "./BlogList";
import type { BlogPost as Stored } from "@/lib/blog-view";

// One post: its title, date and author, the cover, the text, and more posts under it.
export function BlogPost({ posts: live }: { posts?: Stored[] | null }) {
  const { slug } = useParams<{ slug: string }>();
  const posts = usePublished(live);
  if (!posts) return <p className="text-muted">Loading…</p>;
  const post = posts.find((p) => p.slug === slug);
  if (!post)
    return (
      <p className="text-lg text-muted">
        This post isn&apos;t published.{" "}
        <Link href="/blog" className="text-ink underline underline-offset-4">
          See all posts
        </Link>
      </p>
    );
  const more = posts.filter((p) => p.id !== post.id).slice(0, 3);
  return (
    <article>
      <p className="text-sm text-muted">
        {shortDate(post.date)} · {post.author} · {post.tags}
      </p>
      <h1 className="mt-4 max-w-4xl text-5xl sm:text-6xl">
        <Dots>{post.title.endsWith(".") || post.title.endsWith("?") ? post.title : `${post.title}.`}</Dots>
      </h1>
      {post.cover && (
        // eslint-disable-next-line @next/next/no-img-element -- covers can be data URLs in test mode
        <img src={post.cover} alt="" className="mt-10 aspect-[16/9] w-full rounded-xl object-cover" />
      )}
      <Markdown text={post.body} className="mt-10 max-w-2xl text-lg leading-relaxed text-ink/85" />
      {more.length > 0 && (
        <section className="mt-20 border-t border-line pt-10">
          <h2 className="text-3xl">More From The Blog</h2>
          <ul className="mt-8 grid gap-8 sm:grid-cols-3">
            {more.map((p) => (
              <li key={p.id}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <p className="text-sm text-muted">{shortDate(p.date)}</p>
                  <h3 className="mt-2 text-xl transition-colors group-hover:text-muted">{p.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
