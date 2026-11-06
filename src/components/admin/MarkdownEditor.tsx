"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, ImagePlus, Link2, List } from "lucide-react";
import { Markdown } from "@/components/blog/Markdown";
import { Spinner } from "@/components/ui/Spinner";
import { backendEnabled } from "@/lib/backend";
import { shrinkImage } from "@/lib/image-resize";
import { createClient } from "@/lib/supabase/client";
import { startBlogUpload } from "@/server/actions/blog";
import { fieldClass } from "./ui";

// Uploads a photo to the blog's storage bucket (live mode): shrinks it in the browser, gets a
// one-time upload link from the server (staff only), uploads, and returns its public address.
export async function uploadBlogPhoto(picked: File): Promise<{ url: string } | { error: string }> {
  if (!backendEnabled) return { error: "Preview: photos aren't uploaded. Connect Supabase to add photos." };
  try {
    const file = await shrinkImage(picked, 2000);
    const start = await startBlogUpload(file.name, file.type, file.size);
    if (!start.ok) return { error: start.error };
    const { error } = await createClient().storage.from("blog").uploadToSignedUrl(start.path, start.token, file, { contentType: file.type });
    if (error) return { error: "The upload didn't go through. Check your connection and try again." };
    return { url: start.url };
  } catch {
    return { error: "The upload didn't go through. Check your connection and try again." };
  }
}

// Writing a post or a newsletter in simple formatting (src/lib/markdown.ts), with a toolbar that
// types the formatting in for you, a preview of how it will look, and (with `photos`) photo uploads.
export function MarkdownEditor({
  value,
  onChange,
  rows = 18,
  photos = false,
  disabled = false,
  label = "Text",
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  photos?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replace the selection (or insert at the cursor), then put the cursor after the new text.
  function insert(make: (selected: string) => string, block = false) {
    const el = box.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    let text = make(selected);
    // Block formatting (a heading, a list, a photo) starts on its own line.
    if (block && start > 0 && value[start - 1] !== "\n") text = `\n\n${text}`;
    const next = value.slice(0, start) + text + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  }

  async function addPhoto(picked: File) {
    setUploading(true);
    setError(null);
    const res = await uploadBlogPhoto(picked);
    setUploading(false);
    if ("error" in res) return setError(res.error);
    const alt = picked.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    insert(() => `![${alt}](${res.url})\n\n`, true);
  }

  const tool = "inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-ink hover:bg-wash disabled:opacity-40";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <div className="inline-flex rounded-lg border border-line p-0.5 text-xs font-medium">
          {(["write", "preview"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-md px-3 py-1 ${tab === t ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
              {t === "write" ? "Write" : "Preview"}
            </button>
          ))}
        </div>
      </div>

      {tab === "write" ? (
        <>
          <div className="mt-1.5 flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-line bg-wash/60 p-1">
            <button type="button" disabled={disabled} className={tool} onClick={() => insert((s) => `## ${s || "Heading"}`, true)} title="Heading">
              <Heading2 className="h-4 w-4" aria-hidden /> Heading
            </button>
            <button type="button" disabled={disabled} className={tool} onClick={() => insert((s) => `**${s || "bold text"}**`)} title="Bold">
              <Bold className="h-4 w-4" aria-hidden /> Bold
            </button>
            <button type="button" disabled={disabled} className={tool} onClick={() => insert((s) => (s ? s.split("\n").map((l) => `- ${l}`).join("\n") : "- "), true)} title="List">
              <List className="h-4 w-4" aria-hidden /> List
            </button>
            <button type="button" disabled={disabled} className={tool} onClick={() => insert((s) => `[${s || "link text"}](https://)`)} title="Link">
              <Link2 className="h-4 w-4" aria-hidden /> Link
            </button>
            {photos && (
              <>
                <button type="button" disabled={disabled || uploading} className={tool} onClick={() => file.current?.click()} title="Add a photo">
                  {uploading ? <Spinner className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" aria-hidden />} {uploading ? "Uploading…" : "Photo"}
                </button>
                <input
                  ref={file}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void addPhoto(f);
                  }}
                />
              </>
            )}
          </div>
          <textarea
            ref={box}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            disabled={disabled}
            className={`${fieldClass} rounded-t-none font-mono text-[0.8125rem] leading-relaxed`}
          />
          <p className="mt-1.5 text-xs text-muted">
            ## Heading · **bold** · *italic* · - list · 1. numbered · &gt; quote · [link text](https://…) · a blank line starts a new paragraph
          </p>
          {error && (
            <p role="alert" className="mt-1.5 text-xs text-red-700">
              {error}
            </p>
          )}
        </>
      ) : (
        <div className="mt-1.5 max-h-[60vh] overflow-y-auto rounded-lg border border-line p-5">
          {value.trim() ? <Markdown source={value} /> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
