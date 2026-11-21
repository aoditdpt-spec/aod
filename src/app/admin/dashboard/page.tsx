import { redirect } from "next/navigation";
import { sectionLink } from "@/lib/site-url";

// The old admin's Overview address (admin.aod.co.in/dashboard): the Overview is now the admin's home.
export default function OldDashboard() {
  redirect(sectionLink("/admin"));
}
