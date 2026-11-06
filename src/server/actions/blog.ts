"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { currentStaff } from "@/server/staff";

// Photos for blog posts (the cover and pictures in the text), uploaded from the admin's Blog page
// to the public `blog` storage bucket. Like the artists' portfolio uploads, the server checks the
// person is on the team and hands out a one-time upload link; the browser shrinks the photo first
// (src/lib/image-resize.ts) and uploads it straight to the bucket.

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX = 10 * 1024 * 1024; // the bucket's own limit (supabase/migrations, eighth step)

const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60) || "photo";

export async function startBlogUpload(
  name: string,
  type: string,
  size: number,
): Promise<({ ok: true } & { path: string; token: string; url: string }) | { ok: false; error: string }> {
  const me = await currentStaff();
  if (!me) return { ok: false, error: "You're signed out. Please sign in again." };
  if (!TYPES.includes(type)) return { ok: false, error: "Upload a JPG, PNG or WebP photo." };
  if (!(size > 0) || size > MAX) return { ok: false, error: "Photos can be up to 10 MB." };

  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${Date.now()}-${safeName(String(name))}`;
  const storage = createAdminClient().storage.from("blog");
  const { data, error } = await storage.createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Uploads aren't available just now. Has the blog's SQL step been run in Supabase?" };
  return { ok: true, path: data.path, token: data.token, url: storage.getPublicUrl(data.path).data.publicUrl };
}
