import type { Metadata } from "next";
import { Payments } from "@/components/dash/admin/Work";

export const metadata: Metadata = { title: "Payments" };

export default function Page() {
  return <Payments />;
}
