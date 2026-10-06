"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { paymentStatuses } from "@/content/admin";
import { payee } from "@/content/payments";
import { currentUser, newId, update, useDb, type Db, type Payment, type Payout } from "@/lib/admin-store";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { CopyButton } from "@/components/pay/CopyButton";
import { PayLinkBuilder } from "@/components/pay/PayLinkBuilder";
import { DataTable, type Column } from "../DataTable";
import { ActionButton, ago, artistName, Card, Details, Drawer, DrawerSection, Empty, fieldBase, fillTemplate, fmtDate, inr, PageHeader, StageBadge, Stat, whatsappTo } from "../ui";
import { useOpen } from "../useOpen";

const tabs = [
  { id: "verify", label: "To verify" },
  { id: "all", label: "All payments" },
  { id: "payouts", label: "Artist payouts" },
  { id: "links", label: "Payment links" },
] as const;

// Verifying a payment confirms its booking (if it was waiting for payment) and logs both.
function verify(p: Payment) {
  update(
    "Payments",
    `Verified ${inr(p.amount)} from ${p.payer} (UTR ${p.utr})`,
    (db) => {
      const x = db.payments.find((y) => y.id === p.id)!;
      x.status = "verified";
      x.checkedBy = currentUser();
      x.checkedAt = new Date().toISOString();
      const b = db.bookings.find((y) => y.id === p.bookingId);
      if (b && ["quoted", "payment_pending", "matched", "new"].includes(b.status)) {
        b.status = "confirmed";
        b.history.push({ at: new Date().toISOString(), by: currentUser(), status: "confirmed" });
      }
    },
    p.id,
  );
}

function reject(p: Payment, reason: string) {
  update(
    "Payments",
    `Couldn't find ${inr(p.amount)} from ${p.payer} (UTR ${p.utr})`,
    (db) => {
      const x = db.payments.find((y) => y.id === p.id)!;
      x.status = "rejected";
      x.reason = reason || "No matching credit in the bank statement.";
      x.checkedBy = currentUser();
      x.checkedAt = new Date().toISOString();
    },
    p.id,
  );
}

export function Payments() {
  const db = useDb();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [openId, setOpen] = useOpen();
  const tab = (tabs.find((t) => t.id === params.get("tab"))?.id ?? "verify") as (typeof tabs)[number]["id"];
  if (!db) return null;

  const pending = db.payments.filter((p) => p.status === "pending");
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const verifiedMonth = db.payments.filter((p) => p.status === "verified" && p.checkedAt && new Date(p.checkedAt).getTime() >= monthStart);
  const due = db.payouts.filter((p) => p.status === "due");
  const open = db.payments.find((p) => p.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        text={
          <>
            Customers pay by UPI to <strong className="font-medium text-ink">{payee.upiId || "(UPI ID not set)"}</strong> and share the transaction ID. Check each one
            against the bank statement before verifying; verifying confirms the booking.
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="To verify" value={pending.length} note={inr(pending.reduce((n, p) => n + p.amount, 0))} tone={pending.length ? "alert" : undefined} />
        <Stat label="Verified this month" value={inr(verifiedMonth.reduce((n, p) => n + p.amount, 0))} note={`${verifiedMonth.length} payments`} />
        <Stat label="Payouts due" value={inr(due.reduce((n, p) => n + p.amount, 0))} note={`${due.length} artists`} />
        <Stat label="AOD commission" value={`${db.settings.commissionPct}%`} note="Set in Settings" />
      </div>

      <div role="tablist" aria-label="Payments" className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => router.push(t.id === "verify" ? pathname : `${pathname}?tab=${t.id}`, { scroll: false })}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.id ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
            {t.id === "verify" && pending.length > 0 && <span className="ml-1.5 rounded-full bg-brand px-1.5 text-xs text-white">{pending.length}</span>}
          </button>
        ))}
      </div>

      {tab === "verify" && (pending.length === 0 ? <Empty>No payments waiting. New ones appear when customers share a transaction ID.</Empty> : <div className="grid gap-4 xl:grid-cols-2">{pending.map((p) => <VerifyCard key={p.id} p={p} db={db} />)}</div>)}
      {tab === "all" && <AllPayments db={db} onOpen={(id) => setOpen(id)} />}
      {tab === "payouts" && <Payouts db={db} />}
      {tab === "links" && <PayLinkBuilder />}
      {open && <PaymentDrawer key={open.id} p={open} db={db} onClose={() => setOpen(null)} />}
    </div>
  );
}

