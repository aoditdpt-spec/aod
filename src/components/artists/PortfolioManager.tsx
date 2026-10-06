"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { sampleArtist, uploadRules } from "@/content/artist-portal";
import { profileStore, type ArtistProfile } from "@/lib/artist-store";
import { FileDrop, type PickedFile } from "./FileDrop";
import { Panel } from "./form";
import { LinkEditor } from "./LinkEditor";

const tips = [
  "Lead with your strongest frame: it's the cover customers see first.",
  "Show range: wide shots, details, people, low light.",
  "Use recent work, ideally from the last two years.",
  "Only share work you shot or edited yourself.",
];

// Photos, videos and links. Links are saved with the profile (in this browser for the preview);
// photos and videos stay in this tab until uploads go live.
export function PortfolioManager() {
  const saved = profileStore.use();
  const profile: ArtistProfile = saved ?? { ...sampleArtist, agreeMeeting: true, agreeTerms: true };
  const [files, setFiles] = useState<PickedFile[]>([]);

  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <Panel
          title="Photos and videos"
          text={`${files.length} of ${uploadRules.samples.max} · at least ${uploadRules.samples.min} recommended`}
        >
          <FileDrop
            label="Photos and videos"
            multiple
            files={files}
            onChange={setFiles}
            limits={uploadRules.samples}
            hint={uploadRules.samples.hint}
          />
          <p className="mt-4 text-xs text-muted">Preview: files aren&apos;t uploaded. They stay in this tab and disappear on refresh.</p>
        </Panel>

        <Panel title="Portfolio links" text="Instagram, YouTube, Vimeo, Behance, Google Drive or your own website.">
          <LinkEditor links={profile.links} onChange={(links) => profileStore.set({ ...(profileStore.get() ?? profile), links })} />
        </Panel>
      </div>

      <Panel title="What makes a strong portfolio">
        <ul className="space-y-3 text-sm text-body">
          {tips.map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden /> {t}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-lg bg-wash p-3 text-xs text-muted">
          Our creative team reviews new work before it appears in your matches.
        </p>
      </Panel>
    </div>
  );
}
