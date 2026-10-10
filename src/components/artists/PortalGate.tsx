"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { backendEnabled } from "@/lib/backend";
import { portalSignOut, reloadPortal, usePortalState } from "@/lib/artist-live";

// Live mode: the signed-in pages need a signed-in artist or applicant. Signed-out visitors go to
// the sign-in page; an email with no artist or application gets a way to apply. The preview
// shows the pages straight away.
export function PortalGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const portal = usePortalState();
  useEffect(() => {
    if (backendEnabled && portal.status === "signed-out") router.replace("/artists");
  }, [portal.status, router]);

  if (!backendEnabled || portal.status === "ready") return children;

  if (portal.status === "no-account" || portal.status === "error") {
    return (
      <div className="flex flex-1 items-start justify-center px-4 py-16">
        <div className="max-w-md rounded-[1.5rem] border border-line bg-white p-8 text-center">
          {portal.status === "no-account" ? (
            <>
              <h1 className="text-2xl font-medium">No artist account for this email</h1>
              <p className="mt-3 text-body">
                {portal.email} isn&apos;t linked to an AOD artist or application yet. Apply to join, or sign in with the email you applied with.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/artists/apply" className="inline-flex h-11 items-center rounded-lg bg-brand px-5 font-medium text-white hover:bg-brand-hover">
                  Apply to join
                </Link>
                <button
                  type="button"
                  onClick={() => void portalSignOut().then(() => router.replace("/artists"))}
                  className="inline-flex h-11 items-center rounded-lg border border-line px-5 font-medium text-ink hover:border-ink"
                >
                  Use another email
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-medium">Couldn&apos;t load your portal</h1>
              <p className="mt-3 text-body">{portal.error}</p>
              <button type="button" onClick={() => void reloadPortal()} className="mt-6 inline-flex h-11 items-center rounded-lg bg-brand px-5 font-medium text-white hover:bg-brand-hover">
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return <div className="m-6 h-96 flex-1 animate-pulse rounded-[1.5rem] bg-white" aria-label="Loading your portal" />;
}
