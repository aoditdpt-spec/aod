"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Download, IndianRupee, Mail, MapPin, Scale, Star, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { customerSteps, myBookingsCopy, sampleOrders, type CustomerOrder } from "@/content/my-bookings";
import { brand } from "@/content/site";
import { backendEnabled } from "@/lib/backend";
import { timeRange } from "@/lib/event-time";
import { customerSessionStore, sentRequestsStore, type SentRequest } from "@/lib/customer-store";
import { useHydrated } from "@/lib/motion-safe";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { requestCode, signOutAction, verifyCode } from "@/server/actions/auth";
import { myOrders, submitReview, type MyOrders } from "@/server/actions/customer";

const inr = (n?: number) => (n === undefined ? "—" : `₹${n.toLocaleString("en-IN")}`);
const fmt = (s: string, time = false) => {
  if (!s) return "Not fixed yet";
  const d = new Date(s.length === 10 ? `${s}T00:00:00` : s);
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "numeric", minute: "2-digit" } : {}) });
};
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const statusInfo = (o: CustomerOrder) => {
  if (o.status === "sent") return { label: "Sent on WhatsApp", tone: "bg-wash text-muted" };
  if (o.status === "cancelled") return { label: "Cancelled", tone: "bg-red-50 text-red-700" };
  if (o.status === "rescheduled") return { label: "Rescheduled", tone: "bg-amber-50 text-amber-800" };
  const step = customerSteps.find((s) => s.id === o.status);
  const good = ["confirmed", "completed", "delivered", "reviewed"].includes(o.status);
  return { label: step?.label ?? o.status, tone: good ? "bg-emerald-50 text-emerald-700" : "bg-peach text-brand-hover" };
};

// What the customer should do next, if anything.
function nextAction(o: CustomerOrder): { text: string; href?: string; cta?: string } | null {
  const forText = `${o.services[0]}, ${fmt(o.date)}`;
  const pay = (amount: number) => `/pay?${new URLSearchParams({ amount: String(amount), ref: o.id, for: forText })}`;
  if (o.status === "quoted" && o.advance) return { text: `Pay the ${inr(o.advance)} advance to lock your date.`, href: pay(o.advance), cta: `Pay ${inr(o.advance)}` };
  if (o.status === "confirmed" && o.balance) return { text: `Balance of ${inr(o.balance.amount)} due by ${fmt(o.balance.dueBy)}.`, href: pay(o.balance.amount), cta: `Pay ${inr(o.balance.amount)}` };
  if (o.status === "payment_pending") return { text: "We're checking your payment. You'll get an email once it's confirmed." };
  if (o.status === "delivered" && o.delivery) return { text: `Your files are ready. Download them before ${fmt(o.delivery.expires)}.`, href: o.delivery.link, cta: "Open your files" };
  return null;
}

const fromRequest = (r: SentRequest): CustomerOrder => ({
  id: r.id,
  sample: false,
  createdAt: r.sentAt,
  status: "sent",
  occasion: r.occasion,
  services: r.needs,
  date: r.date,
  city: r.city,
  notes: r.details,
  payments: [],
  history: [],
});

// Customer bookings: sign in by email code, then every booking with its status, payments,
// artist and delivery.
// Live (backend set up): a real emailed code, and the bookings made with that email (the
// database only returns the customer's own). Preview: any code works, and the bookings are
// samples plus the requests sent from this browser.
export function MyBookings() {
  return backendEnabled ? <LiveMyBookings /> : <PreviewMyBookings />;
}

function PreviewMyBookings() {
  const hydrated = useHydrated();
  const session = customerSessionStore.use();
  const sentRequests = sentRequestsStore.use();
  const [samples] = useState(() => sampleOrders(new Date()));
  if (!hydrated) return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-[1.5rem] bg-wash" />;
  return session ? (
    <BookingsView email={session.email} orders={[...sentRequests.map(fromRequest), ...samples]} onSignOut={() => customerSessionStore.clear()} />
  ) : (
    <CustomerSignIn />
  );
}

