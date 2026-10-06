"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, Plus, X } from "lucide-react";
import { useState } from "react";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { inputBase } from "./form";

// Portfolio links (Instagram, YouTube, Behance, Drive, website…). Each link is checked as it's
// added: it must be a real public address, and chat links or private addresses are turned away.
export function LinkEditor({ links, onChange, max = 8 }: { links: string[]; onChange: (links: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    const check = checkPortfolioLink(draft);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (links.includes(check.url)) {
      setError("You've already added this link.");
      return;
    }
    onChange([...links, check.url]);
    setDraft("");
    setError(null);
  }

  return (
    <div>
      {links.length > 0 && (
        <ul className="mt-2 space-y-2">
          {links.map((link) => {
            const check = checkPortfolioLink(link);
            return (
              <li key={link} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3">
                {check.ok && !check.warning ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{check.ok ? check.label : "Check this link"}</span>
                  <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-xs text-muted hover:text-brand">
                    <span className="truncate">{link}</span> <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                  </a>
                  {check.ok && check.warning && <span className="mt-1 block text-xs text-amber-700">{check.warning}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(links.filter((l) => l !== link))}
                  aria-label={`Remove ${link}`}
                  className="rounded-md p-1 text-muted hover:bg-wash hover:text-red-600"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {links.length < max && (
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="instagram.com/yourname or a YouTube, Behance or website link"
            aria-label="Portfolio link"
            aria-invalid={!!error}
            inputMode="url"
            autoComplete="url"
            className={inputBase}
          />
          <button
            type="button"
            onClick={add}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand px-4 text-sm font-medium text-brand hover:bg-wash"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
