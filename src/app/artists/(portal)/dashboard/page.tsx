import type { Metadata } from "next";
import { Dashboard } from "@/components/artists/Dashboard";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return <Dashboard />;
}
