import type { Metadata } from "next";
import { Payments } from "@/components/admin/pages/Payments";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <Payments />;
}
