import type { Metadata } from "next";
import { Resolution } from "@/components/admin/pages/Resolution";

export const metadata: Metadata = { title: "Resolution cases" };

export default function Page() {
  return <Resolution />;
}
