import type { Metadata } from "next";
import { Newsletter } from "@/components/admin/pages/Newsletter";

export const metadata: Metadata = { title: "Newsletter" };

export default function Page() {
  return <Newsletter />;
}
