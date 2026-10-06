"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Info, Pencil } from "lucide-react";
import { useState, type ReactNode } from "react";
import { applySteps, experienceLevels, languages, uploadRules } from "@/content/artist-portal";
import { categories, cities } from "@/content/site";
import { emptyProfile, modeStore, profileStore, type ArtistProfile } from "@/lib/artist-store";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { whatsappUrl } from "@/lib/whatsapp";
import { Icon, WhatsAppIcon } from "@/components/ui/Icon";
import { DigiLockerCard } from "./DigiLockerCard";
import { FileDrop, type PickedFile } from "./FileDrop";
import { CheckRow, ChipGroup, Field, inputBase, inputClass } from "./form";
import { LinkEditor } from "./LinkEditor";

type Files = { samples: PickedFile[]; resume: PickedFile[]; gst: PickedFile[] };

const phoneDigits = (v: string) => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
const validPhone = (v: string) => /^[6-9]\d{9}$/.test(phoneDigits(v));
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const BIO_MIN = 40;
const BIO_MAX = 600;

// What's missing on each step. An empty list means the step is complete.
function problems(step: number, p: ArtistProfile, files: Files, phoneVerified: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (step === 0) {
    if (p.fullName.trim().length < 2) e.fullName = "Enter your full name.";
    if (!validPhone(p.phone)) e.phone = "Enter a 10-digit Indian mobile number.";
    else if (!phoneVerified) e.phone = "Verify your number with the code.";
    if (p.email && !validEmail(p.email)) e.email = "Check your email address.";
    if (!p.city) e.city = "Choose your city.";
  }
  if (step === 1) {
    if (!p.category) e.category = "Choose what you do.";
    else if (p.services.length === 0) e.services = "Pick at least one service.";
    if (!p.experience) e.experience = "Choose your experience.";
    if (p.languages.length === 0) e.languages = "Pick at least one language.";
    if (p.bio.trim().length < BIO_MIN) e.bio = `Write at least ${BIO_MIN} characters about your work.`;
  }
  if (step === 2) {
    if (files.samples.length < uploadRules.samples.min && p.links.length === 0) {
      e.samples = `Add at least ${uploadRules.samples.min} samples of your work, or at least one portfolio link.`;
    }
  }
  if (step === 3) {
    if (!p.agreeTerms) e.agreeTerms = "Please accept the terms.";
  }
  return e;
}

