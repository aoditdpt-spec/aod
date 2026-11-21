import type { Metadata } from "next";
import { Blog } from "@/components/dash/admin/Content";

export const metadata: Metadata = { title: "Blog" };

export default function Page() {
  return <Blog />;
}
