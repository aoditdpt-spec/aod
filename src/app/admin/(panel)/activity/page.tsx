import type { Metadata } from "next";
import { ActivityLog } from "@/components/admin/pages/ActivityLog";

export const metadata: Metadata = { title: "Activity log" };

export default function Page() {
  return <ActivityLog />;
}
