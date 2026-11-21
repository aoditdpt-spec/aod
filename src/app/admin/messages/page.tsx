import type { Metadata } from "next";
import { Messages } from "@/components/dash/admin/Talk";

export const metadata: Metadata = { title: "Templates" };

export default function Page() {
  return <Messages />;
}
