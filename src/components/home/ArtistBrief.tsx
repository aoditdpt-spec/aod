"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { briefCommon, briefQuestions, type Brief, type BriefAnswers, type BriefQuestion } from "@/content/artist-brief";
import { categories } from "@/content/site";
import { Icon } from "@/components/ui/Icon";

// The optional "Brief for the artists" section of the booking questions, after the event details:
// a block of quick questions for each kind of artist picked (tap to choose; text for the rest),
// then preferences about the artist, reference links and anything else. Questions and wording are
// in src/content/artist-brief.ts. With more than two kinds of artist picked, the blocks start
// folded so the form stays short; the first one is open.

const field = "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-normal outline-none focus:border-brand";

export function ArtistBrief({ slugs, brief, onChange }: { slugs: string[]; brief: Brief; onChange: (b: Brief) => void }) {
  const [open, setOpen] = useState<string[]>(slugs.length > 2 ? slugs.slice(0, 1) : slugs);
  const withQuestions = slugs.filter((s) => (briefQuestions[s] ?? []).length > 0);

  const answer = (slug: string, id: string, value: string | string[] | undefined) => {
    const current: BriefAnswers = { ...(brief.byCategory?.[slug] ?? {}) };
    if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) delete current[id];
    else current[id] = value;
    onChange({ ...brief, byCategory: { ...(brief.byCategory ?? {}), [slug]: current } });
  };

  return (
    <section className="mt-6 rounded-xl border border-line p-4 sm:p-5" aria-labelledby="artist-brief-title">
      <p id="artist-brief-title" className="flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-ink">
        {briefCommon.title} <span className="text-xs font-normal text-muted">{briefCommon.optional}</span>
      </p>
      <p className="mt-1 text-sm text-body">{briefCommon.intro}</p>

      <div className="mt-4 space-y-3">
        {withQuestions.map((slug) => {
          const c = categories.find((x) => x.slug === slug);
          const isOpen = open.includes(slug);
          const answered = Object.keys(brief.byCategory?.[slug] ?? {}).length;
          return (
            <div key={slug} className="rounded-xl bg-wash/70">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen((o) => (isOpen ? o.filter((x) => x !== slug) : [...o, slug]))}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ink"
              >
                {c && <Icon name={c.icon} className="h-4 w-4 shrink-0 text-brand" />}
                <span className="flex-1">For the {c?.name.toLowerCase() ?? slug}</span>
                {answered > 0 && <span className="text-xs font-normal text-muted">{answered} answered</span>}
                <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {isOpen && (
                <div className="space-y-4 px-4 pb-4">
                  {(briefQuestions[slug] ?? []).map((q) => (
                    <Question key={q.id} q={q} value={brief.byCategory?.[slug]?.[q.id]} onChange={(v) => answer(slug, q.id, v)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-ink sm:col-span-2">
          {briefCommon.preferences.label}
          <input value={brief.preferences ?? ""} onChange={(e) => onChange({ ...brief, preferences: e.target.value })} placeholder={briefCommon.preferences.placeholder} className={field} />
        </label>
        <label className="text-sm font-medium text-ink">
          {briefCommon.references.label}
          <textarea
            value={brief.references ?? ""}
            onChange={(e) => onChange({ ...brief, references: e.target.value })}
            rows={2}
            placeholder={briefCommon.references.placeholder}
            className={`${field} resize-none`}
          />
        </label>
        <label className="text-sm font-medium text-ink">
          {briefCommon.note.label}
          <textarea value={brief.note ?? ""} onChange={(e) => onChange({ ...brief, note: e.target.value })} rows={2} placeholder={briefCommon.note.placeholder} className={`${field} resize-none`} />
        </label>
      </div>
    </section>
  );
}

// One question: choices as chips (one or several), or a line of text.
function Question({ q, value, onChange }: { q: BriefQuestion; value: string | string[] | undefined; onChange: (v: string | string[] | undefined) => void }) {
  if (q.kind === "text") {
    return (
      <label className="block text-sm font-medium text-ink">
        {q.label}
        <input value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} placeholder={q.placeholder} maxLength={300} className={field} />
      </label>
    );
  }
  const picked = q.kind === "many" ? (Array.isArray(value) ? value : []) : typeof value === "string" ? [value] : [];
  return (
    <fieldset>
      <legend className="text-sm font-medium text-ink">
        {q.label}
        {q.kind === "many" && <span className="ml-1.5 text-xs font-normal text-muted">pick any</span>}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {q.options?.map((o) => {
          const on = picked.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => (q.kind === "one" ? onChange(on ? undefined : o) : onChange(on ? picked.filter((x) => x !== o) : [...picked, o]))}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${on ? "bg-peach text-ink ring-2 ring-brand" : "bg-white text-ink ring-1 ring-line hover:ring-brand"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
