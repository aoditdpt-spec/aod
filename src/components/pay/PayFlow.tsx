"use client";

import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, CreditCard, Lock, Printer, ShieldCheck, Smartphone } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { bank, payCopy, payee, purposes, upiApps } from "@/content/payments";
import { amountProblem, cleanUtr, formatINR, isUpiId, isUtr, parseAmount, UPI_MAX, upiUrl } from "@/lib/upi";
import { backendEnabled } from "@/lib/backend";
import { siteHref } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/whatsapp";
import { reportPayment } from "@/server/actions/public";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { CopyButton } from "./CopyButton";
import { UpiQr } from "./UpiQr";

type Step = "details" | "pay" | "confirm" | "sent";

const steps: { id: Step; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "pay", label: "Pay" },
  { id: "confirm", label: "Share ID" },
];

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 font-normal text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-brand aria-[invalid=true]:border-red-500";
const input = `mt-1.5 ${field}`;

// iPhones need app-specific UPI links. false on the server and until hydration.
const noSubscribe = () => () => {};
const useIsIos = () => useSyncExternalStore(noSubscribe, () => /iPhone|iPad|iPod/.test(navigator.userAgent), () => false);

// Text from a payment link, kept short and plain.
const fromLink = (v: string | null, max: number) => (v ?? "").replace(/[<>]/g, "").trim().slice(0, max);

