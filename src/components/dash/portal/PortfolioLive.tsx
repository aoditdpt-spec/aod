"use client";

import { useState } from "react";
import { portalLive, portfolioOf, useDb } from "@/lib/app-db";
import { shrinkImage } from "@/lib/image-resize";
import { createClient } from "@/lib/supabase/client";
import { finishPortfolioUpload, removePortfolioFile, startPortfolioUpload } from "@/server/actions/artist";
import { Loading } from "../ui";

// The artist's portfolio (live): photos and videos in the `portfolio` storage bucket, which the team
// sees in the admin. Photos are shrunk in the browser (max 2560px WebP) and each file goes up through
// a one-time upload link (src/server/actions/artist.ts). Up to 30 files: photos to 15 MB, videos to 50 MB.

const MAX = 30;

export function PortfolioLive() {
  const db = useDb();
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  if (!db) return <Loading />;
  const files = portfolioOf(db);

  async function upload(list: File[]) {
    setError(null);
    const supabase = createClient();
    for (const picked of list.slice(0, MAX - files.length)) {
      setBusy((n) => n + 1);
      try {
        const file = picked.type.startsWith("image/") && picked.type !== "image/heic" ? await shrinkImage(picked) : picked;
        const type = file.type || (/\.heic$/i.test(file.name) ? "image/heic" : "");
        const start = await startPortfolioUpload(file.name, type, file.size);
        if (!start.ok) {
          setError(start.error);
          continue;
        }
        const { error: up } = await supabase.storage.from("portfolio").uploadToSignedUrl(start.path, start.token, file, { contentType: type });
        if (up) {
          setError("The upload didn't go through. Check your connection and try again.");
          continue;
        }
        const done = await finishPortfolioUpload(start.path, file.name, type, file.size);
        if (!done.ok) setError(done.error);
      } catch {
        setError("The upload didn't go through. Check your connection and try again.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    void portalLive.refreshPortal();
  }

  async function remove(path: string) {
    const res = await removePortfolioFile(path).catch(() => ({ ok: false as const, error: "Couldn't remove the file just now." }));
    if (!res.ok) setError(res.error);
    void portalLive.refreshPortal();
  }

  return (
    <>
      <div className="border-b border-line pb-7">
        <h1 className="text-[34px]">Portfolio</h1>
        <p className="mt-2 text-muted">
          {files.length} of {MAX} files. Photos up to 15 MB, videos up to 50 MB.
        </p>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {files.map((f) => (
          <div key={f.path} className="group relative">
            {f.video ? (
              <video src={f.url} muted playsInline preload="metadata" className="aspect-square w-full rounded bg-wash object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- files in the artist's storage folder
              <img src={f.url} alt={f.name} className="aspect-square w-full rounded object-cover" />
            )}
            <button type="button" onClick={() => void remove(f.path)} className="absolute right-1 top-1 rounded bg-paper/90 px-2 py-0.5 text-xs text-ink opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100">
              Remove
            </button>
          </div>
        ))}
        {files.length < MAX && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded border border-dashed border-line text-[13px] text-muted hover:border-ink hover:text-ink">
            {busy > 0 ? "Uploading…" : "Add Photos"}
            <input
              type="file"
              accept="image/*,video/mp4,video/quicktime"
              multiple
              className="sr-only"
              disabled={busy > 0}
              onChange={(e) => {
                const list = [...(e.target.files ?? [])];
                e.target.value = "";
                void upload(list);
              }}
            />
          </label>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
