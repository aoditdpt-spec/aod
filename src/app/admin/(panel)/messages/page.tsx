import type { Metadata } from "next";
import { Messages } from "@/components/admin/pages/Messages";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <Messages />;
}
