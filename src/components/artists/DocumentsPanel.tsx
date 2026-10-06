"use client";

import { FileSignature, Landmark } from "lucide-react";
import { useState } from "react";
import { uploadRules } from "@/content/artist-portal";
import { DigiLockerCard } from "./DigiLockerCard";
import { FileDrop, type PickedFile } from "./FileDrop";
import { Badge, Panel } from "./form";

// Identity, resume, GST, agreement and payouts. Only what AOD needs, asked for when it's needed:
// payout details come after the trial booking, and identity goes through DigiLocker.
export function DocumentsPanel() {
  const [resume, setResume] = useState<PickedFile[]>([]);
  const [gst, setGst] = useState<PickedFile[]>([]);

  return (
    <div className="mt-8 grid items-start gap-6 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <Panel title="Identity" text="Needed before you go live.">
          <DigiLockerCard />
        </Panel>

        <Panel title="Resume or work profile" text="Optional. Helps for corporate and expo work.">
          <FileDrop label="Resume" variant="single" files={resume} onChange={setResume} limits={uploadRules.resume} hint={uploadRules.resume.hint} />
        </Panel>

        <Panel title="GST certificate" text="Only if you invoice as a registered business.">
          <FileDrop label="GST certificate" variant="single" files={gst} onChange={setGst} limits={uploadRules.gst} hint={uploadRules.gst.hint} />
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-wash text-brand">
              <FileSignature className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium text-ink">Artist agreement</h2>
                <Badge tone="wait">After your meeting</Badge>
              </div>
              <p className="mt-1 text-sm text-body">
                Rates, cancellations and conduct, signed digitally once we&apos;ve met. You&apos;ll find a copy here.
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
                <h2 className="font-medium text-ink">Payout details</h2>
                <Badge>Later</Badge>
              </div>
              <p className="mt-1 text-sm text-body">
                Bank account or UPI, and PAN, are added after your trial booking, when payouts begin. We don&apos;t ask for them earlier.
              </p>
            </div>
          </div>
        </Panel>
        <p className="px-1 text-xs text-muted">Preview: files aren&apos;t uploaded. They stay in this tab and disappear on refresh.</p>
      </div>
    </div>
  );
}
