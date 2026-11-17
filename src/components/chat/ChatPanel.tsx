"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ChatMessage } from "@/lib/chat";
import { Spinner } from "@/components/ui/Spinner";

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const dayLabel = (iso: string) => {
  const today = dayKey(new Date().toISOString());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000).toISOString());
  const k = dayKey(iso);
  if (k === today) return "Today";
  if (k === yesterday) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

// One conversation: the messages (mine on the right in orange, the other side on the left), who
// wrote each, "Seen" under my last message once the other side opened it, and the box to write in.
// Enter sends, Shift+Enter starts a new line. Used by the artist portal and the admin.
export function ChatPanel({
  messages,
  isMine,
  nameOf,
  onSend,
  sending,
  error,
  placeholder = "Write a message…",
  empty,
  header,
  className = "",
}: {
  messages: ChatMessage[];
  isMine: (m: ChatMessage) => boolean;
  nameOf: (m: ChatMessage) => string;
  onSend: (body: string) => Promise<boolean>;
  sending: boolean;
  error: string | null;
  placeholder?: string;
  empty: ReactNode;
  header?: ReactNode;
  className?: string;
}) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const count = messages.length;

  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  async function submit() {
    const body = text.trim();
    if (!body || sending) return;
    if (await onSend(body)) setText("");
  }

  const lastMine = [...messages].reverse().find(isMine);

  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-line bg-white ${className}`}>
      {header && <div className="border-b border-line px-4 py-3 sm:px-5">{header}</div>}
      <div ref={list} className="min-h-0 flex-1 space-y-1 overflow-y-auto bg-wash/60 px-3 py-4 sm:px-5" aria-live="polite">
        {count === 0 && <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted">{empty}</div>}
        {messages.map((m, i) => {
          const mine = isMine(m);
          const showDay = i === 0 || dayKey(messages[i - 1].at) !== dayKey(m.at);
          const prev = messages[i - 1];
          const showName = showDay || !prev || isMine(prev) !== mine || nameOf(prev) !== nameOf(m);
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-xs font-medium text-muted">{dayLabel(m.at)}</p>}
              <div className={`flex flex-col ${mine ? "items-end" : "items-start"} ${showName ? "mt-2" : ""}`}>
                {showName && nameOf(m) && <span className="mb-0.5 px-1 text-xs font-medium text-muted">{nameOf(m)}</span>}
                <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm sm:max-w-[75%] ${mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-line bg-white text-ink"}`}>
                  {m.body}
                </div>
                <span className="mt-0.5 px-1 text-[0.6875rem] text-muted">
                  {timeLabel(m.at)}
                  {mine && m === lastMine && m.read ? " · Seen" : ""}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <form
        className="flex items-end gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          aria-label="Message"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-brand"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? <Spinner /> : <Send className="h-4 w-4" aria-hidden />}
          <span className="max-sm:sr-only">Send</span>
        </button>
      </form>
    </div>
  );
}
