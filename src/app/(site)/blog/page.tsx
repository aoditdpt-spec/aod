import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { BlogList } from "@/components/blog/BlogList";
import { backendEnabled } from "@/lib/backend";
import { blogPostFrom } from "@/lib/blog-view";
import { publishedPosts } from "@/server/blog";

export const metadata: Metadata = { title: "Blog", description: "Ideas for weddings, events and shoots in Gujarat, from the AOD team.", alternates: { canonical: "/blog" } };

// Live: the published posts, read on the server and cached for an hour (saving a post in the admin
// refreshes it straight away). Preview: the admin's sample posts, kept in this browser.
export const revalidate = 3600;

export default async function BlogPage() {
  const posts = backendEnabled ? (await publishedPosts()).map(blogPostFrom) : null;
  return (
    <main className="flex-1">
      <PageHeader label="AOD Blog" title="Stories And Ideas." />
      <Container className="pb-24 lg:pb-32">
        <BlogList posts={posts} />
      </Container>
    </main>
  );
}
