import type { Metadata } from "next";
import { TeamRoles } from "@/components/dash/admin/Team";

export const metadata: Metadata = { title: "Team And Roles" };

export default function Page() {
  return <TeamRoles />;
}
