import type { Metadata } from "next";
import { Messages } from "@/components/dash/admin/Talk";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <Messages />;
}
