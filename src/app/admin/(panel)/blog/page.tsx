import type { Metadata } from "next";
import { Blog } from "@/components/admin/pages/Blog";

export const metadata: Metadata = { title: "Blog" };

export default function Page() {
  return <Blog />;
}
