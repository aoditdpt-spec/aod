import type { Metadata } from "next";
import { Chat } from "@/components/dash/admin/Talk";

export const metadata: Metadata = { title: "Chat With Artists" };

export default function Page() {
  return <Chat />;
}
