import type { Metadata } from "next";
import { Applications } from "@/components/dash/admin/People";

export const metadata: Metadata = { title: "Applications" };

export default function Page() {
  return <Applications />;
}
