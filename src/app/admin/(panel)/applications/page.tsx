import type { Metadata } from "next";
import { Applications } from "@/components/admin/pages/Applications";

export const metadata: Metadata = { title: "Applications" };

export default function Page() {
  return <Applications />;
}