function LiveMyBookings() {
  const [data, setData] = useState<MyOrders | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => {
    myOrders()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch(() => setError("Couldn't load your bookings just now. Please try again."));
  }, []);
  useEffect(load, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-[1.5rem] border border-line bg-white p-6 text-center text-sm text-body">
        {error}{" "}
        <button type="button" onClick={load} className="font-medium text-brand underline underline-offset-2">
          Try again
        </button>
      </div>
    );
  }
  if (data === undefined) return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-[1.5rem] bg-wash" />;
  if (data === null) return <CustomerSignIn onSignedIn={load} />;
  return (
    <BookingsView
      email={data.email}
      orders={data.orders}
      onSignOut={() => void signOutAction().then(() => setData(null))}
      onReview={async (id, rating, text) => {
        const res = await submitReview(id, rating, text);
        if (res.ok) load();
        return res.ok ? null : res.error;
      }}
    />
  );
}

function CustomerSignIn({ onSignedIn }: { onSignedIn?: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const field = "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 font-normal text-ink outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-md rounded-[1.5rem] border border-line bg-white p-6 shadow-[0_4px_16px_rgba(40,28,21,0.06)] sm:p-8">
      <h2 className="text-2xl font-normal">{myBookingsCopy.signInTitle}</h2>
      <p className="mt-2 text-sm text-body">{myBookingsCopy.signInText}</p>
      <form
        noValidate
        className="mt-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          if (!sent) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Enter a valid email address.");
            setError(null);
            if (backendEnabled) {
              setBusy(true);
              const res = await requestCode(email, "customer");
              setBusy(false);
              if (!res.ok) return setError(res.error);
            }
            setSent(true);
            return;
          }
          if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code.");
          if (!backendEnabled) return customerSessionStore.set({ email: email.trim() });
          setBusy(true);
          const res = await verifyCode(email, code);
          setBusy(false);
          if (!res.ok) return setError(res.error);
          onSignedIn?.();
        }}
      >
        <label className="block text-sm font-medium text-ink">
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} disabled={sent} type="email" autoComplete="email" placeholder="you@example.com" className={`${field} disabled:bg-wash`} />
        </label>
        {sent && (
          <label className="block text-sm font-medium text-ink">
            6-digit code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="••••••"
              className={`${field} text-center text-xl tracking-[0.5em]`}
            />
            <span className="mt-1.5 block text-xs font-normal text-muted">
              Sent to {email}.{" "}
              <button type="button" onClick={() => setSent(false)} className="font-medium text-brand underline underline-offset-2">
                Change
              </button>
            </span>
          </label>
        )}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand font-medium text-white hover:bg-brand-hover">
          {sent ? "Show my bookings" : (
            <>
              <Mail className="h-4 w-4" aria-hidden /> Send code by email
            </>
          )}
        </button>
        {sent && !backendEnabled && <p className="rounded-lg bg-wash p-3 text-xs text-muted">Preview: no email is sent yet. Enter any 6 digits.</p>}
      </form>
    </div>
  );
}

type ReviewFn = (id: string, rating: number, text: string) => Promise<string | null>; // null = saved, else the error

