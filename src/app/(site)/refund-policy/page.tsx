import type { Metadata } from "next";
import { refunds } from "@/data/legal";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: refunds.title, description: refunds.description };

export default function Page() {
  return <LegalPage doc={refunds} />;
}
