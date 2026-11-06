import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/pages/Dashboard";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <Dashboard />;
}
