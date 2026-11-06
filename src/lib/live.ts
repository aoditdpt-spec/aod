"use client";

import { useEffect, useRef, useState } from "react";
import { backendEnabled } from "@/lib/backend";
import { createClient } from "@/lib/supabase/client";

// Live updates. When a record changes, the database sends a small "changed" message on private
// Realtime channels (supabase/migrations/20261010000000_live_and_artists.sql): "staff" for the
// admin panel, "customer:<key>" for My bookings, "artist:<id>" and "applicant:<key>" for the
// artist portal. A page listens on its channels and reloads its own data, through its server
// actions, when a message arrives. The message never carries the record itself.
//
// Backups for when the connection drops: reload when the tab comes back into view, and every
// `pollMs` while the tab is visible and the channel isn't connected.

export type LiveStatus = "off" | "connecting" | "live";

type Options = { onStatus?: (s: LiveStatus) => void; pollMs?: number; debounceMs?: number };

// Start listening. Returns a function that stops.
export function listenLive(topics: string[], onChange: () => void, { onStatus, pollMs = 60_000, debounceMs = 400 }: Options = {}) {
  if (!backendEnabled || !topics.length) {
    onStatus?.("off");
    return () => {};
  }
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let status: LiveStatus = "connecting";
  const joined = new Set<string>();
  const setStatus = (s: LiveStatus) => {
    if (s !== status) {
      status = s;
      onStatus?.(s);
    }
  };
  // Several messages in a burst (one save can touch a few records) become one reload.
  const fire = () => {
    if (stopped) return;
    clearTimeout(timer);
    timer = setTimeout(() => !stopped && onChange(), debounceMs);
  };

  const supabase = createClient();
  const channels = topics.map((topic) =>
    supabase
      .channel(topic, { config: { private: true } })
      .on("broadcast", { event: "changed" }, fire)
      .subscribe((state) => {
        if (state === "SUBSCRIBED") joined.add(topic);
        else joined.delete(topic);
        setStatus(joined.size === topics.length ? "live" : "connecting");
      }),
  );
  // Private channels need the signed-in user's token.
  void supabase.realtime.setAuth();
  onStatus?.("connecting");

  const onVisible = () => {
    if (document.visibilityState === "visible") fire();
  };
  document.addEventListener("visibilitychange", onVisible);
  const poll = setInterval(() => {
    if (document.visibilityState === "visible" && status !== "live") fire();
  }, pollMs);

  return () => {
    stopped = true;
    clearTimeout(timer);
    clearInterval(poll);
    document.removeEventListener("visibilitychange", onVisible);
    for (const c of channels) void supabase.removeChannel(c);
  };
}

// The same for a component: listens while mounted (and while `topics` is non-empty).
export function useLiveRefresh(topics: string[] | null | undefined, onChange: () => void, options: Omit<Options, "onStatus"> = {}): LiveStatus {
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });
  const key = (topics ?? []).join("|");
  const { pollMs, debounceMs } = options;
  useEffect(() => {
    if (!key) return;
    return listenLive(key.split("|"), () => latest.current(), { onStatus: setStatus, pollMs, debounceMs });
  }, [key, pollMs, debounceMs]);
  return backendEnabled && key ? status : "off";
}
