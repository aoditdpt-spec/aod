"use client";

import { useState } from "react";
import type { MatchedArtist } from "@/content/my-bookings";
import { ArtistPhoto } from "@/components/ui/ArtistPhoto";
import { Sheet } from "@/components/ui/Sheet";

// The artists on an order, each with a button that opens their profile: photo, craft, experience,
// languages, services, a few lines about them and some of their work. Used for the artists AOD has
// matched and for its shortlist, in My bookings and the business portal. No contact details.
export function ArtistProfiles({ artists, label }: { artists: MatchedArtist[]; label?: string }) {
  const [open, setOpen] = useState<MatchedArtist | null>(null);
  if (!artists.length) return null;
  return (
    <>
      <ul className="space-y-3" aria-label={label}>
        {artists.map((a, i) => (
          <li key={`${a.profile?.id ?? a.name}-${i}`} className="flex items-center gap-3">
            <ArtistPhoto name={a.name} src={a.profile?.photo} className="h-12 w-12 text-base" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{a.name}</p>
              <p className="text-sm text-muted">
                {a.craft} · {a.city}
              </p>
            </div>
            {a.profile && (
              <button type="button" onClick={() => setOpen(a)} className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-brand hover:border-brand">
                View profile
              </button>
            )}
          </li>
        ))}
      </ul>
      <Sheet open={open !== null} onClose={() => setOpen(null)} title={open?.name ?? "Artist"}>
        {open?.profile && <Profile artist={open} />}
      </Sheet>
    </>
  );
}

function Profile({ artist: a }: { artist: MatchedArtist }) {
  const p = a.profile!;
  const rows: [string, string][] = [
    ["Experience", p.experience],
    ["Languages", p.languages.join(", ")],
    ["Services", p.services.join(", ")],
  ].filter((r): r is [string, string] => Boolean(r[1]));
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-4">
        <ArtistPhoto name={a.name} src={p.photo} className="h-20 w-20 text-2xl" alt={a.name} />
        <div>
          <p className="text-lg font-bold text-ink">{a.name}</p>
          <p className="text-muted">
            {a.craft} · {a.city}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-700">Verified by AOD</p>
        </div>
      </div>
      {p.bio && <p className="whitespace-pre-line text-body">{p.bio}</p>}
      {rows.length > 0 && (
        <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[7rem_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {p.works.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Their work</p>
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {p.works.map((w) => (
              <li key={w.url} className="aspect-square overflow-hidden rounded-lg bg-wash">
                {w.video ? (
                  <video src={w.url} controls preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- a portfolio photo from the public bucket
                  <img src={w.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted">AOD shares contact details only once you have confirmed your booking.</p>
    </div>
  );
}
