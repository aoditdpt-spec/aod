import type { Metadata } from "next";
import { Chat } from "@/components/admin/pages/Chat";

export const metadata: Metadata = { title: "Chat with artists" };

export default function Page() {
  return <Chat />;
}
