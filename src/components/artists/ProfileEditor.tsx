"use client";

import { useState } from "react";
import { experienceLevels, languages } from "@/content/artist-portal";
import { categories, cities } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { saveProfile, useArtistProfile } from "@/lib/artist-live";
import type { ArtistProfile } from "@/lib/artist-store";
import type { ProfilePatch } from "@/server/actions/artist";
import { ChipGroup, Field, Panel, inputClass } from "./form";

// Work profile editor. Live: edits are kept as a draft until "Save changes"; the name and
// category stay as AOD approved them. Preview: kept in this browser as you type.
export function ProfileEditor() {
  return backendEnabled ? <LiveProfileEditor /> : <PreviewProfileEditor />;
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
  const category = categories.find((c) => c.slug === view.category);

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
          <Field label="Home city">
            <select value={view.city} onChange={(e) => set({ city: e.target.value })} className={inputClass}>
              <option value="">Choose…</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value="Other city in Gujarat">Other city in Gujarat</option>
            </select>
          </Field>
        </div>
      </Panel>

      <Panel title="Your craft">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" hint="Set by AOD when you joined.">
            <input value={category?.name ?? view.category} disabled className={`${inputClass} disabled:bg-wash disabled:text-muted`} />
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
        {category && (
          <div className="mt-5">
            <p className="text-sm font-medium text-ink">Services</p>
            <ChipGroup label="Services" options={category.services.map((s) => s.name)} value={view.services} onChange={(services) => set({ services })} />
          </div>
        )}
        <div className="mt-5">
          <p className="text-sm font-medium text-ink">Languages</p>
          <ChipGroup label="Languages" options={languages} value={view.languages} onChange={(l) => set({ languages: l })} />
        </div>
        <Field label="About your work" className="mt-5" hint={`${view.bio.trim().length}/600 characters`}>
          <textarea value={view.bio} onChange={(e) => set({ bio: e.target.value.slice(0, 600) })} rows={5} className={`${inputClass} resize-none`} />
        </Field>
      </Panel>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-lg">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="h-11 rounded-lg bg-brand px-6 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
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
  const category = categories.find((c) => c.slug === profile.category);

  return (
    <div className="mt-8 max-w-3xl space-y-6">
      {sample && (
        <p className="rounded-xl border border-brand/30 bg-peach/40 p-4 text-sm text-ink">
          This is a sample profile. Edit anything to make it yours; changes stay in this browser.
        </p>
      )}

      <Panel title="Basics">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name">
            <input value={profile.fullName} onChange={(e) => set({ fullName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Home city">
            <select value={profile.city} onChange={(e) => set({ city: e.target.value })} className={inputClass}>
              <option value="">Choose…</option>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value="Other city in Gujarat">Other city in Gujarat</option>
            </select>
          </Field>
        </div>
      </Panel>

      <Panel title="Your craft">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            <select value={profile.category} onChange={(e) => set({ category: e.target.value, services: [] })} className={inputClass}>
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
        {category && (
          <div className="mt-5">
            <p className="text-sm font-medium text-ink">Services</p>
            <ChipGroup label="Services" options={category.services.map((s) => s.name)} value={profile.services} onChange={(services) => set({ services })} />
          </div>
        )}
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
      {!sample && <p className="text-sm text-muted">Changes are kept on this device only (preview).</p>}
    </div>
  );
}
