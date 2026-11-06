import type { Metadata } from "next";
import { privacy } from "@/content/legal";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: privacy.title,
  description: privacy.description,
  alternates: { canonical: "/privacy" },
  openGraph: { title: privacy.title, description: privacy.description },
};

export default function Page() {
  return <LegalPage doc={privacy} />;
}
