import type { Metadata } from "next";
import { caseForm } from "@/data/dispute-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { TrackCase } from "@/components/dispute/TrackCase";

export const metadata: Metadata = { title: "Track A Dispute", description: "See your Dispute Desk case's progress and AOD's decision.", robots: { index: false } };

export default function TrackCasePage() {
  return (
    <main className="flex-1">
      <PageHeader label="AOD Dispute Desk" title={caseForm.trackTitle} />
      <Container className="pb-24 lg:pb-32">
        <TrackCase />
      </Container>
    </main>
  );
}
