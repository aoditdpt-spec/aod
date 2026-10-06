import type { Metadata } from "next";
import { Artists } from "@/components/admin/pages/Artists";

export const metadata: Metadata = { title: "Artists" };

export default function Page() {
  return <Artists />;
}
