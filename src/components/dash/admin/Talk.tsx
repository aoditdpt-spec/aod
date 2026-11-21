"use client";

import { Avatar } from "@/components/ui/Avatar";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { timeRange } from "@/lib/event-time";
import { rupees, shortDate, teamUnread, templates, useDb } from "@/lib/app-db";
import { ChatThread } from "../ChatThread";
import { PushToggle } from "../push/PushToggle";
import { Head, Loading, Title, field, label } from "../ui";

// Chat With Artists: every artist on the left (unread first), the conversation on the right.
// "?artist=ART-201" (the artist drawer's Message button) opens that artist's conversation.
export function Chat() {
  const db = useDb();
  const asked = useSearchParams().get("artist");
  const [pick, setPick] = useState<string | null>(null);
  if (!db) return <Loading />;
  const last = (id: string) => db.messages.filter((m) => m.artist === id).at(-1);
  const list = db.artists.slice().sort((a, b) => teamUnread(db, b.id) - teamUnread(db, a.id) || (last(b.id)?.at ?? "").localeCompare(last(a.id)?.at ?? ""));
  const current = pick ?? (asked && db.artists.some((a) => a.id === asked) ? asked : list[0]?.id);
  const artist = db.artists.find((a) => a.id === current);

  return (
    <>
      <Title title="Chat With Artists" text="One conversation per artist, shared by the whole team." />
      <div className="mt-4">
        <PushToggle as="staff" />
      </div>
      <div className="mt-7 grid gap-8 border-t border-ink pt-2 md:grid-cols-[260px_1fr]">
        <ul className="max-md:flex max-md:gap-2 max-md:overflow-x-auto">
          {list.map((a) => {
            const n = teamUnread(db, a.id);
            return (
              <li key={a.id} className="shrink-0">
                <button type="button" onClick={() => setPick(a.id)} className={`flex w-full items-center gap-2.5 border-b border-line py-2.5 text-left max-md:rounded-lg max-md:border max-md:px-3 ${a.id === current ? "font-medium" : "text-muted hover:text-ink"}`}>
                  <Avatar src={a.photo} name={a.name} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink">{a.name}</span>
                    <small className="block truncate text-xs text-muted max-md:hidden">{last(a.id)?.text ?? "No messages yet"}</small>
                  </span>
                  {n > 0 && <b className="font-medium text-brand">{n}</b>}
                </button>
              </li>
            );
          })}
        </ul>
        {artist && (
          <div className="min-w-0">
            <Head title={artist.name} className="mt-3">
              {artist.craft}
            </Head>
            <ChatThread key={artist.id} artist={artist.id} side="team" />
          </div>
        )}
      </div>
    </>
  );
}

// Messages: the WhatsApp templates, filled in from an order, to copy.
export function Messages() {
  const db = useDb();
  const [order, setOrder] = useState("");
  const [copied, setCopied] = useState("");
  if (!db) return <Loading />;
  const b = db.bookings.find((x) => x.id === order) ?? db.bookings[0];
  const fill = (t: string) =>
    t
      .replace("{name}", b.customer)
      .replace("{ref}", b.id)
      .replace("{date}", `${shortDate(b.date)}${b.start ? `, ${timeRange(b.start, b.end)}` : ""}`)
      .replace("{city}", b.city)
      .replace("{advance}", b.quote ? rupees(Math.round(b.quote * 0.3)) : "the advance");

  return (
    <>
      <Title title="Messages" text="Ready messages for customers, filled in from an order." />
      <label className="mt-7 block max-w-sm">
        <span className={label}>Order</span>
        <select value={b.id} onChange={(e) => setOrder(e.target.value)} className={field}>
          {db.bookings.map((x) => (
            <option key={x.id} value={x.id}>
              {x.id}, {x.customer}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-8 grid gap-x-10 border-t border-ink md:grid-cols-2">
        {templates.map((t) => (
          <section key={t.id} className="border-b border-line py-5">
            <Head title={t.title}>
              <button
                type="button"
                className="text-[13px] text-muted hover:text-ink"
                onClick={() => {
                  void navigator.clipboard?.writeText(fill(t.text));
                  setCopied(t.id);
                  window.setTimeout(() => setCopied(""), 1500);
                }}
              >
                {copied === t.id ? "Copied" : "Copy"}
              </button>
            </Head>
            <p className="text-[15px] text-ink/80">{fill(t.text)}</p>
          </section>
        ))}
      </div>
    </>
  );
}
