"use client";

import { experienceLevels, languages, sampleArtist } from "@/content/artist-portal";
import { categories, cities } from "@/content/site";
import { profileStore, type ArtistProfile } from "@/lib/artist-store";
import { ChipGroup, Field, Panel, inputClass } from "./form";

const sample: ArtistProfile = { ...sampleArtist, agreeTerms: true };

// Work profile editor. Changes are kept in this browser as you type (preview); nothing is sent to AOD.
export function ProfileEditor() {
  const saved = profileStore.use();
  const profile = saved ?? sample;
  // Merge into the latest saved profile, so quick successive edits never undo each other.
  const set = (patch: Partial<ArtistProfile>) => profileStore.set({ ...(profileStore.get() ?? sample), ...patch });
  const category = categories.find((c) => c.slug === profile.category);

  return (
    <div className="mt-8 max-w-3xl space-y-6">
      {!saved && (
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
      {saved && <p className="text-sm text-muted">Changes are kept on this device only (preview).</p>}
    </div>
  );
}
