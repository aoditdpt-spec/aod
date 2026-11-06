"use client";

import { useRef, useState } from "react";
import { ExternalLink, ImagePlus, Plus, Trash2 } from "lucide-react";
import { newId, update, useDb, type Post } from "@/lib/admin-store";
import { isSlug, readingMinutes, slugify } from "@/lib/markdown";
import { siteHref } from "@/lib/site-url";
import { Spinner } from "@/components/ui/Spinner";
import { DataTable, type Column } from "../DataTable";
import { MarkdownEditor, uploadBlogPhoto } from "../MarkdownEditor";
import { ActionButton, ago, Drawer, DrawerSection, fieldClass, fmtDate, Labelled, PageHeader, Stat, StatusBadge, toLocalInput, useCan } from "../ui";
import { useOpen } from "../useOpen";

// The blog (aod.co.in/blog): write, preview, publish and unpublish posts, with a cover photo and
// photos in the text (uploaded to the `blog` storage bucket). A published post shows on the site
// straight away (saveAdminChanges refreshes the blog's cached pages); one with a future date
// shows from that time.

const live = (p: Post) => p.status === "published" && Boolean(p.publishedAt) && p.publishedAt! <= new Date().toISOString();
const stage = (p: Post) =>
  p.status === "draft" ? { label: "Draft", tone: "neutral" as const } : live(p) ? { label: "Published", tone: "good" as const } : { label: "Scheduled", tone: "wait" as const };

const columns: Column<Post>[] = [
  { key: "title", label: "Title", render: (p) => <span className="line-clamp-1 font-medium">{p.title}</span>, value: (p) => p.title },
  { key: "status", label: "Status", render: (p) => <StatusBadge tone={stage(p).tone}>{stage(p).label}</StatusBadge>, value: (p) => stage(p).label },
  { key: "published", label: "Published", render: (p) => (p.publishedAt ? fmtDate(p.publishedAt) : "—"), value: (p) => p.publishedAt ?? "", hideOnMobile: true },
  { key: "updated", label: "Last changed", render: (p) => ago(p.updatedAt), value: (p) => p.updatedAt, hideOnMobile: true },
  { key: "tags", label: "Tags", render: (p) => p.tags.join(", ") || "—", value: (p) => p.tags.join(", "), hideOnMobile: true },
];

