"use client";

import { useRouter } from "next/navigation";
import { Check, MapPin, RotateCcw } from "lucide-react";
import type { CustomerOrder } from "@/content/my-bookings";
import { stageInfo, stageOf, trackDone, trackSteps } from "@/content/business-portal";
import { timeRange } from "@/lib/event-time";
import { startRebook } from "@/lib/rebook";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { ArtistProfiles } from "@/components/bookings/ArtistProfiles";

export const inr = (n?: number) => (n === undefined ? "—" : `₹${n.toLocaleString("en-IN")}`);
export const fmtDate = (s: string) => {
  if (!s) return "Date not fixed yet";
  return new Date(`${s}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export function StageChip({ order }: { order: CustomerOrder }) {
  const s = stageInfo(stageOf(order));
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${s.chip}`}>{s.label}</span>;
}

// Inquiry → Accepted → Fulfilled → Payment received, as far as the booking has got.
function Track({ order }: { order: CustomerOrder }) {
  const done = trackDone(order);
  if (order.status === "cancelled") return <p className="rounded-lg bg-wash px-4 py-3 text-sm text-muted">This booking was cancelled.</p>;
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Booking progress">
      {trackSteps.map((s, i) => {
        const on = i < done;
        const now = i === done - 1;
        return (
          <li key={s.id} className="relative flex flex-col items-center text-center">
            {i > 0 && <span aria-hidden className={`absolute right-1/2 top-4 -z-0 h-0.5 w-full ${on ? "bg-brand" : "bg-line"}`} />}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                on ? "bg-brand text-white" : "bg-white text-muted ring-1 ring-line"
              } ${now ? "ring-4 ring-peach" : ""}`}
            >
              {on ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className={`mt-2 text-xs font-medium sm:text-sm ${on ? "text-ink" : "text-muted"}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

// One booking in full: where it stands, the event, the artists and the money.
export function OrderDetail({ order: o }: { order: CustomerOrder }) {
  const router = useRouter();
  const done = trackDone(o);
  const paid = o.payments.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
  const step = trackSteps[Math.max(0, done - 1)];
  const ask = whatsappUrl(`Hi AOD, a question about our booking ${o.ref ?? o.id} (${o.occasion}, ${fmtDate(o.date)}).`);
  const rows: [string, string][] = [
    ["Date", fmtDate(o.date)],
    ["Time", o.time ? timeRange(o.time, o.endTime) : "—"],
    ["City", o.city || "—"],
    ["Venue", o.venue || "—"],
    ["Artists needed", o.services.join(", ")],
  ];
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-ink">{o.occasion}</h3>
          <StageChip order={o} />
          {o.sample && <span className="rounded-md bg-wash px-2 py-0.5 text-xs font-medium text-muted">Sample</span>}
        </div>
        <p className="mt-1 text-sm text-muted">Order {o.ref ?? o.id}</p>
      </div>

      <Track order={o} />
      {o.status !== "cancelled" && <p className="text-sm text-body">{step.text}</p>}

      <dl className="grid gap-x-6 gap-y-2.5 text-sm sm:grid-cols-[9rem_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="flex items-start gap-1.5 text-ink">
              {k === "City" && o.city && <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />}
              {v}
            </dd>
          </div>
        ))}
        {o.notes && (
          <div className="contents">
            <dt className="text-muted">Event details</dt>
            <dd className="whitespace-pre-line text-ink">{o.notes}</dd>
          </div>
        )}
      </dl>

      <div className="space-y-4">
        {o.artists.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Artists assigned</p>
            <div className="mt-2">
              <ArtistProfiles artists={o.artists} />
            </div>
          </div>
        )}
        {o.shortlisted && o.shortlisted.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Shortlisted for you</p>
            <p className="mt-1 text-sm text-muted">Artists who are free on your date. Open a profile to see their work.</p>
            <div className="mt-2">
              <ArtistProfiles artists={o.shortlisted} label="Shortlisted artists" />
            </div>
          </div>
        )}
        {o.artists.length === 0 && !o.shortlisted?.length && o.status !== "cancelled" && <p className="text-sm text-muted">No artists assigned yet. We&apos;ll share a shortlist once artists confirm they are free.</p>}
      </div>

      {(o.quote || o.payments.length > 0) && (
        <div className="rounded-xl bg-wash p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
            <span className="text-muted">
              Quote <strong className="ml-1 text-ink">{inr(o.quote)}</strong>
            </span>
            <span className="text-muted">
              Paid <strong className="ml-1 text-ink">{inr(paid)}</strong>
            </span>
            {o.quote ? (
              <span className="text-muted">
                Due <strong className="ml-1 text-ink">{inr(Math.max(0, o.quote - paid))}</strong>
              </span>
            ) : null}
          </div>
          {o.payments.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-line pt-3">
              {o.payments.map((p) => (
                <li key={p.utr} className="flex flex-wrap justify-between gap-2 text-body">
                  <span>
                    {inr(p.amount)} · UTR {p.utr}
                  </span>
                  <span className={p.status === "verified" ? "text-emerald-700" : "text-amber-700"}>{p.status === "verified" ? "Received" : "Being checked"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <a
          href={ask}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-whatsapp px-4 text-sm font-medium text-white hover:bg-whatsapp-hover"
        >
          <WhatsAppIcon /> Ask AOD about this
        </a>
        {o.again && o.again.length > 0 && (
          <button
            type="button"
            onClick={() => {
              startRebook({ audience: "business", occasion: o.occasion, needs: o.again!, city: o.city, time: o.time, endTime: o.endTime, details: o.notes });
              router.push("/book/business");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border-2 border-brand px-4 text-sm font-medium text-brand hover:bg-wash"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Book again
          </button>
        )}
      </div>
    </div>
  );
}
