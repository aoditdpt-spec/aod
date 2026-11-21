import type { Metadata } from "next";
import { terms } from "@/data/legal";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: terms.title, description: terms.description };

export default function Page() {
  return <LegalPage doc={terms} />;
}
