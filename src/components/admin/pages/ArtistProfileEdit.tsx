"use client";

import { useState } from "react";
import { cityComplete, experienceLevels, isOtherCity, languages } from "@/content/artist-portal";
import { cities } from "@/content/site";
import type { Artist } from "@/lib/admin-store";
import { checkPortfolioLink } from "@/lib/portfolio-links";
import { ChipGroup, CitySelect, Field, inputClass } from "@/components/artists/form";
import { LinkFields } from "@/components/artists/LinkFields";
import { ServicesPicker } from "@/components/artists/ProfileEditor";
import { WorkSections } from "@/components/artists/WorkFields";
import { ActionButton } from "../ui";

type Draft = Pick<Artist, "phone" | "email" | "city" | "experience" | "languages" | "services"> & {
  bio: string;
  links: string[];
  dob: string;
  locality: string;
  work: Record<string, string | string[]>;
};

const fromArtist = (a: Artist): Draft => {
  const { dob, locality, ...work } = a.details ?? {};
  return {
    phone: a.phone,
    email: a.email,
    city: a.city,
    experience: a.experience,
    languages: a.languages,
    services: a.services,
    bio: a.bio ?? "",
    links: a.links ?? [],
    dob: String(dob ?? ""),
    locality: String(locality ?? ""),
    work,
  };
};

// The whole profile an artist gave when applying, editable by the team: everything but the name.
// `onSave` gets a function that applies the changes to the artist (the page records the activity).
export function ArtistProfileEdit({ artist, onSave }: { artist: Artist; onSave: (change: (a: Artist) => void) => void }) {
  const saved = fromArtist(artist);
  const [draft, setDraft] = useState<Draft | null>(null);
  const view = draft ?? saved;
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Draft>) => {
    setDraft({ ...view, ...patch });
    setError(null);
  };

  function save() {
    if (!draft) return;
    const d = draft;
    const digits = d.phone.replace(/\D/g, "");
    if (!(/^(?:91|0)?[6-9]\d{9}$/.test(digits) || (digits.length >= 8 && digits.length <= 15))) return setError("Enter a valid phone number.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return setError("Enter a valid email address.");
    if (!cityComplete(d.city, cities)) return setError(isOtherCity(d.city) ? "Write the name of the city." : "Choose the city.");
    if (d.dob) {
      const born = new Date(`${d.dob}T00:00:00`);
      const limit = new Date();
      limit.setFullYear(limit.getFullYear() - 18);
      if (Number.isNaN(born.getTime()) || born > limit || born.getFullYear() < 1920) return setError("The date of birth must be a real date, 18 or more years ago.");
    }
    if (!d.services.length) return setError("Pick at least one service.");
    for (const l of d.links) {
      const c = checkPortfolioLink(l);
      if (!c.ok) return setError(`${l}: ${c.message}`);
    }
    onSave((a) => {
      a.phone = d.phone.trim();
      a.email = d.email.trim().toLowerCase();
      a.city = d.city;
      a.experience = d.experience;
      a.languages = d.languages;
      a.services = d.services;
      a.bio = d.bio.trim();
      a.links = d.links;
      a.details = { ...(a.details ?? {}), ...d.work, dob: d.dob, locality: d.locality.trim() };
    });
    setDraft(null);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        Everything from the application. The name can&apos;t be changed here, because it is what AOD approved. Their category is changed under Categories.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input value={artist.name} disabled className={`${inputClass} disabled:bg-wash disabled:text-muted`} />
        </Field>
        <Field label="Email" hint="They sign in with this.">
          <input value={view.email} onChange={(e) => set({ email: e.target.value })} type="email" className={inputClass} />
        </Field>
        <Field label="Phone (WhatsApp)">
          <input value={view.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className={inputClass} />
        </Field>
        <Field label="Date of birth">
          <input type="date" value={view.dob} onChange={(e) => set({ dob: e.target.value })} max={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </Field>
        <Field label="Home city">
          <CitySelect value={view.city} onChange={(city) => set({ city })} />
        </Field>
        <Field label="Area / locality">
          <input value={view.locality} onChange={(e) => set({ locality: e.target.value.slice(0, 60) })} className={inputClass} />
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
      <ServicesPicker profile={{ category: artist.category, otherCategories: artist.otherCategories, services: view.services }} onChange={(services) => set({ services })} />
      <div>
        <p className="text-sm font-medium text-ink">Languages</p>
        <ChipGroup label="Languages" options={languages} value={view.languages} onChange={(l) => set({ languages: l })} />
      </div>
      <Field label="About their work" hint={`${view.bio.trim().length}/600 characters`}>
        <textarea value={view.bio} onChange={(e) => set({ bio: e.target.value.slice(0, 600) })} rows={4} className={`${inputClass} resize-none`} />
      </Field>
      <div>
        <p className="text-sm font-medium text-ink">Links</p>
        <LinkFields key={artist.id + saved.links.join("|")} links={view.links} onChange={(links) => set({ links })} />
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-ink">Work details</p>
        <div className="space-y-6">
          <WorkSections
            category={artist.category}
            otherCategories={artist.otherCategories}
            answers={view.work}
            setAnswer={(id, v) => set({ work: { ...view.work, [id]: v } })}
          />
        </div>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <ActionButton permission="artists.edit" disabled={!dirty} onClick={save}>
          Save profile
        </ActionButton>
        {dirty && (
          <button type="button" onClick={() => setDraft(null)} className="text-sm font-medium text-muted hover:text-ink">
            Discard
          </button>
        )}
      </div>
    </div>
  );
}
