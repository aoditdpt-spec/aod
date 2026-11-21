import type { Metadata } from "next";
import { Portfolio } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Portfolio" };

export default function Page() {
  return <Portfolio />;
}