// The payment page, in three steps: details → pay by UPI (QR code or app button) → send the UPI
// transaction ID on WhatsApp. A payment link from /pay/create fills in and locks the amount.
// It never says "paid" or "confirmed": only the AOD team can see the bank account.
export function PayFlow() {
  const params = useSearchParams();
  const linkAmount = parseAmount(params.get("amount") ?? "");
  const amountFixed = linkAmount !== null && !amountProblem(linkAmount);

  const [step, setStep] = useState<Step>("details");
  const [amountText, setAmountText] = useState(amountFixed ? String(linkAmount) : "");
  const [purpose, setPurpose] = useState(purposes[0]);
  const [details, setDetails] = useState(fromLink(params.get("for"), 80));
  const [bookingRef, setBookingRef] = useState(fromLink(params.get("ref"), 30));
  const [name, setName] = useState(fromLink(params.get("name"), 60));
  const [phone, setPhone] = useState("");
  const [utr, setUtr] = useState("");
  const [tried, setTried] = useState(false);
  // Live: the saved payment's reference, or why saving failed (the WhatsApp message still carries it all).
  const [savedAs, setSavedAs] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amount = parseAmount(amountText);
  const ready = isUpiId(payee.upiId);
  const phoneDigits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const errors: Record<string, string | null> = {
    amount: amountProblem(amount),
    name: name.trim().length < 2 ? "Enter your name so we can match the payment." : null,
    phone: phone && !/^[6-9]\d{9}$/.test(phoneDigits) ? "Enter a 10-digit mobile number, or leave it empty." : null,
  };
  const detailsOk = !errors.amount && !errors.name && !errors.phone;

  const note = `AOD ${bookingRef || purpose} ${name}`;
  const payment = amount ? { upiId: payee.upiId, payeeName: payee.name, amount, note } : null;
  const isIos = useIsIos();

  const summary = [
    `Hi AOD, I've paid ${amount ? formatINR(amount) : ""} by UPI.`,
    `For: ${purpose}${details ? ` (${details})` : ""}`,
    bookingRef && `Booking ref: ${bookingRef}`,
    `Name: ${name.trim()}`,
    phoneDigits && `Phone: +91 ${phoneDigits}`,
    `UPI transaction ID: ${cleanUtr(utr)}`,
    `Paid to: ${payee.upiId}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* What is being paid, always on top. */}
      <section className="rounded-[1.5rem] bg-night p-6 text-white sm:p-8 print:bg-white print:text-ink">
        <p className="text-sm text-white/70 print:text-muted">Paying</p>
        <p className="mt-1 text-xl font-medium">{payee.name}</p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/70 print:text-muted">Amount</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{amount ? formatINR(amount) : "₹—"}</p>
          </div>
          {amountFixed && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/80 print:hidden">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Set by AOD
            </span>
          )}
        </div>
        {(bookingRef || details) && (
          <dl className="mt-6 grid gap-x-6 gap-y-1 border-t border-white/15 pt-4 text-sm sm:grid-cols-[7rem_1fr] print:border-line">
            {bookingRef && (
              <>
                <dt className="text-white/60 print:text-muted">Booking ref</dt>
                <dd>{bookingRef}</dd>
              </>
            )}
            {details && (
              <>
                <dt className="text-white/60 print:text-muted">For</dt>
                <dd>{details}</dd>
              </>
            )}
          </dl>
        )}
      </section>

      {/* Step indicator */}
      {step !== "sent" && (
        <ol className="mt-6 flex items-center gap-2 text-sm print:hidden" aria-label="Payment steps">
          {steps.map((s, i) => {
            const index = steps.findIndex((x) => x.id === step);
            const done = i < index;
            const now = i === index;
            return (
              <li key={s.id} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    done ? "bg-brand text-white" : now ? "bg-peach text-brand-hover" : "bg-white text-muted ring-1 ring-line"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span className={now ? "font-medium text-ink" : "text-muted"} aria-current={now ? "step" : undefined}>
                  {s.label}
                </span>
                {i < steps.length - 1 && <span className="h-px flex-1 bg-line" aria-hidden />}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(40,28,21,0.06)] sm:p-8">
        {step === "details" && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setTried(true);
              if (detailsOk) setStep("pay");
            }}
            className="space-y-5"
          >
            <h2 className="text-xl font-medium">Payment details</h2>
            {!amountFixed && (
              <label className="block text-sm font-medium text-ink">
                Amount
                <div className="mt-1.5 flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-wash px-4 text-muted">₹</span>
                  <input
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value.replace(/[^\d.,]/g, "").slice(0, 10))}
                    inputMode="decimal"
                    placeholder="5,000"
                    aria-invalid={tried && !!errors.amount}
                    className={`${field} rounded-l-none text-lg`}
                  />
                </div>
                {tried && errors.amount ? (
                  <span className="mt-1.5 block text-xs font-normal text-red-600">{errors.amount}</span>
                ) : (
                  <span className="mt-1.5 block text-xs font-normal text-muted">Up to {formatINR(UPI_MAX)} in one UPI payment.</span>
                )}
              </label>
            )}
            <label className="block text-sm font-medium text-ink">
              What is this payment for?
              <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={input}>
                {purposes.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                Your name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 60))}
                  autoComplete="name"
                  aria-invalid={tried && !!errors.name}
                  className={input}
                />
                {tried && errors.name && <span className="mt-1.5 block text-xs font-normal text-red-600">{errors.name}</span>}
              </label>
              <label className="block text-sm font-medium text-ink">
                Mobile <span className="font-normal text-muted">(optional)</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="98250 12345"
                  aria-invalid={tried && !!errors.phone}
                  className={input}
                />
                {tried && errors.phone && <span className="mt-1.5 block text-xs font-normal text-red-600">{errors.phone}</span>}
              </label>
            </div>
            <label className="block text-sm font-medium text-ink">
              Booking reference <span className="font-normal text-muted">(optional)</span>
              <input
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value.replace(/[^a-zA-Z0-9 /-]/g, "").slice(0, 30))}
                placeholder="From your WhatsApp chat with AOD, e.g. B-1187"
                className={input}
              />
            </label>
            {!params.get("for") && (
              <label className="block text-sm font-medium text-ink">
                Notes <span className="font-normal text-muted">(optional)</span>
                <input
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, 80))}
                  placeholder="e.g. Wedding photography, 14 Dec"
                  className={input}
                />
              </label>
            )}
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-medium text-white hover:bg-brand-hover">
              Continue to pay {amount && !errors.amount ? formatINR(amount) : ""} <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-center text-xs text-muted">
              By paying you agree to our{" "}
              <a href={siteHref("/terms")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                terms
              </a>{" "}
              and{" "}
              <a href={siteHref("/refund-policy")} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                cancellation & refund policy
              </a>
              .
            </p>
          </form>
        )}

        {step === "pay" && payment && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-medium">Pay by UPI</h2>
              <BackButton onClick={() => setStep("details")} />
            </div>

            {!ready ? (
              <div className="mt-5 rounded-xl bg-wash p-5 text-sm text-ink">
                <p>{payCopy.setupMissing}</p>
                <a
                  href={whatsappUrl(`Hi AOD, I'd like to pay ${formatINR(payment.amount)}${bookingRef ? ` for booking ${bookingRef}` : ""}. Please share the payment details.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-whatsapp px-5 font-medium text-white hover:bg-whatsapp-hover"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Message AOD
                </a>
              </div>
            ) : (
              <>
                {/* Phones: open the UPI app directly. */}
                <div className="mt-5 lg:hidden">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <Smartphone className="h-4 w-4 text-brand" aria-hidden /> Open your UPI app
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {upiApps.map((app) => (
                      <a
                        key={app.name}
                        href={upiUrl(payment, isIos ? app.ios : app.android)}
                        className="flex h-12 items-center justify-center rounded-xl border border-line text-sm font-medium text-ink hover:border-brand hover:text-brand"
                      >
                        {app.name}
                      </a>
                    ))}
                    {!isIos && (
                      <a
                        href={upiUrl(payment)}
                        className="flex h-12 items-center justify-center rounded-xl bg-brand text-sm font-medium text-white hover:bg-brand-hover"
                      >
                        Any UPI app
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid items-center gap-6 sm:grid-cols-[13rem_1fr]">
                  <div className="mx-auto w-52 sm:w-full">
                    <UpiQr value={upiUrl(payment)} label={`UPI QR code to pay ${formatINR(payment.amount)} to ${payee.name}`} />
                  </div>
                  <div className="text-sm text-body">
                    <p className="font-medium text-ink">Scan with any UPI app</p>
                    <p className="mt-1">Google Pay, PhonePe, Paytm, BHIM or your bank&apos;s app. The amount fills in by itself.</p>
                    <p className="mt-3 lg:hidden">On this phone? Take a screenshot and choose &ldquo;Scan from gallery&rdquo; in your UPI app.</p>
                    <div className="mt-4 rounded-xl bg-wash p-3">
                      <p className="text-xs text-muted">Or pay to UPI ID</p>
                      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-ink">{payee.upiId}</span>
                        <CopyButton text={payee.upiId} />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-6 flex items-start gap-2 rounded-xl border border-brand/30 bg-peach/40 p-4 text-sm text-ink">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <span>
                    {payCopy.checkName} <strong className="font-medium">{payee.name}</strong>. You pay inside your own app; AOD never
                    sees your UPI PIN or bank details.
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-medium text-white hover:bg-brand-hover"
                >
                  I&apos;ve paid <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </>
            )}

            {ready && bank.accountNumber && bank.ifsc && (
              <details className="mt-6 rounded-xl border border-line p-4 text-sm">
                <summary className="cursor-pointer font-medium text-ink">Pay by bank transfer instead (NEFT / IMPS)</summary>
                <dl className="mt-3 space-y-2">
                  {[
                    ["Account name", bank.accountName || payee.name],
                    ["Account number", bank.accountNumber],
                    ["IFSC", bank.ifsc],
                    ["Bank", bank.bankName],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <dt className="text-muted">{k}</dt>
                        <dd className="flex items-center gap-2 font-medium text-ink">
                          {v} <CopyButton text={v} label="Copy" className="py-0.5" />
                        </dd>
                      </div>
                    ))}
                </dl>
                <p className="mt-3 text-xs text-muted">Put {bookingRef || "your name"} in the transfer remarks, then share the bank reference (UTR) in the next step.</p>
              </details>
            )}

            {/* Razorpay goes here: cards, netbanking and wallets, with automatic confirmation. */}
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
              <CreditCard className="h-5 w-5 shrink-0" aria-hidden />
              <span className="flex-1">{payCopy.cardsSoon}</span>
              <span className="rounded-md bg-wash px-2 py-0.5 text-xs font-medium">Coming soon</span>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setTried(true);
              if (!isUtr(utr) || saving) return;
              if (!backendEnabled) {
                window.open(whatsappUrl(summary), "_blank", "noopener,noreferrer");
                setStep("sent");
                return;
              }
              // Live: open the WhatsApp tab inside the click (so it isn't blocked), save the
              // transaction ID for AOD's finance team to verify, then show WhatsApp in that tab.
              const tab = window.open("", "_blank");
              setSaving(true);
              const res = await reportPayment({ amount: amount ?? 0, utr, name, phone, bookingRef, purpose });
              setSaving(false);
              if (res.ok) setSavedAs(res.id);
              else setSaveError(res.error);
              if (tab) {
                tab.opener = null;
                tab.location.href = whatsappUrl(summary);
              } else window.open(whatsappUrl(summary), "_blank", "noopener,noreferrer");
              setStep("sent");
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-medium">Share your transaction ID</h2>
              <BackButton onClick={() => setStep("pay")} />
            </div>
            <p className="mt-3 text-sm text-body">{payCopy.afterPay}</p>
            <label className="mt-5 block text-sm font-medium text-ink">
              UPI transaction ID (UTR)
              <input
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/[^\d ]/g, "").slice(0, 16))}
                inputMode="numeric"
                placeholder="12 digits, e.g. 4271 0058 3349"
                aria-invalid={tried && !isUtr(utr)}
                className={`${input} text-lg tracking-wider`}
              />
              {tried && !isUtr(utr) ? (
                <span className="mt-1.5 block text-xs font-normal text-red-600">The UPI transaction ID is 12 digits.</span>
              ) : (
                <span className="mt-1.5 block text-xs font-normal text-muted">
                  Find it in your UPI app&apos;s payment history, labelled &ldquo;UPI transaction ID&rdquo;, &ldquo;UTR&rdquo; or &ldquo;UPI Ref No&rdquo;.
                </span>
              )}
            </label>
            <button type="submit" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-whatsapp font-medium text-white hover:bg-whatsapp-hover">
              <WhatsAppIcon className="h-4 w-4" /> Send payment details on WhatsApp
            </button>
            <p className="mt-3 text-center text-xs text-muted">You can attach a screenshot of the payment in the WhatsApp chat too.</p>
          </form>
        )}

        {step === "sent" && amount && (
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
              <Clock className="h-6 w-6" aria-hidden />
            </span>
            <h2 className="mt-4 text-xl font-medium">{payCopy.notConfirmed}</h2>
            <p className="mt-2 text-sm text-body">
              {savedAs
                ? "AOD has your transaction ID. Once it's matched with AOD's bank account, you'll get a confirmation by email and on WhatsApp. Keep the transaction ID until then."
                : "Your payment details are ready in WhatsApp. Once we've matched the transaction ID with our bank account, we'll confirm there. Keep the transaction ID until then."}
            </p>
            {saveError && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="alert">
                {saveError}
              </p>
            )}
            <dl className="mt-5 space-y-2 rounded-xl bg-wash p-4 text-sm">
              <Row label="Amount">{formatINR(amount)}</Row>
              <Row label="For">
                {purpose}
                {details ? ` (${details})` : ""}
              </Row>
              {bookingRef && <Row label="Booking ref">{bookingRef}</Row>}
              <Row label="Name">{name.trim()}</Row>
              <Row label="Transaction ID">{cleanUtr(utr)}</Row>
              {savedAs && <Row label="Payment ref">{savedAs}</Row>}
              <Row label="Paid to">{payee.upiId}</Row>
              <Row label="Status">{payCopy.notConfirmed}</Row>
            </dl>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row print:hidden">
              <a
                href={whatsappUrl(summary)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-whatsapp px-5 font-medium text-white hover:bg-whatsapp-hover"
              >
                <WhatsAppIcon className="h-4 w-4" /> Open WhatsApp again
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-line px-5 font-medium text-ink hover:border-ink"
              >
                <Printer className="h-4 w-4" aria-hidden /> Save or print
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink print:hidden">
      <ArrowLeft className="h-4 w-4" aria-hidden /> Back
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}
