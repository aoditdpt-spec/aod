import type { Metadata } from "next";
import { Reports } from "@/components/dash/admin/Team";

export const metadata: Metadata = { title: "Reports And Exports" };

export default function Page() {
  return <Reports />;
}
