import type { Metadata } from "next";
import { Overview } from "@/components/dash/admin/Overview";

export const metadata: Metadata = { title: { absolute: "Admin · AOD" } };

export default function Page() {
  return <Overview />;
}
