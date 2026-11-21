import type { Metadata } from "next";
import { Settings } from "@/components/dash/admin/Team";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <Settings />;
}
