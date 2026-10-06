import type { Metadata } from "next";
import { Calendar } from "@/components/admin/pages/Calendar";

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <Calendar />;
}
