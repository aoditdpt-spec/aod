import type { Metadata } from "next";
import { Artists } from "@/components/dash/admin/People";

export const metadata: Metadata = { title: "Artists" };

export default function Page() {
  return <Artists />;
}
