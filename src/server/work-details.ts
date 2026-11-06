import { choicesComplete, exclusiveChoices, isOther, OTHER, workQuestionShown, workQuestionsForAll } from "@/content/artist-portal";
import type { WorkDetails } from "@/lib/artist-store";
import { checkDriveLink } from "@/lib/portfolio-links";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strings = (v: unknown, max: number, each: number) => (Array.isArray(v) ? v : []).map((x) => text(x, each)).filter(Boolean).slice(0, max);

// "Your work details": checks an artist's answers against the questions for their categories (only
// the listed choices are kept), shared by the application and the profile editors. A follow-up
// question counts only when its condition is met. `base` holds what the conditions may read
// (the date of birth and area travel with the answers). With `required` false a missing answer is
// just left out (an approved artist whose record has no answers yet); a given one is still checked.
export function cleanWorkDetails(
  category: string,
  otherCategories: string[],
  given: unknown,
  { base = {}, required = true, where = "the Your work details step" }: { base?: WorkDetails; required?: boolean; where?: string } = {},
): { ok: true; details: WorkDetails } | { ok: false; error: string } {
  const answers = (given && typeof given === "object" ? given : {}) as Record<string, unknown>;
  const details: WorkDetails = { ...base };
  for (const q of workQuestionsForAll(category, otherCategories)) {
    // A listed choice, or "Other: <their own words>" when "Other" is listed; "None" stays on its own.
    const choiceOk = (x: string) => !!q.options?.includes(x) || (!!q.options?.includes(OTHER) && isOther(x));
    const keepNoneAlone = (xs: string[]) => (xs.some((x) => exclusiveChoices.includes(x)) ? xs.filter((x) => exclusiveChoices.includes(x)).slice(0, 1) : xs);
    if (!workQuestionShown(q, details)) continue;
    const v = answers[q.id];
    if (q.kind === "link") {
      const raw = text(v, 300);
      if (!raw) {
        if (q.optional || !required) continue;
        return { ok: false, error: `Add "${q.label}" on ${where}.` };
      }
      const link = checkDriveLink(raw);
      if (!link.ok) return { ok: false, error: `"${q.label}": ${link.message}` };
      details[q.id] = link.url;
      continue;
    }
    const answer =
      q.kind === "text"
        ? text(v, 80)
        : q.kind === "long"
          ? text(v, 600)
          : q.kind === "one"
            ? ([text(v, 80)].find(choiceOk) ?? "")
            : keepNoneAlone(strings(v, q.options?.length ?? 0, 80).filter(choiceOk));
    if (!answer.length) {
      if (q.optional || !required) continue;
      return { ok: false, error: `Answer "${q.label}" on ${where}.` };
    }
    if (!choicesComplete([answer].flat())) return { ok: false, error: `"${q.label}": write your own answer for "${OTHER}".` };
    details[q.id] = answer;
  }
  return { ok: true, details };
}