// The application, in five steps. Answers are kept in this browser as a draft (so a refresh
// doesn't lose them); files stay in the tab only. Submitting doesn't send anything in the
// preview: it says so, and offers to send the details on WhatsApp, which is how artists join today.
export function ApplyForm() {
  const router = useRouter();
  const profile = profileStore.use() ?? emptyProfile;
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState<Record<number, boolean>>({});
  const [files, setFiles] = useState<Files>({ samples: [], resume: [], gst: [] });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Merge into the latest saved draft, so quick successive edits never undo each other.
  const set = (patch: Partial<ArtistProfile>) => profileStore.set({ ...(profileStore.get() ?? emptyProfile), ...patch });
  const errs = problems(step, profile, files, phoneVerified);
  const shown = tried[step] ? errs : {};
  const complete = (i: number) => i < 4 && Object.keys(problems(i, profile, files, phoneVerified)).length === 0;

  function next() {
    setTried((t) => ({ ...t, [step]: true }));
    if (Object.keys(errs).length > 0) return;
    setStep((s) => Math.min(s + 1, applySteps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const category = categories.find((c) => c.slug === profile.category);

  if (submitted) {
    const summary = [
      `Hi Artists on Demand! I want to join AOD as ${category ? `a ${category.singular.toLowerCase()}` : "an artist"}.`,
      `Name: ${profile.fullName}`,
      `Phone: +91 ${phoneDigits(profile.phone)}`,
      profile.email && `Email: ${profile.email}`,
      `City: ${profile.city}`,
      `Services: ${profile.services.join(", ")}`,
      `Experience: ${profile.experience}`,
      profile.links.length > 0 && `Portfolio: ${profile.links.join(" ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    return (
      <div className="mx-auto max-w-2xl rounded-[1.5rem] border border-line bg-white p-6 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-peach text-brand">
          <Info className="h-7 w-7" aria-hidden />
        </span>
        <h2 className="mt-6 text-2xl font-normal sm:text-3xl">Your application is ready, but not sent</h2>
        <p className="mt-3 text-body">
          This portal is a preview, so nothing has been sent to AOD. When it goes live, submitting saves your application and our
          team contacts you on WhatsApp about the next steps.
        </p>
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
              router.push("/artists/dashboard");
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
          Step {step + 1} of {applySteps.length}: <span className="font-medium text-ink">{applySteps[step].title}</span>
        </p>
        <div className="mt-2 flex gap-1.5 lg:hidden" aria-hidden>
          {applySteps.map((s, i) => (
            <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
          ))}
        </div>
        <ol className="hidden space-y-1 lg:block">
          {applySteps.map((s, i) => {
            const done = complete(i) && i < step;
            const now = i === step;
            const reachable = i <= step || applySteps.slice(0, i).every((_, j) => complete(j));
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
          Your answers are kept as a draft in this browser. Photos and files aren&apos;t kept if you refresh.
        </p>
      </nav>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < applySteps.length - 1) next();
          else setSubmitted(true);
        }}
        className="rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(38,18,0,0.06)] sm:p-10"
      >
        <h2 className="text-2xl font-normal sm:text-[2rem] sm:leading-tight">{applySteps[step].title}</h2>
        <p className="mt-2 text-sm text-muted">{applySteps[step].text}</p>

        <div className="mt-8 space-y-6">
          {step === 0 && (
            <AboutStep profile={profile} set={set} errors={shown} phoneVerified={phoneVerified} setPhoneVerified={setPhoneVerified} />
          )}
          {step === 1 && <CraftStep profile={profile} set={set} errors={shown} />}
          {step === 2 && <PortfolioStep profile={profile} set={set} errors={shown} files={files} setFiles={setFiles} />}
          {step === 3 && <VerifyStep profile={profile} set={set} errors={shown} files={files} setFiles={setFiles} />}
          {step === 4 && <ReviewStep profile={profile} files={files} goTo={setStep} />}
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
            <Link href="/artists" className="text-sm font-medium text-muted hover:text-ink">
              Already with AOD? Sign in
            </Link>
          )}
          <button type="submit" className="inline-flex h-12 items-center gap-2 rounded-lg bg-brand px-6 font-medium text-white hover:bg-brand-hover">
            {step < applySteps.length - 1 ? (
              <>
                Continue <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            ) : (
              "Submit application"
            )}
          </button>
        </div>
        {tried[step] && Object.keys(errs).length > 0 && (
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
        <Field label="Mobile number (WhatsApp)" error={errors.phone}>
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
            {phoneVerified ? (
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
        {codeSent && !phoneVerified && (
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

      <Field label="Email" optional error={errors.email}>
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
  const category = categories.find((c) => c.slug === profile.category);
  return (
    <>
      <div>
        <p className="text-sm font-medium text-ink">What do you do?</p>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {categories.map((c) => {
            const on = c.slug === profile.category;
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ category: c.slug, services: on ? profile.services : [] })}
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

      {category && (
        <div>
          <p className="text-sm font-medium text-ink">Services you offer</p>
          <ChipGroup label="Services" options={category.services.map((s) => s.name)} value={profile.services} onChange={(services) => set({ services })} />
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
        <p className="mt-1 text-xs text-muted">Instagram, YouTube, Vimeo, Behance, Google Drive or your website. Each link is checked as you add it.</p>
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

function VerifyStep({
  profile,
  set,
  errors,
  files,
  setFiles,
}: StepProps & { files: Files; setFiles: (f: (prev: Files) => Files) => void }) {
  return (
    <>
      <div>
        <p className="mb-2 text-sm font-medium text-ink">
          Identity <span className="font-normal text-muted">(now or later, before you go live)</span>
        </p>
        <DigiLockerCard />
      </div>

      <div>
        <p className="text-sm font-medium text-ink">
          GST certificate <span className="font-normal text-muted">(optional)</span>
        </p>
        <FileDrop
          label="GST certificate"
          variant="single"
          files={files.gst}
          onChange={(gst) => setFiles((f) => ({ ...f, gst }))}
          limits={uploadRules.gst}
          hint={uploadRules.gst.hint}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-line p-5">
        <CheckRow checked={profile.agreeTerms} onChange={(agreeTerms) => set({ agreeTerms })}>
          I agree to the AOD artist terms and privacy policy{" "}
          <span className="text-muted">(published before the portal goes live)</span>, and confirm the work I&apos;ve shared is my own.
        </CheckRow>
        {errors.agreeTerms && <p className="pl-7 text-xs text-red-600">{errors.agreeTerms}</p>}
      </div>
    </>
  );
}

function ReviewStep({ profile, files, goTo }: { profile: ArtistProfile; files: Files; goTo: (step: number) => void }) {
  const category = categories.find((c) => c.slug === profile.category);
  const rows: { step: number; title: string; items: [string, ReactNode][] }[] = [
    {
      step: 0,
      title: "About you",
      items: [
        ["Name", profile.fullName],
        ["Mobile", `+91 ${phoneDigits(profile.phone)}`],
        ["Email", profile.email || "—"],
        ["City", profile.city],
      ],
    },
    {
      step: 1,
      title: "Your craft",
      items: [
        ["Category", category?.name ?? "—"],
        ["Services", profile.services.join(", ")],
        ["Experience", profile.experience],
        ["Languages", profile.languages.join(", ")],
        ["About", profile.bio],
      ],
    },
    {
      step: 2,
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
      step: 3,
      title: "Verification",
      items: [
        ["Identity", "Not verified yet (DigiLocker)"],
        ["Agreements", profile.agreeTerms ? "Accepted" : "Not accepted"],
      ],
    },
  ];

  return (
    <>
      {rows.map((r) => (
        <div key={r.title} className="rounded-xl border border-line p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-ink">{r.title}</h3>
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
