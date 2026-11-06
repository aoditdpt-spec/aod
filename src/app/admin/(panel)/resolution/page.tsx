import type { Metadata } from "next";
import { Resolution } from "@/components/admin/pages/Resolution";

export const metadata: Metadata = { title: "Dispute Desk" };

export default function Page() {
  return <Resolution />;
}
