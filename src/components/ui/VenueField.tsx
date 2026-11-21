"use client";

import { useEffect, useId, useRef, useState } from "react";

// "Where Is The Event?": the exact venue (a hotel, a hall, a home address…), with Google Maps
// suggestions under the box as the visitor types, like the search bar's, and a small map of the
// place once one is picked. Needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (a browser key restricted to
// the site's addresses, with the Maps JavaScript API, Places API (New) and Maps Embed API on);
// without it the box is plain text and says so in test mode.

export type Venue = { text: string; placeId: string; city: string };
export const blankVenue: Venue = { text: "", placeId: "", city: "" };

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// The few parts of the Maps JavaScript API used here (no @types/google.maps in the project).
type Text = { text: string };
type Prediction = { placeId: string; text: Text; mainText?: Text; secondaryText?: Text; toPlace: () => Place };
type Place = { fetchFields: (o: { fields: string[] }) => Promise<unknown>; addressComponents?: { longText: string; types: string[] }[] };
type PlacesLib = {
  AutocompleteSessionToken: new () => object;
  AutocompleteSuggestion: { fetchAutocompleteSuggestions: (r: object) => Promise<{ suggestions: { placePrediction?: Prediction }[] }> };
};
type MapsWindow = Window & { google?: { maps?: { importLibrary: (name: string) => Promise<unknown> } }; __aodMaps?: () => void };

let loading: Promise<PlacesLib | null> | null = null;
function loadPlaces(): Promise<PlacesLib | null> {
  if (!KEY) return Promise.resolve(null);
  loading ??= new Promise<PlacesLib | null>((resolve) => {
    const w = window as MapsWindow;
    const ready = () => w.google!.maps!.importLibrary("places").then((lib) => resolve(lib as PlacesLib), () => resolve(null));
    if (w.google?.maps?.importLibrary) return void ready();
    w.__aodMaps = ready;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&loading=async&libraries=places&region=IN&language=en&callback=__aodMaps`;
    s.async = true;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return loading;
}

// Gujarat, roughly: suggestions lean towards it (and stay in India) without hiding the rest.
const bias = { center: { lat: 22.7, lng: 71.6 }, radius: 50000 };

export function VenueField({ label, hideLabel = false, placeholder, value, onChange, inputClass, testNote }: { label: string; hideLabel?: boolean; placeholder: string; value: Venue; onChange: (v: Venue) => void; inputClass: string; testNote: boolean }) {
  const [lib, setLib] = useState<PlacesLib | null>(null);
  const [list, setList] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const token = useRef<object | null>(null);
  const asked = useRef(0);
  const listId = useId();

  // The Maps script loads only once someone starts on the venue box.
  const start = () => {
    if (!KEY || lib) return;
    void loadPlaces().then(setLib);
  };

  useEffect(() => {
    const q = value.text.trim();
    if (!lib || !open || q.length < 2 || value.placeId) return;
    const n = ++asked.current;
    const t = window.setTimeout(() => {
      token.current ??= new lib.AutocompleteSessionToken();
      lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: q, sessionToken: token.current, includedRegionCodes: ["in"], locationBias: bias })
        .then(({ suggestions }) => {
          if (n !== asked.current) return; // an older answer arriving late
          setList(suggestions.map((s) => s.placePrediction).filter((p): p is Prediction => !!p).slice(0, 5));
          setActive(-1);
        })
        .catch(() => setList([]));
    }, 200);
    return () => window.clearTimeout(t);
  }, [lib, open, value.text, value.placeId]);

  async function pick(p: Prediction) {
    setOpen(false);
    setList([]);
    const text = p.text.text;
    onChange({ text, placeId: p.placeId, city: "" });
    // The city, for the team's lists (one call per session ends the session's billing).
    try {
      const place = p.toPlace();
      await place.fetchFields({ fields: ["addressComponents"] });
      const city = place.addressComponents?.find((c) => c.types.includes("locality"))?.longText ?? "";
      onChange({ text, placeId: p.placeId, city });
    } catch {
      // The venue is kept without the city.
    }
    token.current = null;
  }

  const shown = open && list.length > 0 && !value.placeId;

  return (
    <div className="relative">
      <label className="block text-sm text-muted">
        <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
        <input
          value={value.text}
          onChange={(e) => {
            onChange({ text: e.target.value, placeId: "", city: "" });
            setOpen(true);
          }}
          onFocus={() => {
            start();
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!shown) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, list.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && active >= 0) {
              e.preventDefault();
              void pick(list[active]);
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={shown}
          aria-controls={listId}
          aria-autocomplete="list"
          className={inputClass}
        />
      </label>
      {shown && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-paper py-1 shadow-lg">
          {list.map((p, i) => (
            <li key={p.placeId} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => void pick(p)} className={`block w-full px-4 py-2.5 text-left ${i === active ? "bg-wash" : "hover:bg-wash"}`}>
                <span className="block text-base text-ink">{p.mainText?.text ?? p.text.text}</span>
                {p.secondaryText && <span className="block text-[13px] text-muted">{p.secondaryText.text}</span>}
              </button>
            </li>
          ))}
          <li className="px-4 pb-1.5 pt-1 text-right text-[11px] text-muted">Powered By Google</li>
        </ul>
      )}
      {KEY && value.placeId && (
        <iframe
          title={`Map of ${value.text}`}
          src={`https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(KEY)}&q=place_id:${encodeURIComponent(value.placeId)}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="mt-3 h-48 w-full rounded-xl border border-line"
        />
      )}
      {!KEY && testNote && <p className="mt-2 text-xs text-muted">Test mode: Google Maps suggestions switch on once a Maps key is added.</p>}
    </div>
  );
}
