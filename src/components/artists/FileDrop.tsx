"use client";

import { FileText, ImagePlus, Play, Star, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

// File picker with drag and drop, checks and previews. In the preview nothing is uploaded:
// files stay in this browser tab (shown through object URLs) and are gone on refresh.

export type PickedFile = { id: string; file: File; url: string; kind: "image" | "video" | "doc" };

type Limits = { accept: string; maxMb?: number; imageMaxMb?: number; videoMaxMb?: number; max?: number };

const kindOf = (f: File): PickedFile["kind"] =>
  f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "doc";

export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function FileDrop({
  files,
  onChange,
  limits,
  hint,
  multiple = false,
  variant = "gallery",
  label,
}: {
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  limits: Limits;
  hint: string;
  multiple?: boolean;
  variant?: "gallery" | "single";
  label: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [over, setOver] = useState(false);

  function add(list: FileList | null) {
    if (!list?.length) return;
    const accepted = limits.accept.split(",");
    const problems: string[] = [];
    const next: PickedFile[] = [];
    for (const file of Array.from(list)) {
      const kind = kindOf(file);
      // Some phones send HEIC with an empty type; accept it by extension.
      const typeOk = accepted.includes(file.type) || (accepted.includes("image/heic") && /\.heic$/i.test(file.name));
      if (!typeOk) {
        problems.push(`${file.name}: this file type isn't accepted.`);
        continue;
      }
      const maxMb = kind === "video" ? limits.videoMaxMb ?? limits.maxMb : kind === "image" ? limits.imageMaxMb ?? limits.maxMb : limits.maxMb;
      if (maxMb && file.size > maxMb * 1024 * 1024) {
        problems.push(`${file.name} is ${formatSize(file.size)}; the limit is ${maxMb} MB.`);
        continue;
      }
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      if (multiple && (files.some((f) => f.id === id) || next.some((f) => f.id === id))) continue; // already added
      next.push({ id, file, url: URL.createObjectURL(file), kind });
      if (!multiple) break;
    }
    let merged = multiple ? [...files, ...next] : next;
    if (!multiple && next.length) files.forEach((f) => URL.revokeObjectURL(f.url));
    if (limits.max && merged.length > limits.max) {
      problems.push(`You can add up to ${limits.max} files; the extra ones were left out.`);
      merged.slice(limits.max).forEach((f) => URL.revokeObjectURL(f.url));
      merged = merged.slice(0, limits.max);
    }
    setErrors(problems);
    onChange(merged);
  }

  function remove(id: string) {
    const gone = files.find((f) => f.id === id);
    if (gone) URL.revokeObjectURL(gone.url);
    onChange(files.filter((f) => f.id !== id));
  }

  function makeCover(id: string) {
    const pick = files.find((f) => f.id === id);
    if (pick) onChange([pick, ...files.filter((f) => f.id !== id)]);
  }

  const zone = (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        add(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
        over ? "border-brand bg-peach/40" : "border-line bg-wash/60 hover:border-brand/50"
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
        {variant === "gallery" ? <ImagePlus className="h-5 w-5" aria-hidden /> : <Upload className="h-5 w-5" aria-hidden />}
      </span>
      <p className="text-sm text-ink">
        Drag {multiple ? "files" : "a file"} here or{" "}
        <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-brand underline underline-offset-4">
          browse
        </button>
      </p>
      <p className="max-w-md text-xs text-muted">{hint}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        aria-label={label}
        accept={limits.accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );

  return (
    <div className="mt-2">
      {(multiple || files.length === 0) && zone}

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-red-600" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && variant === "gallery" && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {files.map((f, i) => (
            <li key={f.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-wash">
              {f.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt={f.file.name} className="h-full w-full object-cover" />
              ) : f.kind === "video" ? (
                <>
                  <video src={f.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  <Play className="absolute left-2 top-2 h-5 w-5 rounded-full bg-black/60 p-1 text-white" aria-hidden />
                </>
              ) : (
                <span className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-muted">
                  <FileText className="h-6 w-6 text-brand" aria-hidden /> {f.file.name}
                </span>
              )}
              {i === 0 && multiple && (
                <span className="absolute left-2 bottom-2 rounded-md bg-brand px-2 py-0.5 text-[0.7rem] font-medium text-white">Cover</span>
              )}
              <span className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {i > 0 && multiple && (
                  <button
                    type="button"
                    onClick={() => makeCover(f.id)}
                    aria-label={`Make ${f.file.name} the cover`}
                    className="rounded-md bg-white/90 p-1.5 text-ink hover:text-brand"
                  >
                    <Star className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  aria-label={`Remove ${f.file.name}`}
                  className="rounded-md bg-white/90 p-1.5 text-ink hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && variant === "single" && (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
              {f.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-wash">
                  <FileText className="h-5 w-5 text-brand" aria-hidden />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{f.file.name}</span>
                <span className="block text-xs text-muted">{formatSize(f.file.size)} · not uploaded (preview)</span>
              </span>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-wash hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
