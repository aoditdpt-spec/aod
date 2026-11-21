"use client";

import Link from "@/components/ui/AppLink";
import { useState, useSyncExternalStore } from "react";
import { useAppRouter as useRouter } from "@/components/ui/AppLink";
import { act, CustomerData, CustomerReloader, customerSignOut, hoursLeft, parseDay, stageLabel, useCustomerInfo, useDb, type Booking, type Db } from "@/lib/app-db";
import { backendEnabled } from "@/lib/backend";
import { requestCode, verifyCode } from "@/server/actions/auth";
import { isCompanyEmail } from "@/server/actions/business";
import { isLocalCompanyEmail } from "@/lib/business";
import { primaryButton, secondaryButton } from "@/components/ui/buttons";
import { ArtistCards, EventRows, Payments, Progress, Timeline, bookAgain } from "./OrderParts";

// My Bookings, as on aod.co.in: sign in with the email you booked with and a 6-digit code, then
// every order made with that email, each with its progress, the artists shortlisted for you, the
// payments, cancelling within 2 hours, a review once it's done, raising a dispute and Book Again.
// Live: the code is emailed and the orders are the ones in the database made with that email
// (src/lib/app-db.tsx, CustomerData), updating by themselves. Test mode (no Supabase keys): no
// email is sent and any code works; the orders are the requests sent from this browser with that
// email, plus two labelled samples so there's always something to see.

const KEY = "aod-my-email";
const CANCEL_HOURS = 2;
const input = "h-12 w-full rounded-lg border border-line bg-paper px-4 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

const listeners = new Set<() => void>();
const readEmail = () => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
function setEmail(e: string) {
  try {
    if (e) localStorage.setItem(KEY, e);
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}
function useEmail() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readEmail,
    () => null,
  );
}

export function MyBookings() {
  return (
    <CustomerData>
      {backendEnabled && <CustomerReloader />}
      <Page />
    </CustomerData>
  );
}

function Page() {
  const local = useEmail();
  const live = useCustomerInfo();
  const db = useDb();
  if (backendEnabled) {
    if (live.status === "loading") return <p className="text-muted">Loading…</p>;
    if (live.status === "error") return <p className="text-muted">Couldn&apos;t load your bookings just now. Please refresh the page.</p>;
    if (live.status === "signed-out" || !db) return <SignIn />;
    return <Orders db={db} email={live.email} />;
  }
  if (local === null || !db) return <p className="text-muted">Loading…</p>;
  if (!local) return <SignIn />;
  return <Orders db={db} email={local} />;
}

