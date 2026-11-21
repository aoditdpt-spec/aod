import type { Metadata } from "next";
import { Calendar } from "@/components/dash/admin/Work";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <Calendar />;
}
