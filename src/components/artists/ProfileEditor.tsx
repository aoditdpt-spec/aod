"use client";

import { BadgeCheck, Languages, MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { experienceLevels, languages, sampleArtist, uploadRules } from "@/content/artist-portal";
import { categories, cities } from "@/content/site";
import { profileStore, type ArtistProfile } from "@/lib/artist-store";
import { Icon } from "@/components/ui/Icon";
import { initials } from "./AccountMenu";
import { FileDrop, type PickedFile } from "./FileDrop";
import { Badge, ChipGroup, Field, Panel, inputBase, inputClass } from "./form";

const sample: ArtistProfile = { ...sampleArtist, agreeMeeting: true, agreeTerms: true };

// Work profile editor with a live preview of the card customers see in their matches.
// Changes are kept in this browser as you type (preview); nothing is sent to AOD.
export function ProfileEditor() {
  const saved = profileStore.use();
  const profile = saved ?? sample;
  const [photo, setPhoto] = useState<PickedFile[]>([]);
  const set = (patch: Partial<ArtistProfile>) => profileStore.set({ ...(profileStore.get() ?? sample), ...patch });
  const category = categories.find((c) => c.slug === profile.category);

  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
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
          <div className="mt-5">
            <p className="text-sm font-medium text-ink">Profile photo</p>
            <FileDrop label="Profile photo" variant="single" files={photo} onChange={setPhoto} limits={uploadRules.photo} hint={uploadRules.photo.hint} />
          </div>
        </Panel>

        <Panel title="Your craft">
          <Field label="Category">
            <select
              value={profile.category}
              onChange={(e) => set({ category: e.target.value, services: [] })}
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
          {category && (
            <div className="mt-5">
              <p className="text-sm font-medium text-ink">Services</p>
              <ChipGroup label="Services" options={category.services.map((s) => s.name)} value={profile.services} onChange={(services) => set({ services })} />
            </div>
          )}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Experience">
              <select value={profile.experience} onChange={(e) => set({ experience: e.target.value })} className={inputClass}>
                <option value="">Choose…</option>
                {experienceLevels.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Starting price" optional hint="Only AOD sees this; customers get quotes.">
              <div className="mt-1.5 flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-wash px-3 text-sm text-muted">₹</span>
                <input
                  value={profile.startingPrice}
                  onChange={(e) => set({ startingPrice: e.target.value.replace(/\D/g, "").slice(0, 7) })}
                  inputMode="numeric"
                  className={`${inputBase} rounded-l-none`}
                />
              </div>
            </Field>
          </div>
          <div className="mt-5">
            <p className="text-sm font-medium text-ink">Languages</p>
            <ChipGroup label="Languages" options={languages} value={profile.languages} onChange={(l) => set({ languages: l })} />
          </div>
          <div className="mt-5">
            <p className="text-sm font-medium text-ink">Cities you work in</p>
            <ChipGroup label="Cities" options={cities} value={profile.citiesServed} onChange={(c) => set({ citiesServed: c })} />
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

      {/* What customers see in their three matches. */}
      <div className="xl:sticky xl:top-24">
        <p className="mb-3 text-sm font-medium text-muted">How customers see you</p>
        <article className="overflow-hidden rounded-[1.25rem] border border-line bg-white">
          <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-wash via-peach/50 to-apricot/60">
            {photo[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo[0].url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-medium text-brand shadow-sm">
                {initials(profile.fullName)}
              </span>
            )}
            <span className="absolute left-3 top-3">
              <Badge tone="good">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Met by AOD in person
              </Badge>
            </span>
          </div>
          <div className="p-5">
            <h3 className="text-xl font-medium text-ink">{profile.fullName || "Your name"}</h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              {category && <Icon name={category.icon} className="h-4 w-4 text-brand" />}
              {category?.singular ?? "Artist"} · {profile.experience}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-body">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted" aria-hidden /> {profile.citiesServed.join(", ") || profile.city}
              </li>
              <li className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted" aria-hidden /> {profile.languages.join(", ") || "—"}
              </li>
            </ul>
            {profile.services.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {profile.services.map((s) => (
                  <li key={s} className="rounded-md bg-wash px-2 py-1 text-xs text-ink">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            {profile.bio && <p className="mt-4 line-clamp-4 text-sm text-body">{profile.bio}</p>}
            <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-4 text-xs text-muted">
              <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden /> Shown once you&apos;re live, with your quote and portfolio.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
