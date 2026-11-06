"use client";

import {
  isOther,
  OTHER,
  otherText,
  pickChoices,
  withOtherText,
  workQuestionShown,
  workQuestionsForAll,
  workSections,
} from "@/content/artist-portal";
import { categories } from "@/content/site";
import { checkDriveLink } from "@/lib/portfolio-links";
import type { WorkDetails } from "@/lib/artist-store";
import { ChipGroup, Field, inputClass } from "./form";

// "As a photographer", "As an editor": the title of each category's questions.
export const asA = (slug: string) => {
  const who = categories.find((c) => c.slug === slug)?.singular.toLowerCase() ?? slug;
  return `As ${/^[aeiou]/.test(who) ? "an" : "a"} ${who}`;
};
export function WorkQuestions({
  questions,
  answers: d,
  setAnswer,
  errors,
}: {
  questions: ReturnType<typeof workQuestionsForAll>;
  answers: WorkDetails;
  setAnswer: (id: string, v: string | string[]) => void;
  errors: Record<string, string>;
}) {
  return (
    <>
      {questions.map((q) => {
        if (!workQuestionShown(q, d)) return null;
        const v = d[q.id];
        if (q.kind === "long")
          return (
            <Field key={q.id} label={q.label} optional={q.optional} error={errors[q.id]} hint={q.hint}>
              <textarea
                value={typeof v === "string" ? v : ""}
                onChange={(e) => setAnswer(q.id, e.target.value.slice(0, 600))}
                rows={3}
                aria-invalid={!!errors[q.id]}
                className={`${inputClass} resize-none`}
              />
            </Field>
          );
        if (q.kind === "link") {
          const link = typeof v === "string" && v.trim() ? checkDriveLink(v) : null;
          return (
            <Field key={q.id} label={q.label} optional={q.optional} error={errors[q.id] ?? (link && !link.ok ? link.message : undefined)} hint={q.hint}>
              <input
                value={typeof v === "string" ? v : ""}
                onChange={(e) => setAnswer(q.id, e.target.value.trim().slice(0, 300))}
                inputMode="url"
                placeholder="https://drive.google.com/drive/folders/…"
                aria-invalid={!!errors[q.id] || (link !== null && !link.ok)}
                className={inputClass}
              />
            </Field>
          );
        }
        if (q.kind === "text")
          return (
            <Field key={q.id} label={q.label} optional={q.optional} error={errors[q.id]} hint={q.hint} className="sm:max-w-sm">
              <input
                value={typeof v === "string" ? v : ""}
                onChange={(e) => setAnswer(q.id, e.target.value.slice(0, 80))}
                aria-invalid={!!errors[q.id]}
                className={inputClass}
              />
            </Field>
          );
        const list = Array.isArray(v) ? v : v ? [v] : [];
        // The chips show a written "Other: …" answer as the "Other" chip.
        const shown = list.map((a) => (isOther(a) ? OTHER : a));
        const save = (answers: string[]) => setAnswer(q.id, q.kind === "many" ? answers : (answers[0] ?? ""));
        return (
          <div key={q.id}>
            <p className="text-sm font-medium text-ink">{q.label}</p>
            {q.hint && <p className="mt-1 text-xs text-muted">{q.hint}</p>}
            <ChipGroup
              label={q.short}
              multiple={q.kind === "many"}
              selectAll={q.kind === "many"}
              options={q.options ?? []}
              value={shown}
              onChange={(next) => save(pickChoices(list, next))}
            />
            {list.some(isOther) && (
              <input
                value={otherText(list)}
                onChange={(e) => save(list.map((a) => (isOther(a) ? withOtherText(e.target.value) : a)))}
                placeholder="Write your own"
                aria-label={`${q.short}: write your own`}
                aria-invalid={!!errors[q.id]}
                className={`${inputClass} mt-2 sm:max-w-sm`}
              />
            )}
            {errors[q.id] && <p className="mt-1.5 text-xs text-red-600">{errors[q.id]}</p>}
          </div>
        );
      })}
    </>
  );
}

// "Your work details": the questions for the artist's categories, a section for each when they work
// in more than one. Used by the application's Work step and the profile editors (portal and admin).
export function WorkSections({
  category,
  otherCategories,
  answers,
  setAnswer,
  errors = {},
}: {
  category: string;
  otherCategories: string[];
  answers: WorkDetails;
  setAnswer: (id: string, v: string | string[]) => void;
  errors?: Record<string, string>;
}) {
  const sections = workSections(category, otherCategories).filter((s) => s.questions.length > 0);
  return (
    <>
      {sections.map((s) => (
        <fieldset key={s.category} className={sections.length > 1 ? "space-y-6 rounded-xl border border-line p-5" : "contents"}>
          {sections.length > 1 && <legend className="px-1 text-sm font-bold text-ink">{asA(s.category)}</legend>}
          <WorkQuestions questions={s.questions} answers={answers} setAnswer={setAnswer} errors={errors} />
        </fieldset>
      ))}
    </>
  );
}
