import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { blog } from "@/content/blog";
import { brand } from "@/content/site";
import { Markdown } from "@/components/blog/Markdown";
import { PostCard, PostCover, postDate } from "@/components/blog/PostCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { buttonClasses } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { readingMinutes } from "@/lib/markdown";
import { whatsappShareUrl } from "@/lib/whatsapp";
import { postBySlug, publishedPosts } from "@/server/blog";

// Cached like the blog's list: rebuilt at most once an hour, and straight away when the team
// changes a post. Posts published after the last deploy are built on their first visit.
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await publishedPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await postBySlug((await params).slug);
  if (!post) return { title: blog.title };
  return {
    title: post.title,
    description: post.excerpt || blog.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || blog.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      ...(post.cover ? { images: [{ url: post.cover, alt: post.coverAlt }] } : {}),
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = await postBySlug((await params).slug);
  if (!post) notFound();
  const more = (await publishedPosts()).filter((p) => p.id !== post.id).slice(0, 3);
  const url = `https://www.${brand.domain}/blog/${post.slug}`;
  // Search engines read this to show the post as an article (title, date, author, photo).
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": post.author && post.author !== "Team AOD" ? "Person" : "Organization", name: post.author || brand.fullName },
    publisher: { "@type": "Organization", name: brand.fullName },
    mainEntityOfPage: url,
    ...(post.cover ? { image: post.cover.startsWith("/") ? `https://www.${brand.domain}${post.cover}` : post.cover } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }} />
      <Container className="py-10 sm:py-14">
        <article className="mx-auto max-w-3xl">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {blog.allPosts}
          </Link>
          {post.tags.length > 0 && <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-brand">{post.tags.join(" · ")}</p>}
          <h1 className="mt-2 text-4xl font-medium leading-tight sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-4 text-xl text-body">{post.excerpt}</p>}
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            {post.author && <span className="font-medium text-ink">{post.author}</span>}
            {post.author && <span aria-hidden>·</span>}
            <span>{postDate(post.publishedAt)}</span>
            <span aria-hidden>·</span>
            <span>{readingMinutes(post.body)} min read</span>
          </p>
        </article>

        {post.cover && (
          <PostCover post={post} priority sizes="(min-width: 1024px) 64rem, 100vw" className="mx-auto mt-8 aspect-[16/9] max-w-5xl rounded-card" />
        )}

        <div className="mx-auto max-w-3xl">
          <Markdown source={post.body} className="mt-10" />

          <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <a
              href={whatsappShareUrl(`${post.title}\n${url}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:border-ink"
            >
              <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> {blog.share}
            </a>
          </div>

          <section className="mt-10 rounded-card bg-wash p-6 sm:p-8">
            <h2 className="text-2xl font-bold">{blog.bookTitle}</h2>
            <p className="mt-2 text-body">{blog.bookText}</p>
            <Link href="/book" className={buttonClasses("primary", "md", "mt-5")}>
              {blog.bookCta} <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>

          <section className="mt-8 rounded-card border border-line bg-white p-6 sm:p-8">
            <NewsletterSignup />
          </section>
        </div>

        {more.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold">{blog.morePosts}</h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </>
  );
}
