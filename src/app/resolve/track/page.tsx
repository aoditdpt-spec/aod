import type { Metadata } from "next";
import { Suspense } from "react";
import { resolution } from "@/content/resolution";
import { TrackCase } from "@/components/resolve/TrackCase";

export const metadata: Metadata = {
  title: resolution.trackTitle,
  description: resolution.trackText,
};

// Reads ?id= (from the case emails) inside Suspense; the page itself stays static.
export default function TrackCasePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-medium text-ink sm:text-4xl">{resolution.trackTitle}</h1>
      <p className="mt-2 max-w-2xl text-body">{resolution.trackText}</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-56 animate-pulse rounded-panel bg-white" />}>
          <TrackCase />
        </Suspense>
      </div>
    </div>
  );
}