function BookingsView({ email, orders, onSignOut, onReview }: { email: string; orders: CustomerOrder[]; onSignOut: () => void; onReview?: ReviewFn }) {
  const [tab, setTab] = useState<"active" | "past">("active");
  const [openId, setOpenId] = useState<string | null>(null);
  const isPast = (o: CustomerOrder) => ["delivered", "reviewed", "cancelled"].includes(o.status) || (o.date !== "" && o.date < todayKey());
  const list = orders.filter((o) => (tab === "past" ? isPast(o) : !isPast(o)));
  const open = orders.find((o) => o.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium sm:text-4xl">{myBookingsCopy.title}</h1>
          <p className="mt-1 text-sm text-muted">
            Signed in as {email} ·{" "}
            <button type="button" onClick={onSignOut} className="font-medium text-brand underline underline-offset-2">
              Sign out
            </button>
          </p>
        </div>
        <Link href="/book" className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-medium text-white hover:bg-brand-hover">
          New booking <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <div className={open ? "hidden lg:block" : ""}>
          <div role="tablist" aria-label="Bookings" className="flex gap-1 rounded-xl bg-wash p-1">
            {(
              [
                ["active", "Upcoming & active"],
                ["past", "Past"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{myBookingsCopy.empty}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {list.map((o) => {
                const s = statusInfo(o);
                const action = nextAction(o);
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(o.id)}
                      aria-current={openId === o.id ? "true" : undefined}
                      className={`w-full rounded-2xl border bg-white p-4 text-left transition hover:border-brand/50 hover:shadow-md ${openId === o.id ? "border-brand" : "border-line"}`}
                    >
                      <span className="flex items-center justify-between gap-2 text-xs text-muted">
                        <span>
                          {o.ref ? `${o.ref} · ${o.id}` : o.id}
                          {o.sample && <span className="ml-2 rounded bg-wash px-1.5 py-0.5">Sample</span>}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 font-medium ${s.tone}`}>{s.label}</span>
                      </span>
                      <span className="mt-2 block font-medium text-ink">
                        {o.occasion} · {o.services.join(", ")}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {fmt(o.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden /> {o.city || "—"}
                        </span>
                      </span>
                      {action && <span className="mt-3 block rounded-lg bg-peach/50 px-3 py-2 text-xs font-medium text-ink">{action.text}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {open ? (
          <OrderDetail key={open.id} order={open} onBack={() => setOpenId(null)} onReview={onReview} />
        ) : (
          <div className="hidden min-h-[20rem] items-center justify-center rounded-2xl border border-dashed border-line text-sm text-muted lg:flex">
            Choose a booking to see everything about it.
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetail({ order: o, onBack, onReview }: { order: CustomerOrder; onBack: () => void; onReview?: ReviewFn }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const s = statusInfo(o);
  const action = nextAction(o);
  const current = customerSteps.findIndex((x) => x.id === o.status);
  const paid = o.payments.filter((p) => p.status === "verified").reduce((n, p) => n + p.amount, 0);
  const ask = whatsappUrl(`Hi AOD, about my booking ${o.id} (${o.occasion}, ${fmt(o.date)}): `);
  const changeMail = `mailto:${brand.email}?subject=${encodeURIComponent(`Change or cancel booking ${o.id}`)}&body=${encodeURIComponent(`Booking ${o.id}\nWhat I'd like to change:\n`)}`;
  const box = "rounded-2xl border border-line bg-white p-5";

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink lg:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All bookings
      </button>

      <div className={box}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">
              {o.id} · requested {fmt(o.createdAt)}
              {o.sample && <span className="ml-2 rounded bg-wash px-1.5 py-0.5">Sample</span>}
            </p>
            <h2 className="mt-1 text-xl font-medium sm:text-2xl">
              {o.occasion} · {o.services.join(", ")}
            </h2>
          </div>
          <span className={`rounded-md px-2.5 py-1 text-sm font-medium ${s.tone}`}>{s.label}</span>
        </div>

        {o.status === "sent" ? (
          <p className="mt-4 rounded-xl bg-wash p-4 text-sm text-body">
            You shared this request with AOD on WhatsApp. Once AOD&apos;s booking system is live, its status, quote and payments will
            update here and by email.
          </p>
        ) : (
          <ol className="mt-5 grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {customerSteps.slice(0, 7).map((step, i) => {
              const done = i < current || (i === current && ["confirmed", "completed", "delivered", "reviewed"].includes(step.id));
              const now = i === current;
              return (
                <li key={step.id} className="flex items-center gap-2 sm:flex-col sm:items-start">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                      done ? "bg-brand text-white" : now ? "bg-peach text-brand-hover ring-2 ring-brand" : "bg-wash text-muted"
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                  </span>
                  <span className={`text-xs ${now ? "font-medium text-ink" : done ? "text-ink" : "text-muted"}`}>
                    {step.label}
                    {now && <span className="sr-only"> (current)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {current >= 0 && <p className="mt-4 text-sm text-body">{customerSteps[current].text}</p>}

        {action && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-peach/50 p-4">
            <p className="text-sm font-medium text-ink">{action.text}</p>
            {action.href && (
              <a
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover"
              >
                {o.status === "delivered" ? <Download className="h-4 w-4" aria-hidden /> : <IndianRupee className="h-4 w-4" aria-hidden />}
                {action.cta}
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className={box}>
          <h3 className="font-medium text-ink">Event</h3>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Date", `${fmt(o.date)}${o.time ? `, ${timeRange(o.time, o.endTime)}` : ""}`],
              ["Place", [o.venue, o.city].filter(Boolean).join(", ") || "—"],
              ["Services", o.services.join(", ")],
              ["Notes", o.notes || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={box}>
          <h3 className="font-medium text-ink">Your artist</h3>
          {o.artist ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-peach text-brand">
                <UserRound className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="font-medium text-ink">{o.artist.name}</p>
                <p className="text-sm text-muted">
                  {o.artist.craft} · {o.artist.city}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">We&apos;ll share the artist once we&apos;ve matched your request.</p>
          )}
        </div>

        <div className={box}>
          <h3 className="font-medium text-ink">Payments</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Quote</dt>
              <dd className="text-ink">{inr(o.quote)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Paid and confirmed</dt>
              <dd className="font-medium text-ink">{inr(paid)}</dd>
            </div>
            {o.quote !== undefined && (
              <div className="flex justify-between border-t border-line pt-2">
                <dt className="text-muted">Remaining</dt>
                <dd className="font-medium text-ink">{inr(Math.max(0, o.quote - paid))}</dd>
              </div>
            )}
          </dl>
          {o.payments.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs">
              {o.payments.map((p) => (
                <li key={p.utr} className="flex justify-between gap-3">
                  <span className="text-muted">
                    {fmt(p.at)} · UTR {p.utr}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink">{inr(p.amount)}</span>
                    <span className={p.status === "verified" ? "text-emerald-700" : "text-amber-700"}>{p.status === "verified" ? "Confirmed" : "Being checked"}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={box}>
          <h3 className="font-medium text-ink">Need something?</h3>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a href={ask} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-medium text-ink hover:text-brand">
              <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Ask about this booking
            </a>
            <a href={changeMail} className="inline-flex items-center gap-2 font-medium text-ink hover:text-brand">
              <Mail className="h-4 w-4 text-brand" aria-hidden /> Change or cancel by email
            </a>
            <Link href={`/resolve/new?role=customer&ref=${encodeURIComponent(o.id)}`} className="inline-flex items-center gap-2 font-medium text-ink hover:text-brand">
              <Scale className="h-4 w-4 text-brand" aria-hidden /> Something went wrong? Raise a case
            </Link>
            <Link href="/refund-policy" className="text-xs text-muted underline underline-offset-2 hover:text-ink">
              Cancellation & refund policy
            </Link>
          </div>
        </div>
      </div>

      {o.history.length > 0 && (
        <div className={box}>
          <h3 className="font-medium text-ink">Timeline</h3>
          <ol className="mt-3 space-y-2 border-l-2 border-line pl-4 text-sm">
            {[...o.history].reverse().map((h) => (
              <li key={h.status}>
                <span className="text-ink">{customerSteps.find((x) => x.id === h.status)?.label}</span>
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted">
                  <Clock className="h-3 w-3" aria-hidden /> {fmt(h.at, true)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {o.status === "delivered" && (
        <div className={box}>
          <h3 className="font-medium text-ink">How was it?</h3>
          {reviewed ? (
            <p className="mt-3 text-sm text-body">
              Thanks for your review!{onReview ? "" : " (Preview: reviews are saved once the backend is live.)"}
            </p>
          ) : (
            <form
              className="mt-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!review.trim()) return;
                if (!onReview) return setReviewed(true);
                const err = await onReview(o.id, rating, review);
                if (err) setReviewError(err);
                else setReviewed(true);
              }}
            >
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
                    <Star className={`h-6 w-6 ${n <= rating ? "fill-brand-bright text-brand-bright" : "text-line"}`} aria-hidden />
                  </button>
                ))}
              </div>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                placeholder={`How was ${o.artist?.name ?? "your artist"}?`}
                className="mt-3 w-full resize-none rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand"
              />
              <button type="submit" disabled={!review.trim()} className="mt-2 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-40">
                Send review
              </button>
              {reviewError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {reviewError}
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
