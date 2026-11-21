import { isOther, OTHER, workQuestionShown, workQuestions } from "@/data/work-questions";
import type { WorkDetails } from "@/lib/artist-store";
import { checkDriveLink } from "@/lib/portfolio-links";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const strings = (v: unknown, max: number, each: number) => (Array.isArray(v) ? v : []).map((x) => text(x, each)).filter(Boolean).slice(0, max);

// "Your Work" answers from the artist portal's Complete Your Details (src/components/dash/portal/
// CompleteProfile.tsx): each kind of artist's own questions (src/data/work-questions.ts), saved by
// "<kind>.<question id>". Only the listed choices are kept ("Other: <their words>" where Other is
// listed; "None" on its own). A follow-up question counts only when its condition is met. With
// `required` false a missing answer is left out (saving a draft); with true every required
// question must be answered (Submit For Review).
export function cleanWorkDetails(kinds: string[], given: unknown, required = false): { ok: true; work: WorkDetails } | { ok: false; error: string } {
  const all = (given && typeof given === "object" ? given : {}) as Record<string, unknown>;
  const work: WorkDetails = {};
  for (const kind of kinds) {
    const questions = workQuestions[kind];
    if (!questions) continue;
    const answers: WorkDetails = {};
    for (const q of questions) {
      if (!workQuestionShown(q, answers)) continue;
      const v = all[`${kind}.${q.id}`];
      const choiceOk = (x: string) => !!q.options?.includes(x) || (!!q.options?.includes(OTHER) && isOther(x));
      let answer: string | string[];
      if (q.kind === "link") {
        const raw = text(v, 300);
        if (raw) {
          const link = checkDriveLink(raw);
          if (!link.ok) return { ok: false, error: `"${q.label}": ${link.message}` };
          answer = link.url;
        } else answer = "";
      } else if (q.kind === "text") answer = text(v, 80);
      else if (q.kind === "long") answer = text(v, 600);
      else if (q.kind === "one") answer = [text(v, 80)].find(choiceOk) ?? "";
      else {
        const picked = strings(v, q.options?.length ?? 0, 80).filter(choiceOk);
        answer = picked.includes("None") ? ["None"] : picked;
      }
      if (!answer.length) {
        if (required && !q.optional) return { ok: false, error: `Answer "${q.label}" in Your Work.` };
        continue;
      }
      if ([answer].flat().includes(OTHER)) return { ok: false, error: `"${q.label}": write your own answer for "${OTHER}".` };
      answers[q.id] = answer;
      work[`${kind}.${q.id}`] = answer;
    }
  }
  return { ok: true, work };
}
