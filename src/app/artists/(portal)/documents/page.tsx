import type { Metadata } from "next";
import { DocumentsPanel } from "@/components/artists/DocumentsPanel";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-medium sm:text-4xl">Documents</h1>
      <p className="mt-2 max-w-2xl text-body">Identity, agreements and payout details, asked for only when they&apos;re needed.</p>
      <DocumentsPanel />
    </div>
  );
}
