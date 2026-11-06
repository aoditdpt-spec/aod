"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useDb, useSession } from "@/lib/admin-store";
import { artistPhotoSrc } from "@/lib/artist-photo";
import { useStaffChat } from "@/lib/chat";
import { sectionLink } from "@/lib/site-url";
import { ArtistPhoto } from "@/components/ui/ArtistPhoto";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PushToggle } from "@/components/chat/PushToggle";
import { categoryNames, fieldClass, PageHeader } from "../ui";

const when = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const same = d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return same
    ? d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
};

// Chat with artists: pick an artist, read what they wrote and reply. The whole team shares each
// conversation; the team sees which of them wrote each message and the artist's name and email,
// while the artist only ever sees "Admin".
export function Chat() {
  const db = useDb()!;
  const session = useSession();
  const [artistId, setArtistId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { summary, messages, send, sending, error } = useStaffChat(artistId, db, session?.name ?? "Admin");

  const artists = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.artists
      .filter((a) => !q || `${a.name} ${a.email} ${a.id}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const x = summary[a.id]?.last.at ?? "";
        const y = summary[b.id]?.last.at ?? "";
        return x === y ? a.name.localeCompare(b.name) : y.localeCompare(x);
      });
  }, [db.artists, query, summary]);
  const artist = db.artists.find((a) => a.id === artistId) ?? null;

  return (
    <div className="flex h-[calc(100svh-7.5rem)] min-h-[32rem] flex-col gap-4">
      <PageHeader title="Chat with artists" text="Pick an artist to message. Artists see your messages as coming from Admin, not your name." actions={<PushToggle as="staff" />} />
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[20rem_1fr]">
        <section className={`min-h-0 flex-col overflow-hidden rounded-[1.25rem] border border-line bg-white ${artist ? "max-lg:hidden" : "flex"} lg:flex`} aria-label="Artists">
          <div className="border-b border-line p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search artists" aria-label="Search artists" className={`${fieldClass} !pl-9`} />
            </div>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {artists.length === 0 && <li className="p-6 text-center text-sm text-muted">No artists match.</li>}
            {artists.map((a) => {
              const s = summary[a.id];
              const active = a.id === artistId;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setArtistId(a.id)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${active ? "bg-peach/50" : "hover:bg-wash"}`}
                  >
                    <ArtistPhoto name={a.name} src={artistPhotoSrc(a.id, a.photo)} className="h-10 w-10 shrink-0 text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={`truncate text-sm ${s?.unread ? "font-bold text-ink" : "font-medium text-ink"}`}>{a.name}</span>
                        {s?.last.at && <span className="shrink-0 text-[0.6875rem] text-muted">{when(s.last.at)}</span>}
                      </span>
                      <span className="block truncate text-xs text-muted">{a.email}</span>
                      {s?.last.body && (
                        <span className={`block truncate text-xs ${s.unread ? "font-medium text-ink" : "text-muted"}`}>
                          {s.last.fromArtist ? "" : "You: "}
                          {s.last.body}
                        </span>
                      )}
                    </span>
                    {s && s.unread > 0 && <span className="rounded-full bg-brand px-1.5 text-[0.7rem] font-medium text-white">{s.unread}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {artist ? (
          <ChatPanel
            className={`${artistId ? "flex" : "max-lg:hidden"}`}
            header={
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setArtistId(null)} aria-label="Back to the artists" className="-ml-1 rounded-lg p-1.5 text-muted hover:bg-wash hover:text-ink lg:hidden">
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
                <ArtistPhoto name={artist.name} src={artistPhotoSrc(artist.id, artist.photo)} className="h-10 w-10 shrink-0 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{artist.name}</p>
                  <p className="truncate text-xs text-muted">
                    {artist.email} · {artist.id} · {categoryNames(artist)}
                  </p>
                </div>
                <Link href={sectionLink(`/admin/artists?open=${artist.id}`)} className="shrink-0 text-sm font-medium text-brand hover:underline">
                  Profile
                </Link>
              </div>
            }
            messages={messages}
            isMine={(m) => !m.fromArtist}
            nameOf={(m) => (m.fromArtist ? artist.name : m.sender || "Admin")}
            onSend={send}
            sending={sending}
            error={error}
            placeholder={`Message ${artist.name.split(" ")[0]}…`}
            empty={<span>No messages with {artist.name} yet. Say hello below.</span>}
          />
        ) : (
          <section className="hidden items-center justify-center rounded-[1.25rem] border border-dashed border-line bg-white p-10 text-center lg:flex">
            <div>
              <MessageCircle className="mx-auto h-10 w-10 text-muted" aria-hidden />
              <p className="mt-3 font-medium text-ink">Choose an artist to start chatting</p>
              <p className="mt-1 max-w-xs text-sm text-muted">Their messages appear here, and the whole team sees the same conversation.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
