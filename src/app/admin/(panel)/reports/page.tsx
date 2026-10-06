import type { Metadata } from "next";
import { Reports } from "@/components/admin/pages/Reports";

export const metadata: Metadata = { title: "Reports & exports" };

export default function Page() {
  return <Reports />;
}
