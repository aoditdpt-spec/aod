"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { backendEnabled } from "@/lib/backend";
import { artistChatLoad, artistChatSend, staffChatOpen, staffChatSend, staffChatSummary, type ChatMessage, type ChatSummary } from "@/server/actions/chat";

export type { ChatMessage, ChatSummary };

// Chat between the team and each artist (src/server/actions/chat.ts), live only (the preview's chat
// runs on src/lib/mock-db.ts through src/lib/app-db.tsx's useThread). Both sides reload when the
// database says something changed: the admin when its data reloads (the "staff" channel), the
// artist portal when its data reloads (the "artist:<id>" channel); a conversation is also fetched
// again after every send.

// ---- The team's side: a summary per artist, the open conversation, and sending ----

export function useStaffChat(artistId: string | null, refresh: unknown, staffName: string) {
  void staffName; // the server names the sender from the signed-in staff member
  const [summary, setSummary] = useState<ChatSummary>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!backendEnabled) return;
    try {
      const [s, m] = await Promise.all([staffChatSummary(), artistId ? staffChatOpen(artistId) : Promise.resolve(null)]);
      if (s.ok) setSummary(s.summary);
      if (m?.ok) setMessages(m.messages);
      setError(s.ok && (m === null || m.ok) ? null : "Couldn't load the chat. Try again in a moment.");
    } catch {
      setError("Couldn't load the chat. Check your connection.");
    }
  }, [artistId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads from the server
    void load();
  }, [load, refresh]);
  useEffect(() => {
    // Switching artist shouldn't show the last one's messages while the next loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on switch
    setMessages([]);
  }, [artistId]);

  async function send(body: string): Promise<boolean> {
    if (!artistId || !body.trim() || !backendEnabled) return false;
    setSending(true);
    setError(null);
    try {
      const res = await staffChatSend(artistId, body);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      setMessages((m) => [...m, res.message]);
      void load();
      return true;
    } catch {
      setError("Couldn't send. Check your connection and try again.");
      return false;
    } finally {
      setSending(false);
    }
  }

  return { summary, messages, send, sending, error };
}

// ---- The artist's side: their own conversation with the team ----
// `open` is true on the Messages page (it marks the team's messages as read); `enabled` false
// skips loading (the hook is called on the team's side too). `refresh` changes when the portal's
// data reloads.
export function useArtistChat(open: boolean, refresh: unknown, enabled = true) {
  const [live, setLive] = useState<{ messages: ChatMessage[]; unread: number }>({ messages: [], unread: 0 });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const latest = useRef(open);
  useEffect(() => {
    latest.current = open;
  });

  const load = useCallback(async () => {
    if (!backendEnabled || !enabled) return;
    try {
      const r = await artistChatLoad(latest.current);
      if (r.ok) {
        setLive({ messages: r.messages, unread: r.unread });
        setError(null);
      } else setError(r.error);
    } catch {
      setError("Couldn't load your messages. Check your connection.");
    }
  }, [enabled]);
  useEffect(() => {
    void load();
  }, [load, refresh, open]);

  async function send(body: string): Promise<boolean> {
    if (!body.trim() || !backendEnabled) return false;
    setSending(true);
    setError(null);
    try {
      const res = await artistChatSend(body);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      setLive((s) => ({ ...s, messages: [...s.messages, res.message] }));
      return true;
    } catch {
      setError("Couldn't send. Check your connection and try again.");
      return false;
    } finally {
      setSending(false);
    }
  }

  return { messages: live.messages, unread: live.unread, send, sending, error };
}
