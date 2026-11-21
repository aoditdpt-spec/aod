import type { Metadata } from "next";
import { ProfilePage } from "@/components/dash/portal/Portal";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return <ProfilePage />;
}
