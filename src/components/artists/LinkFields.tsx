"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { checkPortfolioLink, instagramUsername, isInstagramLink } from "@/lib/portfolio-links";
import { inputBase } from "./form";

// The artist's two links, each in its own box: their Instagram (typed after a fixed
// "instagram.com/", so only the username goes in the box), and a portfolio or showreel on any site
// (Instagram, YouTube, Google Drive, Behance, their own website…). Each box is checked when the
// artist leaves it (or presses Enter); `onChange` gets the good links as a list ([instagram, work],
// empty ones left out), which is how they're saved (profile.links). Used by the application's
// Portfolio step and the portal's Portfolio page.
export function LinkFields({ links, onChange }: { links: string[]; onChange: (links: string[]) => void }) {
  const first = links.find((l) => isInstagramLink(l) && instagramUsername(l));
  const [insta, setInsta] = useState(() => (first ? instagramUsername(first) : ""));
  const [work, setWork] = useState(() => links.find((l) => l !== first) ?? "");
  const [errors, setErrors] = useState<{ insta?: string; work?: string }>({});

  const instaUrl = (name: string) => (name ? `https://www.instagram.com/${name}` : "");
  const checkInsta = (value: string): { url?: string; error?: string } => {
    if (!value.trim()) return {};
    const name = instagramUsername(value);
    return name ? { url: instaUrl(name) } : { error: "Type just your Instagram username, e.g. kavya.frames." };
  };
  const checkWork = (value: string): { url?: string; error?: string; warning?: string } => {
    if (!value.trim()) return {};
    const c = checkPortfolioLink(value);
    return c.ok ? { url: c.url, warning: c.warning } : { error: c.message };
  };

  // Check both boxes and pass on the good links.
  function commit(nextInsta = insta, nextWork = work) {
    const a = checkInsta(nextInsta);
    const b = checkWork(nextWork);
    setErrors({ insta: a.error, work: b.error });
    if (!a.error && !b.error) onChange([a.url, b.url].filter((x): x is string => Boolean(x)));
  }

  const hint = (error: string | undefined, ok: boolean, warning?: string) =>
    error ? (
      <span className="mt-1.5 flex items-start gap-1.5 text-xs font-normal text-red-600">
        <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
      </span>
    ) : ok ? (
      <span className={`mt-1.5 flex items-start gap-1.5 text-xs font-normal ${warning ? "text-amber-700" : "text-emerald-700"}`}>
        {warning ? <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />}
        {warning ?? "Looks good."}
      </span>
    ) : null;

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
  };
  const w = checkWork(work);

  return (
    <div className="mt-3 grid gap-4">
      <label className="block text-sm font-medium text-ink">
        Instagram
        <span className="mt-1.5 flex">
          <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-wash px-3 text-sm font-normal text-muted">instagram.com/</span>
          <input
            value={insta}
            onChange={(e) => {
              setInsta(e.target.value);
              setErrors((x) => ({ ...x, insta: undefined }));
            }}
            onBlur={() => {
              // A pasted address or "@name" turns into the plain username.
              const name = instagramUsername(insta);
              if (name && name !== insta) setInsta(name);
              commit(name || insta);
            }}
            onKeyDown={onEnter}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="yourname"
            aria-invalid={Boolean(errors.insta)}
            className={`${inputBase} rounded-l-none`}
          />
        </span>
        {hint(errors.insta, Boolean(insta) && !errors.insta && instagramUsername(insta) !== "")}
      </label>
      <label className="block text-sm font-medium text-ink">
        Portfolio link
        <input
          value={work}
          onChange={(e) => {
            setWork(e.target.value);
            setErrors((x) => ({ ...x, work: undefined }));
          }}
          onBlur={() => commit()}
          onKeyDown={onEnter}
          inputMode="url"
          placeholder="YouTube, Google Drive, Instagram or your website"
          aria-invalid={Boolean(errors.work)}
          className={`mt-1.5 ${inputBase}`}
        />
        {hint(errors.work, Boolean(w.url) && !errors.work, w.warning)}
      </label>
    </div>
  );
}
