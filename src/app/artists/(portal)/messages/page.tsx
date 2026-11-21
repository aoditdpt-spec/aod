import type { Metadata } from "next";
import { MessagesPage } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <MessagesPage />;
}
