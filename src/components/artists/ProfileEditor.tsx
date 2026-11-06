"use client";

import { useState } from "react";
import { artistServiceOptions, experienceLevels, languages } from "@/content/artist-portal";
import { categories } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { changePhoto, saveProfile, useArtistProfile, usePortalPhoto } from "@/lib/artist-live";
import type { ArtistProfile } from "@/lib/artist-store";
import { allCategories } from "@/lib/booking-needs";
import type { ProfilePatch } from "@/server/actions/artist";
import { Spinner } from "@/components/ui/Spinner";
import { PhotoPicker } from "@/components/ui/PhotoPicker";
import { ChipGroup, CitySelect, Field, Panel, inputClass } from "./form";
import { LinkFields } from "./LinkFields";
import { WorkSections } from "./WorkFields";

// Work profile editor. Live: edits are kept as a draft until "Save changes"; the name and
// categories stay as AOD approved them. Preview: kept in this browser as you type.
export function ProfileEditor() {
  return backendEnabled ? <LiveProfileEditor /> : <PreviewProfileEditor />;
}

// The profile photo: picked from the gallery or camera and saved straight away (to AOD's Google
// Drive when live), apart from "Save changes".
function ProfilePhoto({ name }: { name: string }) {
  const src = usePortalPhoto();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-medium text-ink">Profile photo</p>
      <PhotoPicker
        name={name}
        src={src}
        busy={busy}
        error={error}
        onPick={async (dataUrl) => {
          setBusy(true);
          setError(await changePhoto(dataUrl));
          setBusy(false);
        }}
      />
    </div>
  );
}

// The services of each of the artist's categories, under the category's name when there are several.
// Date of birth and the area of their city, as on the application.
export function BirthAndArea({ view, set }: { view: ArtistProfile; set: (patch: Partial<ArtistProfile>) => void }) {
  return (
    <>
      <Field label="Date of birth" hint="You need to be 18 or older.">
        <input type="date" value={view.dob ?? ""} onChange={(e) => set({ dob: e.target.value })} max={new Date().toISOString().slice(0, 10)} className={inputClass} />
      </Field>
      <Field label="Area / locality" hint="The part of your city you live in, e.g. Bopal, Satellite.">
        <input value={view.locality ?? ""} onChange={(e) => set({ locality: e.target.value.slice(0, 60) })} className={inputClass} />
      </Field>
    </>
  );
}

// The links and the "Your work details" answers from the application, editable here too.
function LinksAndWork({ view, set }: { view: ArtistProfile; set: (patch: Partial<ArtistProfile>) => void }) {
  // Merge into what is shown now, so quick successive taps never undo each other.
  const setAnswer = (id: string, v: string | string[]) => set({ work: { ...(view.work ?? {}), [id]: v } });
  return (
    <>
      <Panel title="Your links" text="Your Instagram username and a link to your work: YouTube, Google Drive, Instagram or any website.">
        <LinkFields links={view.links} onChange={(links) => set({ links })} />
      </Panel>
      {view.category && (
        <Panel title="Your work details" text="The answers from your application. Keep them up to date.">
          <div className="space-y-6">
            <WorkSections category={view.category} otherCategories={view.otherCategories} answers={view.work ?? {}} setAnswer={setAnswer} />
          </div>
        </Panel>
      )}
    </>
  );
}

export function ServicesPicker({ profile, onChange }: { profile: Pick<ArtistProfile, "category" | "otherCategories" | "services">; onChange: (services: string[]) => void }) {
  const own = allCategories(profile)
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c) => c !== undefined);
  if (!own.length) return null;
  return (
    <div className="mt-5">
      <p className="text-sm font-medium text-ink">Services</p>
      {own.map((c) => (
        <div key={c.slug} className={own.length > 1 ? "mt-3" : ""}>
          {own.length > 1 && <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.name}</p>}
          <ChipGroup label={`${c.name} services`} options={artistServiceOptions(c.slug)} value={profile.services} onChange={onChange} selectAll />
        </div>
      ))}
    </div>
  );
}

