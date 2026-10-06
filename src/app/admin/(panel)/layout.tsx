import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

// Signed-in admin pages. Pages read ?open=<id> to open a record, so they sit in a Suspense
// boundary and render in the browser; the routes themselves stay static.
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>{children}</Suspense>
    </AdminShell>
  );
}
