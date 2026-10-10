"use client";

import { Check, Loader2, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { uploadRules } from "@/content/artist-portal";
import { backendEnabled } from "@/lib/backend";
import { refreshPortal, saveProfile, useArtistProfile, usePortalState } from "@/lib/artist-live";
import { shrinkImage } from "@/lib/image-resize";
import { createClient } from "@/lib/supabase/client";
import { finishPortfolioUpload, removePortfolioFile, startPortfolioUpload } from "@/server/actions/artist";
import { FileDrop, formatSize, type PickedFile } from "./FileDrop";
import { Panel } from "./form";
import { LinkEditor } from "./LinkEditor";

const tips = [
  "Lead with your strongest frame: it's the cover customers see first.",
  "Show range: wide shots, details, people, low light.",
  "Use recent work, ideally from the last two years.",
  "Only share work you shot or edited yourself.",
];

// Live uploads: photos up to 15 MB (shrunk in the browser first), videos up to 50 MB.
const liveRules = { ...uploadRules.samples, videoMaxMb: 50, hint: "JPG, PNG, WebP or HEIC photos up to 15 MB; MP4 or MOV videos up to 50 MB (longer films: add a YouTube or Vimeo link below)." };

// Photos, videos and links. Live: files go to AOD's storage and links to the artist's profile.
// Preview: links are kept in this browser; photos and videos stay in this tab only.
export function PortfolioManager() {
  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        {backendEnabled ? <LiveFiles /> : <PreviewFiles />}
        <Links />
      </div>

      <Panel title="What makes a strong portfolio">
        <ul className="space-y-3 text-sm text-body">
          {tips.map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> {t}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-lg bg-wash p-3 text-xs text-muted">Our creative team reviews new work before it appears in your matches.</p>
      </Panel>
    </div>
  );
}

function Links() {
  const { profile } = useArtistProfile();
  const [error, setError] = useState<string | null>(null);
  return (
    <Panel title="Portfolio links" text="Instagram, YouTube, Vimeo, Behance, Google Drive or your own website.">
      <LinkEditor
        links={profile.links}
        onChange={(links) => {
          setError(null);
          void saveProfile({ links }).then((err) => err && setError(err));
        }}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Panel>
  );
}

function PreviewFiles() {
  const [files, setFiles] = useState<PickedFile[]>([]);
  return (
    <Panel title="Photos and videos" text={`${files.length} of ${uploadRules.samples.max} · at least ${uploadRules.samples.min} recommended`}>
      <FileDrop label="Photos and videos" multiple files={files} onChange={setFiles} limits={uploadRules.samples} hint={uploadRules.samples.hint} />
      <p className="mt-4 text-xs text-muted">Preview: files aren&apos;t uploaded. They stay in this tab and disappear on refresh.</p>
    </Panel>
  );
}

type Upload = { id: string; name: string; error?: string };

function LiveFiles() {
  const files = usePortalState().data?.portfolio ?? [];
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // One file at a time: shrink photos, get a one-time upload link, upload, then add it to the profile.
  async function upload(picked: PickedFile[]) {
    const queue = picked.map((p) => ({ id: p.id, name: p.file.name, file: p.file, url: p.url }));
    setUploads((u) => [...u, ...queue.map(({ id, name }) => ({ id, name }))]);
    const supabase = createClient();
    for (const item of queue) {
      const fail = (msg: string) => setUploads((u) => u.map((x) => (x.id === item.id ? { ...x, error: msg } : x)));
      try {
        const file = await shrinkImage(item.file);
        const type = file.type || (/\.heic$/i.test(file.name) ? "image/heic" : "");
        const start = await startPortfolioUpload(file.name, type, file.size);
        if (!start.ok) {
          fail(start.error);
          continue;
        }
        const { error: upError } = await supabase.storage.from("portfolio").uploadToSignedUrl(start.path, start.token, file, { contentType: type });
        if (upError) {
          fail("The upload didn't go through. Check your connection and try again.");
          continue;
        }
        const done = await finishPortfolioUpload(start.path, file.name, type, file.size);
        if (!done.ok) {
          fail(done.error);
          continue;
        }
        setUploads((u) => u.filter((x) => x.id !== item.id));
        await refreshPortal();
      } catch {
        fail("The upload didn't go through. Check your connection and try again.");
      } finally {
        URL.revokeObjectURL(item.url);
      }
    }
  }

  async function remove(path: string) {
    setRemoving(path);
    setError(null);
    const res = await removePortfolioFile(path);
    if (!res.ok) setError(res.error);
    await refreshPortal();
    setRemoving(null);
  }

  return (
    <Panel title="Photos and videos" text={`${files.length} of ${uploadRules.samples.max} · at least ${uploadRules.samples.min} recommended`}>
      {files.length > 0 && (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((f, i) => (
            <li key={f.path} className="group relative overflow-hidden rounded-xl border border-line bg-wash">
              <div className="aspect-[4/3]">
                {f.type.startsWith("video/") ? (
                  <div className="relative h-full w-full">
                    <video src={f.url} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                    <Play className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" aria-hidden />
                  </div>
                ) : f.type === "image/heic" ? (
                  <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted">HEIC photo (shows on iPhone and Mac)</div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- files from the storage bucket
                  <img src={f.url} alt={f.name} loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs">
                <span className="min-w-0 truncate text-muted">
                  {i === 0 && <span className="mr-1 font-medium text-brand">Cover ·</span>}
                  {formatSize(f.size)}
                </span>
                <button
                  type="button"
                  onClick={() => void remove(f.path)}
                  disabled={removing === f.path}
                  aria-label={`Remove ${f.name}`}
                  className="rounded-md p-1 text-muted hover:bg-white hover:text-red-600 disabled:opacity-40"
                >
                  {removing === f.path ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {files.length < uploadRules.samples.max && (
        <FileDrop label="Photos and videos" multiple files={[]} onChange={(picked) => void upload(picked)} limits={liveRules} hint={liveRules.hint} />
      )}

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {uploads.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 rounded-lg bg-wash px-3 py-2">
              <span className="min-w-0 truncate text-ink">{u.name}</span>
              {u.error ? (
                <span className="flex shrink-0 items-center gap-2 text-xs text-red-600">
                  {u.error}
                  <button type="button" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))} className="font-medium text-muted underline">
                    Dismiss
                  </button>
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Uploading…
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-4 text-xs text-muted">The first file is your cover. Photos are resized for the web before uploading.</p>
    </Panel>
  );
}