export function Blog() {
  const db = useDb();
  const [openId, setOpen] = useOpen();
  const allowed = useCan()("blog.edit");
  if (!db) return null;
  const current = db.posts.find((p) => p.id === openId) ?? null;

  function newPost() {
    const id = newId("P");
    const now = new Date().toISOString();
    update(
      "Blog",
      "Started a new post",
      (d) => {
        d.posts.unshift({ id, slug: `draft-${id.toLowerCase()}`, title: "Untitled post", excerpt: "", body: "", cover: "", coverAlt: "", tags: [], author: "Team AOD", status: "draft", createdAt: now, updatedAt: now });
      },
      id,
    );
    setOpen(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        text={
          <>
            Posts on{" "}
            <a href={siteHref("/blog")} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
              aod.co.in/blog
            </a>
            . Write in simple formatting, preview it, then publish: it shows on the site straight away, and in search results and link previews.
          </>
        }
        actions={
          <ActionButton permission="blog.edit" onClick={newPost}>
            <Plus className="h-4 w-4" aria-hidden /> New post
          </ActionButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Published" value={db.posts.filter(live).length} />
        <Stat label="Scheduled" value={db.posts.filter((p) => p.status === "published" && !live(p)).length} />
        <Stat label="Drafts" value={db.posts.filter((p) => p.status === "draft").length} />
      </div>
      <DataTable
        rows={db.posts}
        columns={columns}
        getId={(p) => p.id}
        onOpen={(p) => setOpen(p.id)}
        exportName="blog-posts"
        empty={allowed ? "No posts yet. Press New post to write the first one." : "No posts yet."}
        initialSort={{ key: "updated", dir: "desc" }}
        filters={[{ label: "Status", options: ["Draft", "Published", "Scheduled"].map((s) => ({ value: s, label: s })), test: (p, v) => stage(p).label === v }]}
      />
      {current && <PostEditor key={current.id} post={current} onClose={() => setOpen(null)} />}
    </div>
  );
}

function PostEditor({ post, onClose }: { post: Post; onClose: () => void }) {
  const db = useDb();
  const editable = useCan()("blog.edit");
  const [f, setF] = useState({
    title: post.title === "Untitled post" ? "" : post.title,
    slug: post.slug.startsWith("draft-") ? "" : post.slug,
    excerpt: post.excerpt,
    body: post.body,
    cover: post.cover,
    coverAlt: post.coverAlt,
    tags: post.tags.join(", "),
    author: post.author,
    publishedAt: post.publishedAt ? toLocalInput(post.publishedAt) : "",
  });
  const [slugEdited, setSlugEdited] = useState(Boolean(f.slug));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v, ...(k === "title" && !slugEdited ? { slug: slugify(v) } : {}) }));

  const slug = f.slug.trim();
  const taken = db?.posts.some((p) => p.id !== post.id && p.slug === slug);
  const problem =
    f.title.trim().length < 3
      ? "Add a title."
      : !isSlug(slug)
        ? "The address can only have small letters, numbers and dashes."
        : taken
          ? "Another post already uses this address."
          : f.excerpt.length > 300
            ? "Keep the summary under 300 characters."
            : null;

  // Writes the form into the post, with `status` and when it goes live.
  function save(status: Post["status"], text: string) {
    if (problem) return setError(problem);
    setError(null);
    const publishedAt = status === "published" ? (f.publishedAt ? new Date(f.publishedAt).toISOString() : post.publishedAt ?? new Date().toISOString()) : post.publishedAt;
    update(
      "Blog",
      text,
      (d) => {
        const p = d.posts.find((x) => x.id === post.id)!;
        Object.assign(p, {
          title: f.title.trim(),
          slug,
          excerpt: f.excerpt.trim(),
          body: f.body,
          cover: f.cover,
          coverAlt: f.coverAlt.trim(),
          tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6),
          author: f.author.trim(),
          status,
          publishedAt,
          updatedAt: new Date().toISOString(),
        });
      },
      post.id,
    );
    if (status === "published" && publishedAt) setF((x) => ({ ...x, publishedAt: toLocalInput(publishedAt) }));
  }

  async function uploadCover(file: File) {
    setUploading(true);
    setError(null);
    const res = await uploadBlogPhoto(file);
    setUploading(false);
    if ("error" in res) return setError(res.error);
    setF((x) => ({ ...x, cover: res.url, coverAlt: x.coverAlt || x.title }));
  }

  const isLive = post.status === "published";
  const title = f.title.trim() || "Untitled post";

  return (
    <Drawer
      open
      wide
      onClose={onClose}
      title={title}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={stage(post).tone}>{stage(post).label}</StatusBadge>
          {readingMinutes(f.body)} min read · changed {ago(post.updatedAt)}
        </span>
      }
      footer={
        <>
          {isLive ? (
            <>
              <ActionButton permission="blog.edit" onClick={() => save("published", `Updated the post "${title}"`)}>
                Save changes
              </ActionButton>
              <ActionButton permission="blog.edit" variant="secondary" onClick={() => save("draft", `Unpublished the post "${title}"`)}>
                Unpublish
              </ActionButton>
              <a
                href={siteHref(`/blog/${post.slug}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink"
              >
                <ExternalLink className="h-4 w-4" aria-hidden /> View on the site
              </a>
            </>
          ) : (
            <>
              <ActionButton permission="blog.edit" onClick={() => save("published", `Published the post "${title}"`)}>
                Publish
              </ActionButton>
              <ActionButton permission="blog.edit" variant="secondary" onClick={() => save("draft", `Saved the draft "${title}"`)}>
                Save draft
              </ActionButton>
            </>
          )}
          <ActionButton
            permission="blog.edit"
            variant="danger"
            className="ml-auto"
            onClick={() => {
              if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
              update("Blog", `Deleted the post "${title}"`, (d) => void (d.posts = d.posts.filter((p) => p.id !== post.id)), post.id);
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Delete
          </ActionButton>
        </>
      }
    >
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <DrawerSection title="The post">
        <div className="space-y-4">
          <Labelled label="Title">
            <input value={f.title} onChange={(e) => set("title")(e.target.value)} disabled={!editable} placeholder="How to choose a wedding photographer" className={`${fieldClass} text-base font-medium`} />
          </Labelled>
          <Labelled label="Address">
            <div className="flex items-center rounded-lg border border-line bg-wash/60 text-sm focus-within:border-brand">
              <span className="shrink-0 pl-3 text-muted">aod.co.in/blog/</span>
              <input
                value={f.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  set("slug")(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                disabled={!editable}
                placeholder="how-to-choose-a-wedding-photographer"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-ink outline-none"
              />
            </div>
            {isLive && slug !== post.slug && <span className="mt-1 block text-xs text-amber-700">Changing a published post&apos;s address breaks links already shared.</span>}
          </Labelled>
          <Labelled label={`Summary (shown on the blog and in link previews) · ${f.excerpt.length}/300`}>
            <textarea value={f.excerpt} onChange={(e) => set("excerpt")(e.target.value)} disabled={!editable} rows={2} className={fieldClass} />
          </Labelled>
        </div>
      </DrawerSection>

      <DrawerSection title="Cover photo">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex aspect-[16/9] w-56 items-center justify-center overflow-hidden rounded-lg border border-line bg-wash">
            {f.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.cover} alt={f.coverAlt} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-muted">No cover photo</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <ActionButton permission="blog.edit" variant="secondary" disabled={uploading} onClick={() => coverInput.current?.click()}>
                {uploading ? <Spinner className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" aria-hidden />} {f.cover ? "Change photo" : "Upload photo"}
              </ActionButton>
              {f.cover && (
                <ActionButton permission="blog.edit" variant="secondary" onClick={() => setF((x) => ({ ...x, cover: "" }))}>
                  Remove
                </ActionButton>
              )}
            </div>
            <input
              ref={coverInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadCover(file);
              }}
            />
            <Labelled label="Describe the photo (for people who can't see it)">
              <input value={f.coverAlt} onChange={(e) => set("coverAlt")(e.target.value)} disabled={!editable} className={fieldClass} />
            </Labelled>
            <p className="text-xs text-muted">A wide photo works best (16:9). It also shows when the post is shared on WhatsApp.</p>
          </div>
        </div>
      </DrawerSection>

      <DrawerSection title="Text">
        <MarkdownEditor value={f.body} onChange={set("body")} photos disabled={!editable} label="Write the post" />
      </DrawerSection>

      <DrawerSection title="Details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Labelled label="Tags (commas between)">
            <input value={f.tags} onChange={(e) => set("tags")(e.target.value)} disabled={!editable} placeholder="Weddings, Photography" className={fieldClass} />
          </Labelled>
          <Labelled label="Author">
            <input value={f.author} onChange={(e) => set("author")(e.target.value)} disabled={!editable} placeholder="Team AOD" className={fieldClass} />
          </Labelled>
          <Labelled label="Publish on (empty = now)">
            <input type="datetime-local" value={f.publishedAt} onChange={(e) => set("publishedAt")(e.target.value)} disabled={!editable} className={fieldClass} />
          </Labelled>
        </div>
        <p className="mt-2 text-xs text-muted">A future date schedules the post: it appears on the site from that time (within the hour).</p>
      </DrawerSection>
    </Drawer>
  );
}
