import type { Metadata } from "next";
import { Messages } from "@/components/artists/Messages";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-medium sm:text-4xl">Messages</h1>
      <p className="mt-2 max-w-2xl text-body">Talk to the AOD team about your bookings, your profile or anything else. They reply here, and you get an email when they do.</p>
      <Messages />
    </div>
  );
}
