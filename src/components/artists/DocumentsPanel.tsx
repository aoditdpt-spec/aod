"use client";

import { FileSignature, Landmark } from "lucide-react";
import { Badge, Panel } from "./form";

// Agreement and payouts. Only what AOD needs, asked for when it's needed: payout details
// come after the trial booking.
export function DocumentsPanel() {
  return (
    <div className="mt-8 max-w-2xl">
      <div className="space-y-6">
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash text-brand">
              <FileSignature className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-ink font-bold">Artist agreement</h2>
                <Badge tone="wait">After approval</Badge>
              </div>
              <p className="mt-1 text-sm text-body">
                Rates, cancellations and conduct, signed digitally once you&apos;re approved. You&apos;ll find a copy here.
              </p>
            </div>
          </div>
        </Panel>
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash text-brand">
              <Landmark className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-ink font-bold">Payout details</h2>
                <Badge>Later</Badge>
              </div>
              <p className="mt-1 text-sm text-body">
                Bank account or UPI, and PAN, are added after your trial booking, when payouts begin. We don&apos;t ask for them earlier.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
