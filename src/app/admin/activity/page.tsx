import type { Metadata } from "next";
import { ActivityLog } from "@/components/dash/admin/Team";

export const metadata: Metadata = { title: "Activity Log" };

export default function Page() {
  return <ActivityLog />;
}
