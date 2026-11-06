"use client";

import { Camera, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { shrinkImage } from "@/lib/image-resize";
import { ArtistPhoto } from "./ArtistPhoto";
import { Spinner } from "./Spinner";

const TYPES = ["image/jpeg", "image/png", "image/webp"];

// The profile photo picker: "Choose from gallery" or "Take a photo" (the camera on phones and
// tablets), with the photo shown round as it will appear. The picture is shrunk in the browser
// (at most 800px, WebP) and handed over as a data URL; the caller saves it (to AOD's Google Drive
// through the server, src/server/artist-photos.ts). Used in the application, the portal's Profile
// and the admin's drawers.
export function PhotoPicker({
  name,
  src,
  onPick,
  busy = false,
  error,
  size = "h-20 w-20 text-xl",
}: {
  name: string;
  src?: string;
  onPick: (dataUrl: string) => void;
  busy?: boolean;
  error?: string | null;
  size?: string;
}) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);

  async function picked(file: File | undefined) {
    setProblem(null);
    if (!file) return;
    const small = await shrinkImage(file, 800, 0.85);
    if (!TYPES.includes(small.type)) return setProblem("Use a JPG or PNG photo.");
    if (small.size > 3 * 1024 * 1024) return setProblem("That photo is too large. Pick a smaller one.");
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result));
    reader.onerror = () => setProblem("Couldn't read that photo. Try another one.");
    reader.readAsDataURL(small);
  }

  const button =
    "inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink hover:border-ink disabled:cursor-wait disabled:opacity-60";
  const shown = error ?? problem;
  return (
    <div className="flex items-center gap-4">
      <ArtistPhoto name={name} src={src} className={size} alt={src ? "Your profile photo" : ""} />
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => gallery.current?.click()} disabled={busy} className={button}>
            {busy ? <Spinner /> : <ImageIcon className="h-4 w-4 text-brand" aria-hidden />} {src ? "Change photo" : "Choose from gallery"}
          </button>
          <button type="button" onClick={() => camera.current?.click()} disabled={busy} className={button}>
            <Camera className="h-4 w-4 text-brand" aria-hidden /> Take a photo
          </button>
        </div>
        {shown ? <p className="mt-1.5 text-xs text-red-600">{shown}</p> : <p className="mt-1.5 text-xs text-muted">A clear photo of your face. JPG or PNG.</p>}
        <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => void picked(e.target.files?.[0]).then(() => (e.target.value = ""))} />
        <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => void picked(e.target.files?.[0]).then(() => (e.target.value = ""))} />
      </div>
    </div>
  );
}
