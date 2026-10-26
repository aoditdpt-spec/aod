import type { Metadata } from "next";
import { ApprovalSteps } from "@/components/artists/ApprovalSteps";

export const metadata: Metadata = { title: "Approval" };

export default function ApprovalPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-medium sm:text-4xl">Approval</h1>
      <p className="mt-2 max-w-2xl text-body">Every step from your application to going live on AOD, and what our team has checked.</p>
      <ApprovalSteps />
    </div>
  );
}
