import { Suspense } from "react";
import { PortalShell } from "@/components/dash/PortalShell";
import { Loading } from "@/components/dash/ui";

// The artist portal's signed-in pages (live: the signed-in artist's or applicant's own records,
// src/lib/app-db.tsx; preview: the sample artist). Signed-out visitors go to the sign-in.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </PortalShell>
  );
}
