import type { Metadata } from "next";
import { blog } from "@/content/blog";
import { PostCard } from "@/components/blog/PostCard";
import { Container } from "@/components/ui/Container";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { publishedPosts } from "@/server/blog";

export const metadata: Metadata = {
  title: blog.title,
  description: blog.description,
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
  openGraph: { title: `${blog.title} — Artists on Demand`, description: blog.description },
};

// Rebuilt at most once an hour, and straight away when the team publishes or changes a post in
// the admin (saveAdminChanges calls revalidatePath).
export const revalidate = 3600;

// The blog: the newest post large, the rest in a grid, and the newsletter sign-up. Posts are
// written in the admin (Blog); src/server/blog.ts reads the published ones.
export default async function BlogPage() {
  const posts = await publishedPosts();
  const [first, ...rest] = posts;

  return (
    <Container className="py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand">{blog.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-medium leading-tight sm:text-5xl">{blog.heading}</h1>
        <p className="mt-4 text-lg text-body">{blog.intro}</p>
      </header>

      {first ? (
        <>
          <div className="mt-10">
            <PostCard post={first} featured />
          </div>
          {rest.length > 0 && (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="mt-10 rounded-card border border-dashed border-line bg-wash p-8 text-center text-body">{blog.empty}</p>
      )}

      <section className="mt-14 rounded-card border border-line bg-white p-6 sm:p-8 lg:max-w-3xl">
        <NewsletterSignup />
      </section>
    </Container>
  );
}
