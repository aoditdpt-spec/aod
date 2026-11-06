import type { Metadata } from "next";
import { AdminSignIn } from "@/components/admin/AdminSignIn";

export const metadata: Metadata = { title: { absolute: "Sign in — AOD Admin" } };

export default function AdminSignInPage() {
  return <AdminSignIn />;
}
