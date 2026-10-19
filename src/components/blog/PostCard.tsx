import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blog } from "@/content/blog";
import { linkCard, linkText, linkTitle } from "@/components/ui/cards";
import { readingMinutes } from "@/lib/markdown";
import type { PublicPost } from "@/server/blog";

export const postDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "");

// Photos Next.js may resize: the site's own files and the blog's storage bucket (next.config.ts).
const bucket = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/blog/`;
const optimizable = (src: string) => /^\/(?!\/)/.test(src) || (bucket.startsWith("https://") && src.startsWith(bucket));

// A post's cover photo (from the blog's storage bucket, resized by Next.js), or a plain orange
// tile with the AOD monogram when the post has none.
export function PostCover({ post, sizes, priority = false, className = "" }: { post: PublicPost; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-wash ${className}`}>
      {post.cover && optimizable(post.cover) ? (
        <Image src={post.cover} alt={post.coverAlt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : post.cover ? (
        // Any other address: shown as it is (Next.js only resizes photos from known places).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover} alt={post.coverAlt} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div aria-hidden className="flex h-full w-full items-center justify-center bg-peach font-display text-5xl font-bold text-brand">
          A.
        </div>
      )}
      {post.sample && <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-muted">Sample</span>}
    </div>
  );
}

// One post on the blog's list: cover, tags, title, summary, date and reading time. Opens the post.
export function PostCard({ post, featured = false }: { post: PublicPost; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`${linkCard} flex h-full overflow-hidden rounded-card bg-white ${featured ? "flex-col lg:grid lg:grid-cols-[1.2fr_1fr]" : "flex-col"}`}
    >
      <PostCover
        post={post}
        priority={featured}
        sizes={featured ? "(min-width: 1024px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
        className={featured ? "aspect-[16/9] lg:aspect-auto lg:min-h-[22rem]" : "aspect-[16/9]"}
      />
      <div className={`flex flex-1 flex-col ${featured ? "p-6 sm:p-8 lg:justify-center" : "p-5"}`}>
        {post.tags.length > 0 && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{post.tags.join(" · ")}</p>}
        <h2 className={`mt-2 font-bold text-ink ${featured ? "text-2xl sm:text-3xl" : "text-xl"} ${linkTitle}`}>{post.title}</h2>
        {post.excerpt && <p className={`mt-2 text-body ${featured ? "text-lg" : "text-sm"} ${linkText}`}>{post.excerpt}</p>}
        <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-sm text-muted">
          <span>{postDate(post.publishedAt)}</span>
          <span aria-hidden>·</span>
          <span>{readingMinutes(post.body)} min read</span>
          {featured && (
            <span className="ml-auto inline-flex items-center gap-1 font-medium text-brand">
              {blog.readMore} <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