function VerifyCard({ p, db }: { p: Payment; db: Db }) {
  const [reason, setReason] = useState("");
  const booking = db.bookings.find((b) => b.id === p.bookingId);
  const duplicate = db.payments.some((x) => x.id !== p.id && x.utr === p.utr);
  const expected = booking ? (booking.advance ?? booking.quote) : undefined;
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-medium text-ink">{inr(p.amount)}</p>
          <p className="text-sm text-muted">
            {p.payer} · reported {ago(p.reportedAt)}
          </p>
        </div>
        <StageBadge stages={paymentStatuses} id={p.status} />
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-wash p-2.5">
          <span>
            UTR <span className="font-mono font-medium text-ink">{p.utr}</span>
          </span>
          <CopyButton text={p.utr} label="Copy" className="py-1" />
        </div>
        {booking && (
          <p className="text-muted">
            For{" "}
            <Link href={`/admin/bookings?open=${booking.id}`} className="font-medium text-brand">
              {booking.id}
            </Link>{" "}
            · {booking.service} · expected {inr(expected)}
          </p>
        )}
        {duplicate && (
          <p className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" aria-hidden /> This UTR was already reported on another payment.
          </p>
        )}
        {expected !== undefined && expected !== p.amount && (
          <p className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" aria-hidden /> Amount differs from the expected {inr(expected)}.
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
        <ActionButton permission="payments.verify" onClick={() => verify(p)}>
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Found in bank: verify
        </ActionButton>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason if not found" className={`${fieldBase} min-w-0 flex-1`} />
        <ActionButton permission="payments.verify" variant="danger" onClick={() => reject(p, reason)}>
          <XCircle className="h-4 w-4" aria-hidden /> Not found
        </ActionButton>
      </div>
    </Card>
  );
}

function AllPayments({ db, onOpen }: { db: Db; onOpen: (id: string) => void }) {
  const columns: Column<Payment>[] = [
    { key: "id", label: "Payment", render: (p) => `${p.id} · ${p.payer}`, value: (p) => `${p.id} ${p.payer}` },
    { key: "amount", label: "Amount", render: (p) => inr(p.amount), value: (p) => p.amount },
    { key: "booking", label: "Booking", render: (p) => p.bookingId, value: (p) => p.bookingId },
    { key: "utr", label: "UTR", render: (p) => <span className="font-mono">{p.utr}</span>, value: (p) => p.utr, hideOnMobile: true },
    { key: "reported", label: "Reported", render: (p) => fmtDate(p.reportedAt, true), value: (p) => p.reportedAt, hideOnMobile: true },
    { key: "checked", label: "Checked by", render: (p) => p.checkedBy ?? "—", value: (p) => p.checkedBy ?? "", hideOnMobile: true },
    { key: "status", label: "Status", render: (p) => <StageBadge stages={paymentStatuses} id={p.status} />, value: (p) => paymentStatuses.find((s) => s.id === p.status)?.label },
  ];
  return (
    <DataTable
      rows={db.payments}
      columns={columns}
      getId={(p) => p.id}
      onOpen={(p) => onOpen(p.id)}
      exportName="payments"
      initialSort={{ key: "reported", dir: "desc" }}
      filters={[{ label: "Status", options: paymentStatuses.map((s) => ({ value: s.id, label: s.label })), test: (p, v) => p.status === v }]}
    />
  );
}

function PaymentDrawer({ p, db, onClose }: { p: Payment; db: Db; onClose: () => void }) {
  const booking = db.bookings.find((b) => b.id === p.bookingId);
  return (
    <Drawer open onClose={onClose} title={`${p.id} · ${inr(p.amount)}`} subtitle={<StageBadge stages={paymentStatuses} id={p.status} />}>
      <DrawerSection title="Payment">
        <Details
          rows={[
            ["Payer", p.payer],
            ["Amount", inr(p.amount)],
            ["UTR", <span key="u" className="font-mono">{p.utr}</span>],
            ["Reported", fmtDate(p.reportedAt, true)],
            ["Booking", booking ? <Link key="b" href={`/admin/bookings?open=${booking.id}`} className="text-brand">{booking.id} · {booking.service}</Link> : p.bookingId],
            ["Checked by", p.checkedBy ? `${p.checkedBy}, ${fmtDate(p.checkedAt, true)}` : "Not yet"],
            ["Reason", p.reason ?? "—"],
          ]}
        />
      </DrawerSection>
      {booking && p.status === "verified" && (
        <DrawerSection title="Tell the customer">
          <a
            href={whatsappTo(booking.customer.phone, fillTemplate("confirmed", { customer: booking.customer.name.split(" ")[0], ref: booking.id, artist: artistName(db, booking.artistId), service: booking.service, date: fmtDate(booking.date), city: booking.city }))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover"
          >
            <WhatsAppIcon className="h-4 w-4" /> Send &ldquo;booking confirmed&rdquo;
          </a>
        </DrawerSection>
      )}
      {booking && p.status === "rejected" && (
        <DrawerSection title="Tell the customer">
          <a
            href={whatsappTo(booking.customer.phone, `Hi ${booking.customer.name.split(" ")[0]}, we couldn't find your payment of ${inr(p.amount)} (UTR ${p.utr}) for ${booking.id}. Could you share a screenshot from your UPI app? – Team AOD`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover"
          >
            <WhatsAppIcon className="h-4 w-4" /> Ask for a screenshot
          </a>
        </DrawerSection>
      )}
    </Drawer>
  );
}

function Payouts({ db }: { db: Db }) {
  const [refs, setRefs] = useState<Record<string, string>>({});
  // Delivered or reviewed bookings that don't have a payout yet.
  const missing = db.bookings.filter((b) => ["delivered", "reviewed"].includes(b.status) && b.artistId && b.quote && !db.payouts.some((p) => p.bookingId === b.id));
  const share = (quote: number) => Math.round(quote * (1 - db.settings.commissionPct / 100));

  const columns: Column<Payout>[] = [
    { key: "artist", label: "Artist", render: (p) => artistName(db, p.artistId), value: (p) => artistName(db, p.artistId) },
    { key: "booking", label: "Booking", render: (p) => p.bookingId, value: (p) => p.bookingId },
    { key: "amount", label: "Amount", render: (p) => inr(p.amount), value: (p) => p.amount },
    { key: "upi", label: "Pay to", render: (p) => db.artists.find((a) => a.id === p.artistId)?.payoutUpi || "—", value: (p) => db.artists.find((a) => a.id === p.artistId)?.payoutUpi ?? "", hideOnMobile: true },
    {
      key: "status",
      label: "Status",
      render: (p) =>
        p.status === "paid" ? (
          <span className="text-xs text-muted">
            Paid {fmtDate(p.paidAt)} · {p.reference}
          </span>
        ) : (
          <span className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input value={refs[p.id] ?? ""} onChange={(e) => setRefs((r) => ({ ...r, [p.id]: e.target.value }))} placeholder="Bank / UPI ref" aria-label="Payout reference" className={`${fieldBase} w-36 py-1.5`} />
            <ActionButton
              permission="payouts.pay"
              variant="secondary"
              disabled={!refs[p.id]?.trim()}
              onClick={() =>
                update("Payments", `Paid ${inr(p.amount)} to ${artistName(db, p.artistId)} for ${p.bookingId}`, (d) => {
                  const x = d.payouts.find((y) => y.id === p.id)!;
                  x.status = "paid";
                  x.paidAt = new Date().toISOString();
                  x.reference = refs[p.id].trim();
                }, p.id)
              }
            >
              Mark paid
            </ActionButton>
          </span>
        ),
      value: (p) => p.status,
    },
  ];

  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <Card title="Ready for payout">
          <ul className="divide-y divide-line text-sm">
            {missing.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <span>
                  {b.id} · {artistName(db, b.artistId)} · quote {inr(b.quote)} → artist share <strong className="font-medium">{inr(share(b.quote!))}</strong>
                </span>
                <ActionButton
                  permission="payouts.pay"
                  variant="secondary"
                  onClick={() =>
                    update("Payments", `Added a payout of ${inr(share(b.quote!))} for ${b.id}`, (d) => void d.payouts.unshift({ id: newId("PO"), artistId: b.artistId!, bookingId: b.id, amount: share(b.quote!), status: "due" }), b.id)
                  }
                >
                  Add payout
                </ActionButton>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Artist share = quote minus the {db.settings.commissionPct}% AOD commission. Payouts go after delivery.</p>
        </Card>
      )}
      <DataTable
        rows={db.payouts}
        columns={columns}
        getId={(p) => p.id}
        exportName="payouts"
        filters={[{ label: "Status", options: [{ value: "due", label: "Due" }, { value: "paid", label: "Paid" }], test: (p, v) => p.status === v }]}
      />
    </div>
  );
}
