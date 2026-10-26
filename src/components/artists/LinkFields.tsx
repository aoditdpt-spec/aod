"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { inputBase } from "./form";

const isInstagram = (l: string) => /(^|\.)instagram\.com\//i.test(l.replace(/^https?:\/\//, ""));

// The artist's two portfolio links, each in its own box: their Instagram profile, and a portfolio
// or showreel (YouTube or Google Drive). Each box is checked when the artist leaves it (or presses
// Enter); `onChange` gets the good links as a list ([instagram, work], empty ones left out), which
// is how they're saved (profile.links). Used by the application's Portfolio step and the portal's
// Portfolio page.
export function LinkFields({ links, onChange, both = false }: { links: string[]; onChange: (links: string[]) => void; both?: boolean }) {
  const [insta, setInsta] = useState(() => links.find(isInstagram) ?? "");
  const [work, setWork] = useState(() => links.find((l) => !isInstagram(l)) ?? "");
  const [errors, setErrors] = useState<{ insta?: string; work?: string }>({});

  const check = (kind: "insta" | "work", value: string): { url?: string; error?: string; warning?: string } => {
    if (!value.trim()) return {};
    const c = checkPortfolioLink(value);
    if (!c.ok) return { error: c.message };
    if (kind === "insta" && c.platform !== "Instagram") return { error: "Paste your Instagram profile link here, e.g. instagram.com/yourname." };
    if (kind === "work" && c.platform === "Instagram") return { error: "Use a YouTube or Google Drive link here; Instagram goes in the box above." };
    return { url: c.url, warning: c.warning };
  };

  // Check both boxes and pass on the good links.
  function commit(nextInsta = insta, nextWork = work) {
    const a = check("insta", nextInsta);
    const b = check("work", nextWork);
    setErrors({ insta: a.error, work: b.error });
    if (!a.error && !b.error) onChange([a.url, b.url].filter((x): x is string => Boolean(x)));
  }

  const box = (kind: "insta" | "work", label: string, placeholder: string, value: string, set: (v: string) => void) => {
    const result = check(kind, value);
    const error = errors[kind];
    return (
      <label className="block text-sm font-medium text-ink">
        {label} {!both && <span className="font-normal text-muted">(at least one of the two)</span>}
        <input
          value={value}
          onChange={(e) => {
            set(e.target.value);
            setErrors((x) => ({ ...x, [kind]: undefined }));
          }}
          onBlur={() => commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          inputMode="url"
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`mt-1.5 ${inputBase}`}
        />
        {error ? (
          <span className="mt-1.5 flex items-start gap-1.5 text-xs font-normal text-red-600">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
          </span>
        ) : result.url ? (
          <span className={`mt-1.5 flex items-start gap-1.5 text-xs font-normal ${result.warning ? "text-amber-700" : "text-emerald-700"}`}>
            {result.warning ? <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />}
            {result.warning ?? "Looks good."}
          </span>
        ) : null}
      </label>
    );
  };

  return (
    <div className="mt-3 grid gap-4">
      {box("insta", "Instagram profile", "instagram.com/yourname", insta, setInsta)}
      {box("work", "Portfolio or showreel (YouTube or Google Drive)", "youtube.com/@yourchannel or a Drive folder link", work, setWork)}
    </div>
  );
}
