import type { Metadata } from "next";
import { Suspense } from "react";
import { resolution } from "@/content/resolution";
import { CaseForm } from "@/components/resolve/CaseForm";

export const metadata: Metadata = {
  title: resolution.formTitle,
  description: resolution.formText,
};

// The form reads ?role= and ?ref= to pre-fill, so it renders in the browser inside Suspense;
// the page itself stays static.
export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-medium text-ink sm:text-4xl">{resolution.formTitle}</h1>
      <p className="mt-2 max-w-2xl text-body">{resolution.formText}</p>
      <p className="mt-1 max-w-2xl text-sm text-muted">{resolution.notSupport}</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-panel bg-white" />}>
          <CaseForm />
        </Suspense>
      </div>
    </div>
  );
}
