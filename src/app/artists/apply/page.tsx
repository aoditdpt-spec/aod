import type { Metadata } from "next";
import Link from "next/link";
import { portal } from "@/content/artist-portal";
import { Container } from "@/components/ui/Container";
import { ApplyForm } from "@/components/artists/ApplyForm";
import { PortalHeader } from "@/components/artists/PortalChrome";

export const metadata: Metadata = {
  title: "Apply to join",
  description: "Apply to join Artists on Demand: your details, craft, portfolio and identity, in five short steps.",
  alternates: { canonical: "/artists/apply" },
};

export default function ApplyPage() {
  return (
    <>
      <PortalHeader
        right={
          <Link href="/artists" className="text-sm text-muted hover:text-brand">
            Sign in
          </Link>
        }
      />
      <Container className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-medium sm:text-5xl">{portal.apply.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-body">{portal.apply.subtitle}</p>
          <div className="mt-10">
            <ApplyForm />
          </div>
        </div>
      </Container>
    </>
  );
}
