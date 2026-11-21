"use client";

import { useState } from "react";
import { OTHER, isOther, kindName, kindOf, kinds, languages, otherText, serviceOptions, toggleChoice, withOtherText, workQuestionShown, workQuestions, type WorkQuestion } from "@/data/work-questions";
import { act, catName, type AppDetails, type Application } from "@/lib/app-db";
import { checkDriveLink } from "@/lib/portfolio-links";
import { useMainSiteHref } from "@/components/ui/MainSiteLink";
import { btn, btnInk, btnMain, field, label } from "../ui";

// Complete Your Details: everything aod.co.in's application asked that the 2-step sign-up didn't,
// asked in the artist portal once the account is made (on request, 2026-11-21, from aod-old):
// a photo (chosen or taken), date of birth (18 or older), area, languages, what they mainly do and
// what else they do (Photographer, Cinematographer, Anchor / Host…), the services they offer, each
// of those kinds' own questions (work-questions.ts), about their work and the declaration in the
// forms' wording. Save keeps it; Submit For Review sends it to the team. Test mode: nothing is
// required.

const ABOUT_MAX = 500;

// The photo, shrunk in the browser so it fits in this browser's storage.
function shrink(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size = 240;
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      resolve(c.toDataURL("image/webp", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve("");
    img.src = URL.createObjectURL(file);
  });
}

// 18 or older on the given date of birth (YYYY-MM-DD).
function adult(dob: string) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return false;
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return d <= limit;
}

