import type { Metadata } from "next";
import { privacy } from "@/data/legal";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: privacy.title, description: privacy.description };

export default function Page() {
  return <LegalPage doc={privacy} />;
}
