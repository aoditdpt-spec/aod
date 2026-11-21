import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { BlogPost } from "@/components/blog/BlogPost";
import { backendEnabled } from "@/lib/backend";
import { blogPostFrom } from "@/lib/blog-view";
import { postBySlug, publishedPosts } from "@/server/blog";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = backendEnabled ? await postBySlug(slug) : null;
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.publishedAt, images: post.cover ? [post.cover] : undefined },
  };
}

// A post. Live: read on the server (and cached); preview: the posts live in this browser, so the
// page reads its address there.
export default async function BlogPostPage() {
  const posts = backendEnabled ? (await publishedPosts()).map(blogPostFrom) : null;
  return (
    <main className="flex-1">
      <Container className="pb-24 pt-8 sm:pt-10 lg:pb-32 lg:pt-14">
        <Suspense fallback={<p className="text-muted">Loading…</p>}>
          <BlogPost posts={posts} />
        </Suspense>
      </Container>
    </main>
  );
}
