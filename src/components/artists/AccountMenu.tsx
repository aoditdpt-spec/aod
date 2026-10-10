"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { backendEnabled } from "@/lib/backend";
import { portalSignOut, useArtistProfile, usePortalMode } from "@/lib/artist-live";
import { modeStore, type PreviewMode } from "@/lib/artist-store";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "A";

const modes: { value: PreviewMode; label: string; text: string }[] = [
  { value: "live", label: "Live artist", text: "Bookings, requests and availability" },
  { value: "applicant", label: "New applicant", text: "Onboarding steps before going live" },
];

// Avatar button in the portal header, with sign-out. In the preview it also holds the switch
// between a live artist and a new applicant, so the team can see both sides of the portal.
export function AccountMenu() {
  const router = useRouter();
  const { profile } = useArtistProfile();
  const mode = usePortalMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = profile.fullName || profile.email || "Artist";

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-wash"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-medium text-white">{initials(name)}</span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium leading-tight text-ink">{name}</span>
          <span className="block text-xs leading-tight text-muted">
            {mode === "live" ? "Live artist" : "Applicant"}
            {!backendEnabled && " · preview"}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-card border border-line bg-white p-2 shadow-xl">
          {backendEnabled && <p className="truncate px-3 pb-2 pt-2 text-xs text-muted">Signed in as {profile.email}</p>}
          {!backendEnabled && <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-muted">Preview as</p>}
          {!backendEnabled && modes.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => {
                modeStore.set(m.value);
                setOpen(false);
              }}
              aria-pressed={mode === m.value}
              className={`block w-full rounded-lg px-3 py-2 text-left ${mode === m.value ? "bg-peach/50" : "hover:bg-wash"}`}
            >
              <span className="block text-sm font-medium text-ink">{m.label}</span>
              <span className="block text-xs text-muted">{m.text}</span>
            </button>
          ))}
          <div className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                void portalSignOut().then(() => router.push("/artists"));
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-body hover:bg-wash"
            >
              <LogOut className="h-4 w-4 text-muted" aria-hidden /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
