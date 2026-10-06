"use client";

import { ExternalLink } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { amountProblem, formatINR, parseAmount } from "@/lib/upi";
import { whatsappShareUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { CopyButton } from "./CopyButton";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-brand aria-[invalid=true]:border-red-500";

// Where customers open the payment page. NEXT_PUBLIC_PAY_URL wins (e.g. https://aod-pay.vercel.app);
// otherwise /pay on this host, or on the main site when the admin panel runs on its own domain
// (where /pay would point back into the admin).
export function payBase(): string {
  const explicit = process.env.NEXT_PUBLIC_PAY_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const { origin, pathname } = location;
  if (pathname.startsWith("/admin") || pathname.startsWith("/pay")) return `${origin}/pay`;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return site ? `${site.replace(/\/$/, "")}/pay` : `${origin}/pay`;
}

// A payment link with the amount locked and the booking details filled in.
export function payLink(base: string, p: { amount?: number | null; forText?: string; ref?: string; name?: string }) {
  const query = new URLSearchParams();
  if (p.amount) query.set("amount", String(p.amount));
  if (p.forText?.trim()) query.set("for", p.forText.trim());
  if (p.ref?.trim()) query.set("ref", p.ref.trim());
  if (p.name?.trim()) query.set("name", p.name.trim());
  return `${base}${query.size ? `?${query}` : ""}`;
}

const noSubscribe = () => () => {};
export const usePayBase = () => useSyncExternalStore(noSubscribe, payBase, () => "");

// For the AOD team (admin → Payments): make a payment link with the amount (and booking details)
// filled in, then copy it or send it to the customer on WhatsApp.
export function PayLinkBuilder() {
  const base = usePayBase();
  const [amountText, setAmountText] = useState("");
  const [forText, setForText] = useState("");
  const [ref, setRef] = useState("");
  const [name, setName] = useState("");

  const amount = parseAmount(amountText);
  const problem = amountText ? amountProblem(amount) : null;
  const link = payLink(base, { amount: problem ? null : amount, forText, ref, name });
  const ready = !!amount && !problem;
  const message = `Hi${name.trim() ? ` ${name.trim().split(" ")[0]}` : ""}, here's the link to pay ${ready ? formatINR(amount) : ""} to Artists on Demand${
    ref.trim() ? ` for booking ${ref.trim()}` : ""
  }: ${link}`;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="space-y-5 rounded-[1.5rem] border border-line bg-white p-6 sm:p-8">
        <label className="block text-sm font-medium text-ink">
          Amount
          <div className="mt-1.5 flex">
            <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-wash px-4 text-muted">₹</span>
            <input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^\d.,]/g, "").slice(0, 10))}
              inputMode="decimal"
              placeholder="5,000"
              aria-invalid={!!problem}
              className={`${field.replace("mt-1.5 ", "")} rounded-l-none text-lg`}
            />
          </div>
          {problem && <span className="mt-1.5 block text-xs font-normal text-red-600">{problem}</span>}
        </label>
        <label className="block text-sm font-medium text-ink">
          For <span className="font-normal text-muted">(shown to the customer)</span>
          <input value={forText} onChange={(e) => setForText(e.target.value.slice(0, 80))} placeholder="Wedding photography advance, 14 Dec" className={field} />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Booking ref
            <input value={ref} onChange={(e) => setRef(e.target.value.replace(/[^a-zA-Z0-9 /-]/g, "").slice(0, 30))} placeholder="B-1187" className={field} />
          </label>
          <label className="block text-sm font-medium text-ink">
            Customer name
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} className={field} />
          </label>
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-night p-6 text-white sm:p-8">
        <p className="text-sm text-white/70">Payment link</p>
        <p className="mt-2 break-all rounded-xl bg-white/10 p-4 font-mono text-sm">{ready ? link : "Enter an amount to make the link."}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <CopyButton text={link} label="Copy link" className={ready ? "" : "pointer-events-none opacity-40"} />
          <a
            href={ready ? whatsappShareUrl(message) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-whatsapp px-3 py-1.5 text-sm font-medium text-white hover:bg-whatsapp-hover ${ready ? "" : "pointer-events-none opacity-40"}`}
          >
            <WhatsAppIcon className="h-4 w-4" /> Send on WhatsApp
          </a>
          <a
            href={ready ? link : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!ready}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 ${ready ? "" : "pointer-events-none opacity-40"}`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> Open
          </a>
        </div>
        <p className="mt-5 text-xs text-white/60">The customer can&apos;t change the amount on this link. Payments go to the UPI ID set on Vercel.</p>
      </div>
    </div>
  );
}
