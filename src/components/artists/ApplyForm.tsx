"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Info, Pencil } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  applySteps,
  bothLinksCategories,
  choicesComplete,
  experienceLevels,
  isOther,
  languages,
  OTHER,
  otherText,
  pickChoices,
  uploadRules,
  withOtherText,
  workQuestionShown,
  workQuestionsForAll,
  workSections,
} from "@/content/artist-portal";
import { categories, cities } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { allCategories } from "@/lib/booking-needs";
import { emptyProfile, modeStore, profileStore, type ArtistProfile } from "@/lib/artist-store";
import { checkDriveLink, checkPortfolioLink } from "@/lib/portfolio-links";
import { sectionLink, siteHref } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";
import { createApplication } from "@/server/actions/public";
import { ArtistPhoto } from "@/components/ui/ArtistPhoto";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { FileDrop, type PickedFile } from "./FileDrop";
import { CheckRow, ChipGroup, Field, inputBase, inputClass } from "./form";
import { LinkEditor } from "./LinkEditor";

type Files = { samples: PickedFile[]; resume: PickedFile[] };

const phoneDigits = (v: string) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
const validPhone = (v: string) => /^[6-9]\d{9}$/.test(phoneDigits(v));
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const BIO_MAX = 600;

type StepId = (typeof applySteps)[number]["id"];
const needsBothLinks = (p: ArtistProfile) => allCategories(p).some((c) => bothLinksCategories.includes(c));
const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
const questionsFor = (p: ArtistProfile) => workQuestionsForAll(p.category, p.otherCategories);
// "As a photographer", "As an editor": the title of each category's questions.
const asA = (slug: string) => {
  const who = categories.find((c) => c.slug === slug)?.singular.toLowerCase() ?? slug;
  return `As ${/^[aeiou]/.test(who) ? "an" : "a"} ${who}`;
};
const isInstagram = (l: string) => /(^|\.)instagram\.com\//i.test(l.replace(/^https?:\/\//, ""));
const answered = (v: string | string[] | undefined) => (Array.isArray(v) ? v.length > 0 : !!v?.trim());

// What's missing on each step. An empty list means the step is complete.
function problems(step: StepId, p: ArtistProfile, files: Files, phoneVerified: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === "about") {
    if (p.fullName.trim().length < 2) e.fullName = "Enter your full name.";
    if (!p.photo.startsWith("data:image/")) e.photo = "Add your profile photo.";
    if (!validPhone(p.phone)) e.phone = "Enter a 10-digit Indian mobile number.";
    else if (!phoneVerified && !backendEnabled) e.phone = "Verify your number with the code.";
    if (backendEnabled && !validEmail(p.email)) e.email = "Enter your email address; AOD replies by email.";
    else if (p.email && !validEmail(p.email)) e.email = "Check your email address.";
    if (!p.city) e.city = "Choose your city.";
  }
  if (step === "craft") {
    if (!p.category) e.category = "Choose what you do.";
    else if (p.services.length === 0) e.services = "Pick at least one service.";
    if (!p.experience) e.experience = "Choose your experience.";
    if (p.languages.length === 0) e.languages = "Pick at least one language.";
  }
  if (step === "work") {
    if (!p.category) e.category = "Choose what you do on the Your craft step first.";
    for (const q of questionsFor(p)) {
      if (q.optional || !workQuestionShown(q, p.work)) continue;
      const given = p.work?.[q.id];
      if (!answered(given)) e[q.id] = q.kind === "link" ? "Add the Google Drive link." : q.kind === "text" || q.kind === "long" ? "Fill this in." : q.kind === "many" ? "Pick at least one." : "Choose one.";
      else if (q.kind === "link") {
        const link = checkDriveLink(String(given));
        if (!link.ok) e[q.id] = link.message;
      }
      else if (!choicesComplete([p.work?.[q.id] ?? []].flat())) e[q.id] = `You picked "${OTHER}": write your own answer in the box.`;
    }
  }
  if (step === "portfolio") {
    if (needsBothLinks(p) && (!p.links.some(isInstagram) || !p.links.some((l) => !isInstagram(l)))) {
      e.samples = "Add both links: your Instagram profile, and a portfolio or showreel link (YouTube or Google Drive).";
    } else if (backendEnabled && p.links.length === 0) {
      e.samples = "Add at least one portfolio link (Instagram, YouTube, Drive…). Uploaded files aren't sent to AOD yet.";
    } else if (files.samples.length < uploadRules.samples.min && p.links.length === 0) {
      e.samples = `Add at least ${uploadRules.samples.min} samples of your work, or at least one portfolio link.`;
    }
  }
  if (step === "verify") {
    if (!p.agreeTerms) e.agreeTerms = "Please accept the terms.";
  }
  return e;
}