export function completeness(app: Application) {
  const d = app.details ?? {};
  const checks = [!!d.photo, !!d.dob, !!d.area, !!d.languages?.length, !!d.services?.length, !!d.about, !!d.agree, Object.keys(d.work ?? {}).length > 0];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// A picked chip has the black outline, as elsewhere in the portal.
const chip = (on: boolean) => (on ? btnInk : btn);

export function CompleteProfile({ app }: { app: Application }) {
  const [d, setD] = useState<AppDetails>(app.details ?? {});
  const [saved, setSaved] = useState(false);
  const site = useMainSiteHref().replace(/\/$/, "");
  const work = d.work ?? {};
  const main = d.kind && workQuestions[d.kind] ? d.kind : kindOf(app.craft, app.cat);
  const others = (d.other ?? []).filter((k) => workQuestions[k] && k !== main);
  const mine = [main, ...others];
  const update = (patch: AppDetails) => {
    setD((x) => ({ ...x, ...patch }));
    setSaved(false);
  };
  const toggleIn = (list: string[] | undefined, v: string) => ((list ?? []).includes(v) ? (list ?? []).filter((x) => x !== v) : [...(list ?? []), v]);
  const setAnswer = (key: string, v: string | string[]) => update({ work: { ...work, [key]: v } });
  const pct = completeness({ ...app, details: d });
  const tooYoung = !!d.dob && !adult(d.dob);
  const save = () => act.saveAppDetails(app.id, { ...d, kind: main, other: others }, app.name);

  return (
    <>
      <div className="border-b border-line pb-7">
        <h1 className="text-[34px]">Complete Your Details</h1>
        <p className="mt-2 text-muted">{pct}% complete. The team reviews it once you submit.</p>
        <div className="mt-4 h-1 max-w-sm rounded-full bg-line">
          <i className="block h-full rounded-full bg-ink" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <dl className="mt-8 grid max-w-2xl gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
        {(
          [
            ["Name", app.name],
            ["Email", app.email],
            ["Phone", app.phone],
            ["Location", app.city],
            ["Category", catName(app.cat)],
            ["Experience", app.experience ?? ""],
            ["Instagram", app.instagram ? `instagram.com/${app.instagram}` : ""],
            ["Portfolio", app.link ?? ""],
          ] as [string, string][]
        ).map(([k, v]) => (
          <div key={k} className="border-t border-line pt-2">
            <dt className="text-muted">{k}</dt>
            <dd className="break-words">{v || "—"}</dd>
          </div>
        ))}
      </dl>

      <form
        className="mt-10 max-w-2xl space-y-10"
        onSubmit={(e) => {
          e.preventDefault();
          save();
          setSaved(true);
        }}
      >
        <section className="space-y-6">
          <h2 className="text-2xl">About You</h2>
          <div>
            <span className={label}>Profile Photo</span>
            <div className="flex items-center gap-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-wash text-xs text-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local photo the artist just picked */}
                {d.photo ? <img src={d.photo} alt="" className="h-full w-full object-cover" /> : "Photo"}
              </span>
              <div className="flex flex-wrap gap-2">
                <label className={`${btn} cursor-pointer`}>
                  Choose From Gallery
                  <input type="file" accept="image/*" className="sr-only" onChange={async (e) => e.target.files?.[0] && update({ photo: await shrink(e.target.files[0]) })} />
                </label>
                <label className={`${btn} cursor-pointer`}>
                  Take A Photo
                  <input type="file" accept="image/*" capture="user" className="sr-only" onChange={async (e) => e.target.files?.[0] && update({ photo: await shrink(e.target.files[0]) })} />
                </label>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={label}>Date Of Birth</span>
              <input type="date" value={d.dob ?? ""} onChange={(e) => update({ dob: e.target.value })} className={field} />
              <span className={`mt-1.5 block text-[13px] ${tooYoung ? "text-red-600" : "text-muted"}`}>You need to be 18 or older.</span>
            </label>
            <label>
              <span className={label}>Area Of Your City</span>
              <input value={d.area ?? ""} onChange={(e) => update({ area: e.target.value })} placeholder="Navrangpura" className={field} />
            </label>
          </div>
          <div>
            <span className={label}>Languages You Speak</span>
            <div className="flex flex-wrap gap-2">
              {languages.map((x) => {
                const on = (d.languages ?? []).includes(x);
                return (
                  <button key={x} type="button" aria-pressed={on} onClick={() => update({ languages: toggleIn(d.languages, x) })} className={chip(on)}>
                    {x}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* What they mainly do, what else, and the services they offer. */}
        <section className="space-y-6 border-t border-line pt-8">
          <h2 className="text-2xl">Your Craft</h2>
          <div>
            <span className={label}>What Do You Mainly Do?</span>
            <div className="flex flex-wrap gap-2">
              {kinds.map((k) => (
                <button key={k.id} type="button" aria-pressed={main === k.id} onClick={() => update({ kind: k.id, other: others.filter((o) => o !== k.id) })} className={chip(main === k.id)}>
                  {k.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={label}>Do You Also Work As (Optional)</span>
            <div className="flex flex-wrap gap-2">
              {kinds
                .filter((k) => k.id !== main)
                .map((k) => {
                  const on = others.includes(k.id);
                  return (
                    <button key={k.id} type="button" aria-pressed={on} onClick={() => update({ other: toggleIn(others, k.id) })} className={chip(on)}>
                      {k.name}
                    </button>
                  );
                })}
            </div>
          </div>
          <div>
            <span className={label}>Services You Offer</span>
            <div className="space-y-5">
              {mine.map((k) => {
                const list = serviceOptions(k);
                const all = list.length > 0 && list.every((s) => (d.services ?? []).includes(s));
                return (
                  <div key={k}>
                    {mine.length > 1 && <p className="mb-2 text-sm font-medium">{kindName(k)}</p>}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        aria-pressed={all}
                        onClick={() => update({ services: all ? (d.services ?? []).filter((s) => !list.includes(s)) : [...new Set([...(d.services ?? []), ...list])] })}
                        className={chip(all)}
                      >
                        Select All
                      </button>
                      {list.map((s) => {
                        const on = (d.services ?? []).includes(s);
                        return (
                          <button key={s} type="button" aria-pressed={on} onClick={() => update({ services: toggleIn(d.services, s) })} className={chip(on)}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Each kind's own questions, a section each. */}
        {mine.map((k) => {
          const answers = Object.fromEntries(Object.entries(work).filter(([key]) => key.startsWith(`${k}.`)).map(([key, v]) => [key.slice(k.length + 1), v]));
          return (
            <section key={k} className="space-y-6 border-t border-line pt-8">
              <h2 className="text-2xl">Your Work: {kindName(k)}</h2>
              {workQuestions[k].map((q) => (workQuestionShown(q, answers) ? <Question key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswer(`${k}.${q.id}`, v)} /> : null))}
            </section>
          );
        })}

        <section className="space-y-6 border-t border-line pt-8">
          <label className="block">
            <span className={label}>About Your Work (Optional)</span>
            <textarea value={d.about ?? ""} onChange={(e) => update({ about: e.target.value.slice(0, ABOUT_MAX) })} rows={4} className={`${field} h-auto py-2`} />
            <span className="mt-1.5 block text-[13px] text-muted">
              {(d.about ?? "").trim().length}/{ABOUT_MAX} characters. Your style, the events you love, your gear or team.
            </span>
          </label>
          {/* The declaration, in the registration forms' wording (as on aod.co.in). */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4 has-[:checked]:border-ink">
            <input type="checkbox" checked={!!d.agree} onChange={(e) => update({ agree: e.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-[var(--ink)]" />
            <span>
              I agree to the AOD{" "}
              <a href={`${site}/terms`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                terms
              </a>{" "}
              and{" "}
              <a href={`${site}/privacy`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                privacy policy
              </a>
              . I confirm that all the information above is true and the work I&apos;ve shared is my own, and I agree to collaborate with AOD as per mutual understanding.
            </span>
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <button className={btnInk}>Save</button>
          <button
            type="button"
            onClick={() => {
              save();
              act.submitForReview(app.id, app.name);
              setSaved(true);
            }}
            className={btnMain}
          >
            {app.submittedAt ? "Send Update To AOD" : "Submit For Review"}
          </button>
          {saved && <span className="text-sm text-muted">Saved.</span>}
        </div>
      </form>
    </>
  );
}

// One work question: chips for "one" and "many" ("Other" opens a box for their own words), a line,
// a few lines, or a Google Drive link (checked as they type).
function Question({ q, value, onChange }: { q: WorkQuestion; value: string | string[] | undefined; onChange: (v: string | string[]) => void }) {
  const picked = q.kind === "many" ? ((value as string[] | undefined) ?? []) : value ? [value as string] : [];
  const otherOn = picked.some(isOther);
  const text = typeof value === "string" ? value : "";
  const drive = q.kind === "link" && text.trim() ? checkDriveLink(text) : null;
  return (
    <div>
      <span className={label}>
        {q.label}
        {q.optional && " (Optional)"}
      </span>
      {q.kind === "one" || q.kind === "many" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {q.options!.map((o) => {
              const on = o === OTHER ? otherOn : picked.includes(o);
              return (
                <button key={o} type="button" aria-pressed={on} onClick={() => onChange(q.kind === "many" ? toggleChoice(picked, o) : o === OTHER && otherOn ? picked[0] : o)} className={chip(on)}>
                  {o}
                </button>
              );
            })}
          </div>
          {otherOn && (
            <input
              value={otherText(picked)}
              onChange={(e) => {
                const own = withOtherText(e.target.value);
                onChange(q.kind === "many" ? picked.map((p) => (isOther(p) ? own : p)) : own);
              }}
              placeholder="Write your own"
              aria-label={`${q.label}: your own answer`}
              className={`${field} mt-3 max-w-md`}
            />
          )}
        </>
      ) : q.kind === "long" ? (
        <textarea value={text} onChange={(e) => onChange(e.target.value)} rows={3} className={`${field} h-auto py-2`} />
      ) : (
        <input value={text} onChange={(e) => onChange(e.target.value)} inputMode={q.kind === "link" ? "url" : undefined} placeholder={q.kind === "link" ? "drive.google.com/…" : undefined} className={field} />
      )}
      {q.hint && <span className="mt-1.5 block text-[13px] text-muted">{q.hint}</span>}
      {drive && <span className={`mt-1.5 block text-[13px] ${drive.ok ? "text-muted" : "text-red-600"}`}>{drive.ok ? (drive.warning ?? "Looks good.") : drive.message}</span>}
    </div>
  );
}
