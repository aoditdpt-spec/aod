import type { Metadata } from "next";
import { caseForm } from "@/data/dispute-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { CaseForm } from "@/components/dispute/CaseForm";

export const metadata: Metadata = { title: "Raise A Dispute", description: "Raise a dispute with a client or an artist. AOD hears both sides and works towards a fair settlement." };

export default function NewCasePage() {
  return (
    <main className="flex-1">
      <PageHeader label="AOD Dispute Desk" title={caseForm.title} />
      <Container className="pb-24 lg:pb-32">
        <CaseForm />
      </Container>
    </main>
  );
}