// The application, in six steps. Answers are kept in this browser as a draft (so a refresh
// doesn't lose them); files stay in the tab only. Submitting doesn't send anything in the
// preview: it says so, and offers to send the details on WhatsApp, which is how artists join today.
export function ApplyForm() {
  const router = useRouter();
  const profile = profileStore.use() ?? emptyProfile;
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState<Partial<Record<StepId, boolean>>>({});
  const [files, setFiles] = useState<Files>({ samples: [], resume: [] });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null); // live: the saved application's reference
  const [sentTo, setSentTo] = useState(""); // the email it was sent from (the draft is cleared once saved)
  const [saveError, setSaveError] = useState<string | null>(null);

  // A draft left in this browser from before this visit (someone else may be applying now).
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    const d = profileStore.get();
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser's storage, which the server can't see */
    setHasDraft(Boolean(d && (d.fullName.trim() || d.phone.trim() || d.email.trim() || d.category)));
  }, []);
  function startFresh() {
    profileStore.set(null);
    setFiles({ samples: [], resume: [] });
    setPhoneVerified(false);
    setTried({});
    setStep(0);
    setHasDraft(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Merge into the latest saved draft, so quick successive edits never undo each other.
  const set = (patch: Partial<ArtistProfile>) => profileStore.set({ ...(profileStore.get() ?? emptyProfile), ...patch });
  const steps = applySteps;
  const current = steps[Math.min(step, steps.length - 1)];
  const errs = problems(current.id, profile, files, phoneVerified);
  const shown = tried[current.id] ? errs : {};
  const complete = (i: number) => steps[i].id !== "review" && Object.keys(problems(steps[i].id, profile, files, phoneVerified)).length === 0;
  const goTo = (id: StepId) => setStep(Math.max(0, steps.findIndex((s) => s.id === id)));

  function next() {
    setTried((t) => ({ ...t, [current.id]: true }));
    if (Object.keys(errs).length > 0) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const category = categories.find((c) => c.slug === profile.category);

  if (submitted && savedId) {
    return (
      <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-line bg-white p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-6 text-2xl font-bold sm:text-3xl">Application received</h2>
        <p className="mt-3 text-body">
          Your reference is <strong>{savedId}</strong>. AOD&apos;s team reviews every application and will reply by email at {sentTo}.
        </p>
        <p className="mt-3 text-sm text-muted">Sign in to the artist portal with this email to follow your application and add photos to your portfolio.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={sectionLink("/artists")} className="inline-flex h-12 items-center justify-center rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover">
            Sign in to follow it
          </Link>
          <Link href={siteHref("/for-artists")} className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-brand px-6 font-medium text-brand hover:bg-wash">
            Back to For Artists
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    const also = profile.otherCategories.map((s) => categories.find((c) => c.slug === s)?.singular.toLowerCase() ?? s);
    const summary = [
      `Hi Artists on Demand! I want to join AOD as ${category ? `a ${category.singular.toLowerCase()}` : "an artist"}${also.length ? ` (also ${also.join(", ")})` : ""}.`,
      `Name: ${profile.fullName}`,
      `Phone: +91 ${phoneDigits(profile.phone)}`,
      profile.email && `Email: ${profile.email}`,
      `City: ${profile.city}`,
      `Services: ${profile.services.join(", ")}`,
      `Experience: ${profile.experience}`,
      ...questionsFor(profile)
        .filter((q) => workQuestionShown(q, profile.work) && answered(profile.work?.[q.id]))
        .map((q) => `${q.short}: ${[profile.work?.[q.id] ?? ""].flat().join(", ")}`),
      profile.links.length > 0 && `Portfolio: ${profile.links.join(" ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    return (
      <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-line bg-white p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-brand">
          <Info className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-6 text-2xl font-bold sm:text-3xl">Your application is ready, but not sent</h2>
        {saveError ? (
          <p className="mt-3 text-body">{saveError} Nothing has reached AOD yet.</p>
        ) : (
          <p className="mt-3 text-body">
            This portal is a preview, so nothing has been sent to AOD. When it goes live, submitting saves your application and our
            team contacts you on WhatsApp about the next steps.
          </p>
        )}
        <p className="mt-3 text-body">To apply today, send your details to the AOD team on WhatsApp:</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={whatsappUrl(summary)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 font-medium text-white hover:bg-whatsapp-hover"
          >
            <WhatsAppIcon /> Send my details on WhatsApp
          </a>
          <button
            type="button"
            onClick={() => {
              modeStore.set("applicant");
              router.push(sectionLink("/artists/dashboard"));
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-brand px-6 font-medium text-brand hover:bg-wash"
          >
            See the applicant dashboard
          </button>
        </div>
        <button type="button" onClick={() => setSubmitted(false)} className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-ink">
          Back to my application
        </button>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[16rem_1fr] lg:gap-12">
      {/* Steps: a sidebar on laptops, a progress bar on phones. */}
      <nav aria-label="Application steps" className="lg:sticky lg:top-24">
        <p className="text-sm text-muted lg:hidden">
          Step {step + 1} of {steps.length}: <span className="font-medium text-ink">{current.title}</span>
        </p>
        <div className="mt-2 flex gap-1.5 lg:hidden" aria-hidden>
          {steps.map((s, i) => (
            <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
          ))}
        </div>
        <ol className="hidden space-y-1 lg:block">
          {steps.map((s, i) => {
            const done = complete(i) && i < step;
            const now = i === step;
            const reachable = i <= step || steps.slice(0, i).every((_, j) => complete(j));
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => setStep(i)}
                  aria-current={now ? "step" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                    now ? "bg-white shadow-sm ring-1 ring-line" : "hover:bg-white/70"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      done ? "bg-brand text-white" : now ? "bg-peach text-brand-hover" : "bg-white text-muted ring-1 ring-line"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                  </span>
                  <span>
                    <span className={`block text-sm font-medium ${now || done ? "text-ink" : "text-muted"}`}>{s.title}</span>
                    <span className="block text-xs text-muted">{s.text}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 hidden rounded-xl bg-white/70 p-4 text-xs text-muted lg:block">
          Your answers are kept as a draft in this browser until you send them. Photos and files aren&apos;t kept if you refresh.
        </p>
      </nav>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < steps.length - 1) return next();
          if (!backendEnabled) return setSubmitted(true);
          if (sending) return;
          setSending(true);
          setSaveError(null);
          void createApplication({ ...profile, phone: `+91 ${phoneDigits(profile.phone)}`, work: profile.work ?? {} })
            .then((res) => {
              if (res.ok) {
                // Saved: clear this browser's draft, so the next person to apply here (a friend on
                // the same phone) starts with an empty form.
                setSentTo(profile.email);
                setSavedId(res.id);
                profileStore.set(null);
                setFiles({ samples: [], resume: [] });
              }
              else setSaveError(res.error);
              setSubmitted(true);
            })
            .catch(() => {
              setSaveError("Couldn't send your application just now.");
              setSubmitted(true);
            })
            .finally(() => setSending(false));
        }}
        className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_color-mix(in_srgb,var(--color-ink)_6%,transparent)] sm:p-10"
      >
        {hasDraft && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-wash px-4 py-3 text-sm">
            <span className="text-body">
              Filled in on this browser before{profile.fullName.trim() ? ` (${profile.fullName.trim()})` : ""}.
            </span>
            <button type="button" onClick={startFresh} className="font-medium text-brand underline underline-offset-4 hover:text-brand-hover">
              Not you? Start a fresh application
            </button>
          </div>
        )}
        <h2 className="text-2xl font-bold sm:text-[2rem] sm:leading-tight">{current.title}</h2>
        <p className="mt-2 text-sm text-muted">{current.text}</p>

        <div className="mt-8 space-y-6">
          {current.id === "about" && (
            <AboutStep
              profile={profile}
              set={set}
              errors={shown}
              phoneVerified={phoneVerified}
              setPhoneVerified={setPhoneVerified}
            />
          )}
          {current.id === "craft" && <CraftStep profile={profile} set={set} errors={shown} />}
          {current.id === "work" && <WorkStep profile={profile} set={set} errors={shown} />}
          {current.id === "portfolio" && <PortfolioStep profile={profile} set={set} errors={shown} files={files} setFiles={setFiles} />}
          {current.id === "verify" && <VerifyStep profile={profile} set={set} errors={shown} />}
          {current.id === "review" && <ReviewStep profile={profile} files={files} goTo={goTo} />}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </button>
          ) : (
            <Link href={sectionLink("/artists")} className="text-sm font-medium text-muted hover:text-ink">
              Already with AOD? Sign in
            </Link>
          )}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover disabled:cursor-wait"
          >
            {step < steps.length - 1 ? (
              <>
                Continue <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            ) : sending ? (
              <>
                <Spinner /> Sending your application…
              </>
            ) : (
              "Submit application"
            )}
          </button>
        </div>
        {tried[current.id] && Object.keys(errs).length > 0 && (
          <p className="mt-3 text-right text-sm text-red-600" role="alert">
            Fill in the highlighted fields to continue.
          </p>
        )}
      </form>
    </div>
  );
}

type StepProps = { profile: ArtistProfile; set: (patch: Partial<ArtistProfile>) => void; errors: Record<string, string> };

function AboutStep({
  profile,
  set,
  errors,
  phoneVerified,
  setPhoneVerified,
}: StepProps & { phoneVerified: boolean; setPhoneVerified: (v: boolean) => void }) {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  return (
    <>
      <Field label="Full name" error={errors.fullName} hint="As on your ID.">
        <input
          value={profile.fullName}
          onChange={(e) => set({ fullName: e.target.value })}
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          className={inputClass}
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Profile photo</p>
        <PhotoPicker name={profile.fullName} src={profile.photo} onPick={(photo) => set({ photo })} error={errors.photo} />
      </div>

      <div>
        <Field label="Mobile number (WhatsApp preferred)" error={errors.phone}>
          <div className="mt-1.5 flex gap-2">
            <div className="flex flex-1">
              <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-wash px-3 text-sm text-muted">+91</span>
              <input
                value={profile.phone}
                onChange={(e) => {
                  set({ phone: e.target.value });
                  setPhoneVerified(false);
                  setCodeSent(false);
                }}
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="98250 12345"
                aria-invalid={!!errors.phone}
                className={`${inputBase} rounded-l-none`}
              />
            </div>
            {backendEnabled ? null : phoneVerified ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-4 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Verified
              </span>
            ) : (
              <button
                type="button"
                disabled={!validPhone(profile.phone)}
                onClick={() => {
                  setCodeSent(true);
                  setCode("");
                  setCodeError(null);
                }}
                className="shrink-0 rounded-xl border border-brand px-4 text-sm font-medium text-brand hover:bg-wash disabled:cursor-not-allowed disabled:border-line disabled:text-muted"
              >
                {codeSent ? "Resend code" : "Send code"}
              </button>
            )}
          </div>
        </Field>
        {!backendEnabled && codeSent && !phoneVerified && (
          <div className="mt-3 rounded-xl bg-wash p-4">
            <label className="block text-sm font-medium text-ink">
              Code sent on WhatsApp
              <div className="mt-1.5 flex gap-2">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setCodeError(null);
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6 digits"
                  aria-invalid={!!codeError}
                  className={`${inputBase} max-w-[12rem] tracking-[0.3em]`}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (/^\d{6}$/.test(code)) setPhoneVerified(true);
                    else setCodeError("Enter the 6-digit code.");
                  }}
                  className="rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
                >
                  Verify
                </button>
              </div>
            </label>
            {codeError && <p className="mt-1.5 text-xs text-red-600">{codeError}</p>}
            <p className="mt-2 text-xs text-muted">Preview: no code is actually sent. Any 6 digits work.</p>
          </div>
        )}
      </div>

      <Field label="Email" optional={!backendEnabled} error={errors.email}>
        <input
          value={profile.email}
          onChange={(e) => set({ email: e.target.value })}
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          className={inputClass}
        />
      </Field>

      <Field label="Your city" error={errors.city}>
        <select
          value={profile.city}
          onChange={(e) => set({ city: e.target.value })}
          aria-invalid={!!errors.city}
          className={inputClass}
        >
          <option value="">Choose…</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
          <option value="Other city in Gujarat">Other city in Gujarat</option>
        </select>
      </Field>
    </>
  );
}

function CraftStep({ profile, set, errors }: StepProps) {
  const chosen = allCategories(profile).map((slug) => categories.find((c) => c.slug === slug)).filter((c) => c !== undefined);
  // Services stay picked only while one of the chosen categories offers them.
  const keepServices = (slugs: string[]) => {
    const offered = new Set(categories.filter((c) => slugs.includes(c.slug)).flatMap((c) => c.services.map((s) => s.name)));
    return profile.services.filter((s) => offered.has(s));
  };
  return (
    <>
      <div>
        <p className="text-sm font-medium text-ink">What do you mainly do?</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => {
            const on = c.slug === profile.category;
            const others = profile.otherCategories.filter((x) => x !== c.slug);
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ category: c.slug, otherCategories: others, services: keepServices([c.slug, ...others]) })}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    on ? "border-brand bg-peach/50 font-medium text-ink" : "border-line text-body hover:border-brand/50"
                  }`}
                >
                  <Icon name={c.icon} className="h-4 w-4 shrink-0 text-brand" /> {c.name}
                </button>
              </li>
            );
          })}
        </ul>
        {errors.category && <p className="mt-1.5 text-xs text-red-600">{errors.category}</p>}
      </div>

      {profile.category && (
        <div>
          <p className="text-sm font-medium text-ink">
            Do you also work as any of these? <span className="font-normal text-muted">(optional)</span>
          </p>
          <p className="mt-1 text-xs text-muted">Pick every other kind of work you take on. AOD can then offer you bookings for each.</p>
          <div role="group" aria-label="Other categories" className="mt-2 flex flex-wrap gap-2">
            {categories
              .filter((c) => c.slug !== profile.category)
              .map((c) => {
                const on = profile.otherCategories.includes(c.slug);
                const others = on ? profile.otherCategories.filter((x) => x !== c.slug) : [...profile.otherCategories, c.slug];
                return (
                  <button
                    key={c.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ otherCategories: others, services: keepServices([profile.category, ...others]) })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      on ? "border-brand bg-peach/50 text-ink" : "border-line bg-white text-body hover:border-brand/50"
                    }`}
                  >
                    {on ? <Check className="h-3.5 w-3.5 text-brand" aria-hidden /> : <Icon name={c.icon} className="h-3.5 w-3.5 text-brand" />}
                    {c.name}
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {chosen.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink">Services you offer</p>
          {chosen.map((c) => (
            <div key={c.slug} className={chosen.length > 1 ? "mt-3" : ""}>
              {chosen.length > 1 && <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.name}</p>}
              <ChipGroup label={`${c.name} services`} options={c.services.map((s) => s.name)} value={profile.services} onChange={(services) => set({ services })} />
            </div>
          ))}
          {errors.services && <p className="mt-1.5 text-xs text-red-600">{errors.services}</p>}
        </div>
      )}

      <Field label="Experience" error={errors.experience} className="sm:max-w-sm">
        <select value={profile.experience} onChange={(e) => set({ experience: e.target.value })} aria-invalid={!!errors.experience} className={inputClass}>
          <option value="">Choose…</option>
          {experienceLevels.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>

      <div>
        <p className="text-sm font-medium text-ink">Languages you speak with clients</p>
        <ChipGroup label="Languages" options={languages} value={profile.languages} onChange={(l) => set({ languages: l })} />
        {errors.languages && <p className="mt-1.5 text-xs text-red-600">{errors.languages}</p>}
      </div>


      <Field
        label="About your work"
        optional
        error={errors.bio}
        hint={`${profile.bio.trim().length}/${BIO_MAX} characters. Your style, the events you love, your gear or team.`}
      >
        <textarea
          value={profile.bio}
          onChange={(e) => set({ bio: e.target.value.slice(0, BIO_MAX) })}
          rows={5}
          aria-invalid={!!errors.bio}
          className={`${inputClass} resize-none`}
        />
      </Field>
    </>
  );
}

// The questions for the applicant's categories (workQuestions in artist-portal.ts), a section for
// each when they work in more than one.
function WorkStep({ profile, set, errors }: StepProps) {
  const d = profile.work ?? {};
  // Merge into the latest saved answers, like `set`, so quick successive taps never undo each other.
  const setAnswer = (id: string, v: string | string[]) => set({ work: { ...(profileStore.get()?.work ?? {}), [id]: v } });
  if (!profile.category) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.category ?? "Choose what you do on the Your craft step first."}</p>;
  const sections = workSections(profile.category, profile.otherCategories).filter((s) => s.questions.length > 0);
  return (
    <>
      {sections.map((s) => (
        <fieldset key={s.category} className={sections.length > 1 ? "space-y-6 rounded-xl border border-line p-5" : "contents"}>
          {sections.length > 1 && <legend className="px-1 text-sm font-bold text-ink">{asA(s.category)}</legend>}
          <WorkQuestions questions={s.questions} answers={d} setAnswer={setAnswer} errors={errors} />
        </fieldset>
      ))}
    </>
  );
}

function WorkQuestions({
  questions,
  answers: d,
  setAnswer,
  errors,
}: {
  questions: ReturnType<typeof workQuestionsForAll>;
  answers: NonNullable<ArtistProfile["work"]>;
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

function PortfolioStep({
  profile,
  set,
  errors,
  files,
  setFiles,
}: StepProps & { files: Files; setFiles: (f: (prev: Files) => Files) => void }) {
  return (
    <>
      <div>
        <p className="text-sm font-medium text-ink">Samples of your work</p>
        <p className="mt-1 text-xs text-muted">Pick your best. The first one is your cover; use the star to change it.</p>
        <FileDrop
          label="Samples of your work"
          multiple
          files={files.samples}
          onChange={(samples) => setFiles((f) => ({ ...f, samples }))}
          limits={uploadRules.samples}
          hint={uploadRules.samples.hint}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-ink">Portfolio links</p>
        <p className="mt-1 text-xs text-muted">
          {needsBothLinks(profile)
            ? "Both are needed: your Instagram profile, and a portfolio or showreel link (YouTube or Google Drive). Each link is checked as you add it."
            : "Instagram, YouTube or Google Drive links only. Each link is checked as you add it."}
        </p>
        <LinkEditor links={profile.links} onChange={(links) => set({ links })} />
      </div>
      {errors.samples && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {errors.samples}
        </p>
      )}

      <div>
        <p className="text-sm font-medium text-ink">
          Resume or work profile <span className="font-normal text-muted">(optional)</span>
        </p>
        <FileDrop
          label="Resume"
          variant="single"
          files={files.resume}
          onChange={(resume) => setFiles((f) => ({ ...f, resume }))}
          limits={uploadRules.resume}
          hint={uploadRules.resume.hint}
        />
      </div>
    </>
  );
}

function VerifyStep({ profile, set, errors }: StepProps) {
  return (
    <>
      <div className="space-y-3 rounded-xl border border-line p-5">
        <CheckRow checked={profile.agreeTerms} onChange={(agreeTerms) => set({ agreeTerms })}>
          I agree to the AOD{" "}
          <a href={siteHref("/terms")} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline underline-offset-2">
            terms
          </a>{" "}
          and{" "}
          <a href={siteHref("/privacy")} target="_blank" rel="noopener noreferrer" className="font-medium text-brand underline underline-offset-2">
            privacy policy
          </a>
          . I confirm that all the information above is true and the work I&apos;ve shared is my own, and I agree to
          collaborate with AOD as per mutual understanding.
        </CheckRow>
        {errors.agreeTerms && <p className="pl-7 text-xs text-red-600">{errors.agreeTerms}</p>}
      </div>
    </>
  );
}

function ReviewStep({ profile, files, goTo }: { profile: ArtistProfile; files: Files; goTo: (step: StepId) => void }) {
  const rows: { step: StepId; title: string; items: [string, ReactNode][] }[] = [
    {
      step: "about",
      title: "About you",
      items: [
        ["Name", profile.fullName],
        ["Photo", <ArtistPhoto key="photo" name={profile.fullName} src={profile.photo} className="h-12 w-12 text-sm" alt="Your profile photo" />],
        ["Mobile", `+91 ${phoneDigits(profile.phone)}`],
        ["Email", profile.email || "—"],
        ["City", profile.city],
      ],
    },
    {
      step: "craft",
      title: "Your craft",
      items: [
        ["Category", profile.category ? categoryName(profile.category) : "—"],
        ["Also works as", profile.otherCategories.map(categoryName).join(", ") || "—"],
        ["Services", profile.services.join(", ")],
        ["Experience", profile.experience],
        ["Languages", profile.languages.join(", ")],
        ["About", profile.bio || "—"],
      ],
    },
    {
      step: "work",
      title: "Your work details",
      items: questionsFor(profile)
        .filter((q) => workQuestionShown(q, profile.work) && (!q.optional || answered(profile.work?.[q.id])))
        .map((q): [string, ReactNode] => [q.short, [profile.work?.[q.id] ?? "—"].flat().join(", ") || "—"]),
    },
    {
      step: "portfolio",
      title: "Portfolio",
      items: [
        ["Samples", `${files.samples.length} file${files.samples.length === 1 ? "" : "s"}`],
        [
          "Links",
          profile.links.length ? (
            <ul className="space-y-0.5">
              {profile.links.map((l) => {
                const c = checkPortfolioLink(l);
                return <li key={l}>{c.ok ? c.label : l}</li>;
              })}
            </ul>
          ) : (
            "—"
          ),
        ],
        ["Resume", files.resume[0]?.file.name ?? "—"],
      ],
    },
    {
      step: "verify",
      title: "Verification",
      items: [
        ["Agreements", profile.agreeTerms ? "Accepted" : "Not accepted"],
      ],
    },
  ];

  return (
    <>
      {rows.map((r) => (
        <div key={r.title} className="rounded-xl border border-line p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-ink font-bold">{r.title}</h3>
            <button type="button" onClick={() => goTo(r.step)} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover">
              <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
            </button>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
            {r.items.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </>
  );
}
