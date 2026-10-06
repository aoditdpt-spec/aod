import type { Metadata } from "next";
import { terms } from "@/content/legal";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: terms.title,
  description: terms.description,
  alternates: { canonical: "/terms" },
  openGraph: { title: terms.title, description: terms.description },
};

export default function Page() {
  return <LegalPage doc={terms} />;
}
