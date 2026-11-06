"use client";

import { briefCommon, type Brief } from "@/content/artist-brief";

// The optional "Brief for the artists" box in the booking questions, after the event details:
// one box the customer writes in, in their own words (no preset questions). It's saved as the
// brief's `note` (src/content/artist-brief.ts), so it travels with the order like before: the
// WhatsApp message, emails, the sheet, the admin and the artist portal.
export function ArtistBrief({ brief, onChange }: { brief: Brief; onChange: (b: Brief) => void }) {
  return (
    <label className="mt-6 block text-sm font-medium text-ink">
      <span className="flex flex-wrap items-baseline gap-x-2">
        {briefCommon.title} <span className="text-xs font-normal text-muted">{briefCommon.optional}</span>
      </span>
      <span className="mt-0.5 block text-sm font-normal text-body">{briefCommon.intro}</span>
      <textarea
        value={brief.note ?? ""}
        onChange={(e) => onChange({ note: e.target.value })}
        rows={3}
        maxLength={1000}
        placeholder={briefCommon.note.placeholder}
        className="mt-2 w-full resize-y rounded-xl border border-line px-4 py-3 font-normal outline-none focus:border-brand"
      />
    </label>
  );
}