function LiveProfileEditor() {
  const { profile } = useArtistProfile();
  const [draft, setDraft] = useState<ProfilePatch>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const view: ArtistProfile = { ...profile, ...draft };
  const set = (patch: ProfilePatch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setMessage(null);
  };
  const dirty = Object.keys(draft).length > 0;
  const kinds = allCategories(view).map((slug) => categories.find((c) => c.slug === slug)?.name ?? slug);

  async function save() {
    setSaving(true);
    const error = await saveProfile(draft);
    setSaving(false);
    if (error) setMessage({ ok: false, text: error });
    else {
      setDraft({});
      setMessage({ ok: true, text: "Saved. The AOD team sees your changes straight away." });
    }
  }

  return (
    <div className="mt-8 max-w-3xl space-y-6">
      <Panel title="Basics">
        <ProfilePhoto name={view.fullName} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" hint="To change your name, message AOD.">
            <input value={view.fullName} disabled className={`${inputClass} disabled:bg-wash disabled:text-muted`} />
          </Field>
          <Field label="Email" hint="You sign in with this.">
            <input value={view.email} disabled className={`${inputClass} disabled:bg-wash disabled:text-muted`} />
          </Field>
          <Field label="Phone (WhatsApp)">
            <input value={view.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className={inputClass} />
          </Field>
          <BirthAndArea view={view} set={set} />
          <Field label="Home city">
            <CitySelect value={view.city} onChange={(city) => set({ city })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Your craft">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={kinds.length > 1 ? "Categories" : "Category"} hint="Set by AOD. To add another kind of work, message AOD.">
            <input value={kinds.join(", ")} disabled className={`${inputClass} disabled:bg-wash disabled:text-muted`} />
          </Field>
          <Field label="Experience">
            <select value={view.experience} onChange={(e) => set({ experience: e.target.value })} className={inputClass}>
              <option value="">Choose…</option>
              {experienceLevels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
        <ServicesPicker profile={view} onChange={(services) => set({ services })} />
        <div className="mt-5">
          <p className="text-sm font-medium text-ink">Languages</p>
          <ChipGroup label="Languages" options={languages} value={view.languages} onChange={(l) => set({ languages: l })} />
        </div>
        <Field label="About your work" className="mt-5" hint={`${view.bio.trim().length}/600 characters`}>
          <textarea value={view.bio} onChange={(e) => set({ bio: e.target.value.slice(0, 600) })} rows={5} className={`${inputClass} resize-none`} />
        </Field>
      </Panel>

      <LinksAndWork view={view} set={set} />

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-lg">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className={`inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-medium text-white hover:bg-brand-hover ${
            saving ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-40"
          }`}
        >
          {saving ? (
            <>
              <Spinner /> Saving…
            </>
          ) : (
            "Save changes"
          )}
        </button>
        {dirty && !saving && (
          <button type="button" onClick={() => setDraft({})} className="text-sm font-medium text-muted hover:text-ink">
            Discard
          </button>
        )}
        {message && <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>}
        {!message && !dirty && <p className="text-sm text-muted">Your profile is up to date.</p>}
      </div>
    </div>
  );
}

function PreviewProfileEditor() {
  const { profile, sample } = useArtistProfile();
  const set = (patch: Partial<ArtistProfile>) => void saveProfile(patch);
  // Services stay picked only while one of the categories offers them.
  const keepServices = (slugs: string[]) => {
    const offered = new Set(slugs.flatMap((slug) => artistServiceOptions(slug)));
    return profile.services.filter((s) => offered.has(s));
  };

  return (
    <div className="mt-8 max-w-3xl space-y-6">
      {sample && (
        <p className="rounded-xl border border-brand/30 bg-peach/40 p-4 text-sm text-ink">
          This is a sample profile. Edit anything to make it yours; changes stay in this browser.
        </p>
      )}

      <Panel title="Basics">
        <ProfilePhoto name={profile.fullName} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input value={profile.fullName} onChange={(e) => set({ fullName: e.target.value })} className={inputClass} />
          </Field>
          <BirthAndArea view={profile} set={set} />
          <Field label="Home city">
            <CitySelect value={profile.city} onChange={(city) => set({ city })} />
          </Field>
        </div>
      </Panel>

      <Panel title="Your craft">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={profile.category}
              onChange={(e) => {
                const others = profile.otherCategories.filter((c) => c !== e.target.value);
                set({ category: e.target.value, otherCategories: others, services: keepServices([e.target.value, ...others]) });
              }}
              className={inputClass}
            >
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Experience">
            <select value={profile.experience} onChange={(e) => set({ experience: e.target.value })} className={inputClass}>
              <option value="">Choose…</option>
              {experienceLevels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
        </div>
        {profile.category && (
          <div className="mt-5">
            <p className="text-sm font-medium text-ink">
              Also works as <span className="font-normal text-muted">(optional)</span>
            </p>
            <ChipGroup
              label="Also works as"
              options={categories.filter((c) => c.slug !== profile.category).map((c) => c.name)}
              value={profile.otherCategories.map((s) => categories.find((c) => c.slug === s)?.name ?? s)}
              onChange={(names) => {
                const others = categories.filter((c) => names.includes(c.name)).map((c) => c.slug);
                set({ otherCategories: others, services: keepServices([profile.category, ...others]) });
              }}
            />
          </div>
        )}
        <ServicesPicker profile={profile} onChange={(services) => set({ services })} />
        <div className="mt-5">
          <p className="text-sm font-medium text-ink">Languages</p>
          <ChipGroup label="Languages" options={languages} value={profile.languages} onChange={(l) => set({ languages: l })} />
        </div>
        <Field label="About your work" className="mt-5" hint={`${profile.bio.trim().length}/600 characters`}>
          <textarea
            value={profile.bio}
            onChange={(e) => set({ bio: e.target.value.slice(0, 600) })}
            rows={5}
            className={`${inputClass} resize-none`}
          />
        </Field>
      </Panel>

      <LinksAndWork view={profile} set={set} />
      {!sample && <p className="text-sm text-muted">Changes are kept on this device only (preview).</p>}
    </div>
  );
}
