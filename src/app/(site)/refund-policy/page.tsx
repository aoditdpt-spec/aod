import type { Metadata } from "next";
import { refunds } from "@/content/legal";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: refunds.title,
  description: refunds.description,
  alternates: { canonical: "/refund-policy" },
  openGraph: { title: refunds.title, description: refunds.description },
};

export default function Page() {
  return <LegalPage doc={refunds} />;
}
