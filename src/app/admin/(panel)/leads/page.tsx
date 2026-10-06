import type { Metadata } from "next";
import { Leads } from "@/components/admin/pages/Leads";

export const metadata: Metadata = { title: "Leads" };

export default function Page() {
  return <Leads />;
}
