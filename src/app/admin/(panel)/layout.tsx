import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader } from "@/components/ui/Spinner";

// Signed-in admin pages. Pages read ?open=<id> to open a record, so they sit in a Suspense
// boundary and render in the browser; the routes themselves stay static.
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<PageLoader className="min-h-[50vh]" />}>{children}</Suspense>
    </AdminShell>
  );
}
