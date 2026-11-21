import type { Metadata } from "next";
import { Availability } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Availability" };

export default function Page() {
  return <Availability />;
}