function SignIn() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setE] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyEmail, setCompanyEmail] = useState(false);
  const { reload } = useCustomerInfo();
  return (
    <div className="max-w-md border-t border-ink pt-10">
      {companyEmail ? (
        // A company's email: its orders are in AOD For Business, not here (on request, 2026-11-21).
        <div className="space-y-5" role="status">
          <p className="text-xl font-medium">This Is A Company Email.</p>
          <p className="text-muted">
            <span className="text-ink">{email.trim().toLowerCase()}</span> belongs to a company account on AOD For Business. Its orders are in the business portal, not My Bookings.
          </p>
          <div className="flex flex-wrap gap-3 max-sm:*:flex-1">
            <Link href="/business" className={primaryButton}>
              Sign In To AOD For Business
            </Link>
            <button type="button" onClick={() => setCompanyEmail(false)} className={secondaryButton}>
              Use Another Email
            </button>
          </div>
        </div>
      ) : step === "email" ? (
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setError(null);
            // A company's email goes to AOD For Business instead.
            if (backendEnabled) setBusy(true);
            const company = backendEnabled ? await isCompanyEmail(email).catch(() => false) : isLocalCompanyEmail(email);
            if (company) {
              setBusy(false);
              return setCompanyEmail(true);
            }
            if (backendEnabled) {
              const res = await requestCode(email, "customer").catch(() => ({ ok: false as const, error: "Couldn't send the code just now. Please try again in a minute." }));
              setBusy(false);
              if (!res.ok) return setError(res.error);
            }
            setStep("code");
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm text-muted">The Email You Booked With</span>
            <input value={email} onChange={(e) => setE(e.target.value)} type="email" autoComplete="email" className={input} />
          </label>
          <button disabled={busy} className={`${primaryButton} w-full disabled:opacity-50`}>
            {busy ? "Sending…" : "Send OTP"}
          </button>
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
        </form>
      ) : (
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!backendEnabled) return setEmail(email.trim().toLowerCase() || "you@example.com");
            if (busy) return;
            setBusy(true);
            setError(null);
            const res = await verifyCode(email, code).catch(() => ({ ok: false as const, error: "Couldn't check the code just now. Please try again." }));
            setBusy(false);
            if (!res.ok) return setError(res.error);
            reload();
          }}
        >
          <label className="block">
            <span className="mb-2 block text-sm text-muted">Enter The OTP</span>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className={`${input} max-w-48 tracking-[0.3em]`} />
          </label>
          {backendEnabled ? (
            <p className="text-sm text-muted">
              We&apos;ve sent a 6-digit code to <span className="text-ink">{email}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3 max-sm:*:flex-1">
            <button type="button" onClick={() => setStep("email")} className={secondaryButton}>
              Back
            </button>
            <button disabled={busy || (backendEnabled && code.length !== 6)} className={`${primaryButton} disabled:opacity-50`}>
              {busy ? "Checking…" : "Sign In"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function ordersFor(db: Db, email: string) {
  // Live: the server already returns only this email's orders.
  if (backendEnabled) return db.bookings.filter((b) => !b.business).map((b) => ({ b, sample: false }));
  const mine = db.bookings.filter((b) => b.email && b.email.toLowerCase() === email && !b.business);
  // Two labelled samples: one with artists shortlisted, one finished (to try reviews).
  const samples = db.bookings.filter((b) => b.customer === "Joshi Reception" || b.customer === "Mehta Engagement");
  return [...mine.map((b) => ({ b, sample: false })), ...samples.map((b) => ({ b, sample: true }))];
}

function Orders({ db, email }: { db: Db; email: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const { reload } = useCustomerInfo();
  const signOut = async () => {
    if (!backendEnabled) return setEmail("");
    await customerSignOut();
    reload();
  };
  const orders = ordersFor(db, email);
  const current = orders.find((o) => o.b.id === open);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink pt-5 text-sm">
        <span className="text-muted">
          Signed In As <span className="text-ink">{email}</span>
        </span>
        <button type="button" onClick={() => void signOut()} className="text-muted underline-offset-4 hover:text-ink hover:underline">
          Sign Out
        </button>
      </div>
      {current ? (
        <OrderDetail db={db} b={current.b} sample={current.sample} onBack={() => setOpen(null)} />
      ) : (
        <ul className="mt-8 border-t border-line">
          {orders.map(({ b, sample }) => (
            <li key={b.id} className="border-b border-line">
              <button type="button" onClick={() => setOpen(b.id)} className="grid w-full gap-1 py-6 text-left transition-colors hover:bg-wash sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8">
                <span>
                  <span className="block text-2xl font-medium tracking-tight">{b.needs}</span>
                  <span className="mt-1 block text-muted">
                    {parseDay(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {b.venue || b.city} · {b.id}
                    {sample && " · Sample"}
                  </span>
                </span>
                <span>{b.customerCancelled ? "Cancelled By You" : stageLabel(b.stage)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!orders.length && <p className="mt-8 text-muted">No bookings with this email yet.</p>}
    </>
  );
}

function OrderDetail({ db, b, sample, onBack }: { db: Db; b: Booking; sample: boolean; onBack: () => void }) {
  const router = useRouter();
  const canCancel = b.stage !== "cancelled" && b.stage !== "completed" && hoursLeft(b.createdAt, CANCEL_HOURS) > 0;
  const [confirmCancel, setConfirmCancel] = useState(false);
  return (
    <div className="mt-8">
      <button type="button" onClick={onBack} className={secondaryButton}>
        Back
      </button>
      <h2 className="mt-10 text-4xl sm:text-5xl">{b.needs}</h2>
      <p className="mt-3 text-muted">
        {b.id}
        {sample && " · Sample"}
      </p>
      <div className="mt-10">
        <Progress b={b} />
      </div>

      <Block title="Your Event">
        <EventRows b={b} />
      </Block>
      <Block title="Shortlisted For You">
        <ArtistCards db={db} b={b} />
      </Block>
      <Block title="Payments">
        <Payments db={db} b={b} />
      </Block>
      {b.delivery && (
        <Block title="Your Files">
          <a href={b.delivery} target="_blank" rel="noopener noreferrer" className="break-all font-medium underline underline-offset-4">
            {b.delivery}
          </a>
        </Block>
      )}
      {b.stage === "completed" && (
        <Block title="Your Review">
          <ReviewBox b={b} />
        </Block>
      )}
      {canCancel && (
        <Block title="Changed Your Mind?">
          <p className="text-muted">You can cancel this request yourself within {CANCEL_HOURS} hours of sending it. After that, ask AOD; the refund policy applies.</p>
          {confirmCancel ? (
            <div className="mt-5 flex flex-wrap gap-3 max-sm:*:flex-1">
              <button type="button" onClick={() => setConfirmCancel(false)} className={secondaryButton}>
                Keep It
              </button>
              <button type="button" onClick={() => act.customerCancel(b.id)} className={primaryButton}>
                Yes, Cancel It
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmCancel(true)} className={`${secondaryButton} mt-5`}>
              Cancel This Request
            </button>
          )}
        </Block>
      )}
      <Block title="Timeline">
        <Timeline b={b} />
      </Block>

      <div className="mt-12 flex flex-wrap gap-3 max-sm:*:flex-1">
        <button
          type="button"
          onClick={() => {
            bookAgain(b);
            router.push("/book");
          }}
          className={primaryButton}
        >
          Book Again
        </button>
        <Link href={`/resolve/new?ref=${encodeURIComponent(b.id)}`} className={secondaryButton}>
          Raise A Dispute
        </Link>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h3 className="mb-5 text-2xl">{title}</h3>
      {children}
    </section>
  );
}

function ReviewBox({ b }: { b: Booking }) {
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  if (b.review)
    return (
      <div>
        <p className="text-2xl tracking-wider" aria-label={`${b.review.stars} of 5`}>
          {"★".repeat(b.review.stars)}
          <span className="text-line">{"★".repeat(5 - b.review.stars)}</span>
        </p>
        {b.review.text && <p className="mt-3 text-ink/80">{b.review.text}</p>}
      </div>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        act.review(b.id, stars || 5, text.trim());
      }}
    >
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} of 5`} onClick={() => setStars(n)} className={`text-3xl ${n <= stars ? "text-ink" : "text-line"}`}>
            ★
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="How was your artist?" aria-label="Your review" className={`${input} mt-4 h-auto py-3`} />
      <button className={`${primaryButton} mt-4`}>Send Review</button>
    </form>
  );
}
