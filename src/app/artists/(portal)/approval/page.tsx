import type { Metadata } from "next";
import { Approval } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Approval" };

export default function Page() {
  return <Approval />;
}
