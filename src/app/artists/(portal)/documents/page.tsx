import type { Metadata } from "next";
import { Documents } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Documents" };

export default function Page() {
  return <Documents />;
}
