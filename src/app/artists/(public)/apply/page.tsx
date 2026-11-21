import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { MainSiteLink } from "@/components/ui/MainSiteLink";
import { ApplyForm } from "@/components/artists/ApplyForm";

export const metadata: Metadata = { title: "Apply To Join", description: "Apply to join AOD as a photographer, anchor, musician, comedian, model or makeup artist.", robots: { index: false } };

export default function ApplyPage() {
  return (
    <main className="flex-1">
      {/* Part of the artist portal (artists.aod.co.in), so it carries Back To Main Site. */}
      <PageHeader label="Artist Portal" title="Apply To Join AOD.">
        <MainSiteLink />
      </PageHeader>
      <Container className="pb-24 lg:pb-32">
        <ApplyForm />
      </Container>
    </main>
  );
}
