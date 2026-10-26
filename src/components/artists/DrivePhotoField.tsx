"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { checkDrivePhoto, drivePhotoHelp, drivePhotoSrc } from "@/lib/drive-photo";
import { ArtistPhoto } from "@/components/ui/ArtistPhoto";
import { inputBase } from "./form";

export type PhotoStatus = "loaded" | "failed";

// The profile photo box in the application and the portal's profile: a Google Drive link with a
// live preview. The photo stays in the artist's Drive; AOD keeps only the link. `onStatus` tells
// the form whether Drive showed the photo, so it can ask for the sharing to be fixed first.
export function DrivePhotoField({
  name,
  value,
  onChange,
  error,
  onStatus,
}: {
  name: string;
  value: string;
  onChange: (link: string) => void;
  error?: string;
  onStatus?: (src: string, status: PhotoStatus) => void;
}) {
  const check = value.trim() ? checkDrivePhoto(value) : null;
  const src = drivePhotoSrc(value);
  const [seen, setSeen] = useState<{ src: string; status: PhotoStatus } | null>(null);
  const status = seen?.src === src ? seen.status : null;

  return (
    <div>
      <p className="text-sm font-medium text-ink">Profile photo</p>
      <p className="mt-1 text-xs text-muted">
        A clear photo of your face. It stays in your own Google Drive: paste its link and AOD shows it on your profile.
      </p>
      <div className="mt-3 flex items-start gap-4">
        <ArtistPhoto
          key={src}
          name={name}
          photo={check?.ok ? check.url : undefined}
          className="h-20 w-20 text-xl"
          width={240}
          alt={check?.ok ? "Your profile photo" : ""}
          onStatus={(s) => {
            setSeen({ src, status: s });
            onStatus?.(src, s);
          }}
        />
        <div className="min-w-0 flex-1">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value.trim())}
            inputMode="url"
            placeholder="https://drive.google.com/file/d/…/view"
            aria-label="Google Drive link to your profile photo"
            aria-invalid={!!error || (check !== null && !check.ok) || status === "failed"}
            className={inputBase}
          />
          {check && !check.ok ? (
            <p className="mt-1.5 text-xs text-red-600">{check.message}</p>
          ) : status === "failed" ? (
            <p className="mt-1.5 text-xs text-red-600">
              We can&apos;t open this photo. Check it&apos;s an image and that its sharing is set to “Anyone with the link”, then paste the link again.
            </p>
          ) : status === "loaded" ? (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Photo found. This is how it shows on your profile.
            </p>
          ) : (
            error && <p className="mt-1.5 text-xs text-red-600">{error}</p>
          )}
          <p className="mt-1.5 text-xs text-muted">{drivePhotoHelp}</p>
        </div>
      </div>
    </div>
  );
}
