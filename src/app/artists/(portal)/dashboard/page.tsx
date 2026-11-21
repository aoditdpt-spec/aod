import type { Metadata } from "next";
import { Dashboard } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <Dashboard />;
}
