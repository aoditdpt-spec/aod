import type { Metadata } from "next";
import { Team } from "@/components/admin/pages/Team";

export const metadata: Metadata = { title: "Team & roles" };

export default function Page() {
  return <Team />;
}
