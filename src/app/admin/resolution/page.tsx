import { redirect } from "next/navigation";
import { sectionLink } from "@/lib/site-url";

// The old admin's Dispute Desk address (admin.aod.co.in/resolution, in older emails).
export default async function OldResolution({ searchParams }: PageProps<"/admin/resolution">) {
  const open = (await searchParams).open;
  redirect(sectionLink(`/admin/disputes${typeof open === "string" ? `?open=${encodeURIComponent(open)}` : ""}`));
}
