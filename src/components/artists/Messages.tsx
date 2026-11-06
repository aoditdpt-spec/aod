"use client";

import { backendEnabled } from "@/lib/backend";
import { usePortalState } from "@/lib/artist-live";
import { useArtistChat } from "@/lib/chat";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PushToggle } from "@/components/chat/PushToggle";

// The artist's chat with the AOD team. Every team member shows as "Admin".
export function Messages() {
  const portal = usePortalState();
  const applicant = backendEnabled && portal.data?.kind === "applicant";
  const { messages, send, sending, error } = useArtistChat(!applicant, portal.data);

  if (applicant) {
    return (
      <p className="mt-8 rounded-xl border border-line bg-white p-6 text-sm text-body">
        Chat opens once your application is approved. Until then, the AOD team replies to your application by email and WhatsApp.
      </p>
    );
  }
  return (
    <div className="mt-6 space-y-4">
      <PushToggle as="artist" />
      <ChatPanel
      className="h-[calc(100svh-19rem)] min-h-[28rem]"
      header={
        <div>
          <p className="text-sm font-bold text-ink">AOD team</p>
          <p className="text-xs text-muted">Your messages go to the whole team</p>
        </div>
      }
      messages={messages}
      isMine={(m) => m.fromArtist}
      nameOf={(m) => (m.fromArtist ? "You" : "Admin")}
      onSend={send}
      sending={sending}
      error={error}
      placeholder="Write to the AOD team…"
      empty={<span>No messages yet. Write to the AOD team below.</span>}
      />
    </div>
  );
}
