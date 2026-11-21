import type { Metadata } from "next";
import { Disputes } from "@/components/dash/admin/Work";

export const metadata: Metadata = { title: "Dispute Desk" };

export default function Page() {
  return <Disputes />;
}
