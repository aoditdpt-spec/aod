"use client";

import Image from "next/image";
import Link from "@/components/ui/AppLink";
import { useState } from "react";
import { timeRange } from "@/lib/event-time";
import { act, ago, longDate, myOrders, parseDay, portfolioOf, rupees, sameMonth, shortDate, useDb, usePortalEmail, type Booking, type Db, type Profile } from "@/lib/app-db";
import { backendEnabled } from "@/lib/backend";
import { PortfolioLive } from "./PortfolioLive";
import { ChatThread } from "../ChatThread";
import { PushToggle } from "../push/PushToggle";
import { ApplicantDashboard } from "./Applicant";
import { CompleteProfile } from "./CompleteProfile";
import { MonthGrid, MonthSwitch } from "../MonthGrid";
import { Head, HeadLink, Loading, btn, btnInk, btnMain, btnText, field, label } from "../ui";

// The artist portal's pages (design-tests/test1.html), for the sample artist ART-201 (Aman Shah,
// a photographer). Requests are the admin's new orders in their category, so accepting one shows
// next to their name in the admin's booking drawer.

const profileFields: (keyof Profile)[] = ["name", "phone", "email", "city", "area", "experience", "languages", "about", "instagram", "website"];
const complete = (p: Profile) => Math.round((profileFields.filter((k) => p[k].trim()).length / profileFields.length) * 100);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

export function Dashboard() {
  const db = useDb();
  const email = usePortalEmail();
  const [month, setMonth] = useState<Date | null>(null);
  if (!db) return <Loading />;
  // Signed in with an applicant's email (not yet approved): their application's progress.
  const applicant = email ? db.applications.find((a) => a.email.toLowerCase() === email && a.stage !== "approved") : undefined;
  if (applicant) return <ApplicantDashboard app={applicant} />;
  const ME = db.me;
  const o = myOrders(db);
  const earned = db.payouts.filter((p) => p.artist === ME && p.sent && sameMonth(p.at, db.today)).reduce((n, p) => n + p.amount, 0);
  const pct = complete(db.profile);
  const team = db.messages.filter((m) => m.artist === ME).slice(-2).reverse();
  const files = backendEnabled ? portfolioOf(db).filter((f) => !f.video).map((f) => f.url) : samplePortfolio;
  const m = month ?? new Date(db.today.getFullYear(), db.today.getMonth(), 1);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-line pb-7">
        <div>
          <p className="text-sm text-muted">{longDate(db.today)}</p>
          <h1 className="mt-1.5 text-[34px]">
            {greeting()}, {db.profile.name.split(" ")[0] || "There"}
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm">
            <i className="h-[7px] w-[7px] rounded-full bg-[#1a9b4b]" />
            You&apos;re Live And Getting Requests
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/artists/availability" className={btnInk}>
            Mark Days Off
          </Link>
          <SendUpdate db={db} />
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-line sm:grid-cols-4">
        {[
          { v: String(o.toAnswer.length), l: "Requests To Answer", hot: o.toAnswer.length > 0 },
          { v: String(o.upcoming.length), l: "Upcoming Bookings" },
          { v: rupees(earned), l: `Earned In ${db.today.toLocaleDateString("en-GB", { month: "long" })}` },
          { v: `${pct}%`, l: "Profile Complete" },
        ].map((x, i) => (
          <div key={x.l} className={`py-6 ${i % 2 ? "border-l border-line pl-6" : ""} sm:pl-6 sm:first:pl-0 ${i ? "sm:border-l sm:border-line" : ""} max-sm:[&:nth-child(n+3)]:border-t max-sm:[&:nth-child(n+3)]:border-line`}>
            <b className={`block text-[30px] font-medium tracking-tight tabular-nums ${x.hot ? "text-brand" : ""}`}>{x.v}</b>
            <span className="text-sm text-muted">{x.l}</span>
          </div>
        ))}
      </div>

      <div className="mt-11 grid gap-14 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          <Head title="New Requests">
            <HeadLink href="/artists/bookings">All Bookings</HeadLink>
          </Head>
          {o.requests.length ? <RequestList db={db} list={o.requests.slice(0, 4)} /> : <p className="border-y border-line py-5 text-muted">No new requests right now.</p>}

          <Head title="Portfolio" className="mt-12">
            <HeadLink href="/artists/portfolio">{backendEnabled ? portfolioOf(db).length : samplePortfolio.length} Of 30 Files</HeadLink>
          </Head>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {files.slice(0, 5).map((src) => (
              <Image key={src} src={src} alt="" width={160} height={160} unoptimized className="aspect-square w-full rounded object-cover" />
            ))}
            <Link href="/artists/portfolio" className="grid aspect-square place-items-center rounded border border-dashed border-line text-[13px] text-muted hover:border-ink hover:text-ink">
              Add Photos
            </Link>
          </div>
        </div>

        <div className="min-w-0">
          <Head title={m.toLocaleDateString("en-GB", { month: "long" })}>
            <HeadLink href="/artists/availability">Edit Days Off</HeadLink>
          </Head>
          <SmallCalendar db={db} month={m} />
          <div className="mt-2 flex justify-end">
            <MonthSwitch month={m} onChange={setMonth} />
          </div>
          <Key />

          <Head title="Messages" className="mt-11">
            <HeadLink href="/artists/messages">Open</HeadLink>
          </Head>
          {team.map((msg) => (
            <div key={msg.id} className="border-t border-line py-3.5 text-sm">
              <small className="text-muted">
                {msg.from === "team" ? "AOD Team" : "You"}, {ago(msg.at)}
              </small>
              <p className="mt-1">
                {msg.from === "team" && msg.at > db.artistRead && <i className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-brand align-[2px]" />}
                {msg.text}
              </p>
            </div>
          ))}

          <Head title="Approval" className="mt-11">
            <HeadLink href="/artists/approval">Details</HeadLink>
          </Head>
          <Steps db={db} />
        </div>
      </div>
    </>
  );
}

const samplePortfolio: string[] = []; // no sample photos (on request, 2026-11-20); files the artist adds show here

function SendUpdate({ db }: { db: Db }) {
  return (
    <button type="button" onClick={() => act.sendUpdate()} className={btnInk} title={db.sentAt ? `Last sent ${ago(db.sentAt)}` : undefined}>
      {db.sentAt && Date.parse(db.sentAt) > db.today.getTime() ? "Update Sent" : "Send Update To AOD"}
    </button>
  );
}

// A request or booking: the date, what and where, the brief, the order ID and the actions.
function RequestList({ db, list, done }: { db: Db; list: Booking[]; done?: string }) {
  const ME = db.me;
  return (
    <div className="border-b border-line">
      {list.map((b) => {
        const reply = db.replies[b.id]?.[ME];
        const d = parseDay(b.date);
        return (
          <div key={b.id} className="grid grid-cols-[44px_1fr] gap-x-5 gap-y-3 border-t border-line py-[18px] sm:grid-cols-[56px_1fr_auto]">
            <div className="text-center leading-tight">
              <b className="block text-2xl font-medium">{d.getDate()}</b>
              <small className="text-xs text-muted">
                {d.toLocaleDateString("en-GB", { weekday: "short" })}, {d.toLocaleDateString("en-GB", { month: "short" })}
              </small>
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px]">
                {b.needs}
                {b.occasion && <span className="text-muted"> · {b.occasion}</span>}
              </h3>
              <div className="mt-1 text-sm text-muted">
                {b.start ? timeRange(b.start, b.end) : "Time To Confirm"} in {b.city}
                {b.source === "Business" && ", Business Booking"}
              </div>
              {/* The customer's brief for the artists (older samples have only the notes). */}
              {(b.brief || b.notes) && <p className="mt-2 border-l-2 border-line pl-3 text-sm text-ink/80">{b.brief || b.notes}</p>}
              <div className="mt-2 text-xs text-muted tabular-nums">{b.id}</div>
            </div>
            <div className="col-start-2 flex gap-1.5 sm:col-start-3">
              {done ? (
                <span className="whitespace-nowrap text-sm text-muted">{done}</span>
              ) : b.shortlist.includes(ME) ? (
                <span className="whitespace-nowrap text-sm font-medium">You&apos;re Shortlisted</span>
              ) : reply === "accepted" ? (
                <span className="whitespace-nowrap text-sm text-muted">Accepted, Waiting For AOD</span>
              ) : (
                <>
                  <button type="button" onClick={() => act.reply(b.id, ME, "accepted")} className={btnMain}>
                    Accept
                  </button>
                  <button type="button" onClick={() => act.reply(b.id, ME, "declined")} className={btnText}>
                    Decline
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SmallCalendar({ db, month }: { db: Db; month: Date }) {
  const booked = new Set(myOrders(db).upcoming.map((b) => b.date));
  return (
    <MonthGrid
      compact
      month={month}
      cell={(k, d) => {
        const isBooked = booked.has(k);
        const off = db.daysOff.includes(k);
        const past = k < db.todayKey;
        return (
          <button
            type="button"
            disabled={isBooked || past}
            onClick={() => act.toggleDayOff(k)}
            aria-label={`${shortDate(k)}${isBooked ? ", booked" : off ? ", day off" : ""}`}
            aria-pressed={off}
            className={`relative grid h-[38px] w-full place-items-center rounded-md transition-colors ${isBooked ? "bg-ink text-paper" : off ? "text-ink/35 line-through" : past ? "text-ink/25" : "hover:bg-wash"}`}
          >
            {d}
            {k === db.todayKey && <i className="absolute bottom-1 h-[5px] w-[5px] rounded-full bg-brand" />}
          </button>
        );
      }}
    />
  );
}

function Key() {
  return (
    <div className="mt-3 flex gap-4 text-[13px] text-muted">
      <span>
        <i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-sm bg-ink" />
        Booked
      </span>
      <span>
        <i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-sm bg-ink/30" />
        Day Off
      </span>
      <span>
        <i className="mr-1.5 inline-block h-[9px] w-[9px] rounded-full bg-brand" />
        Today
      </span>
    </div>
  );
}

function Steps({ db }: { db: Db }) {
  return (
    <ol className="text-sm">
      {db.approval.map((s) => (
        <li key={s.label} className="grid grid-cols-[20px_1fr_auto] gap-2.5 border-t border-line py-2.5">
          <span>✓</span>
          <span>{s.label}</span>
          <span className="text-muted">{shortDate(s.date)}</span>
        </li>
      ))}
    </ol>
  );
}

function PageTitle({ title, text }: { title: string; text?: string }) {
  return (
    <div className="border-b border-line pb-7">
      <h1 className="text-[34px]">{title}</h1>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </div>
  );
}

export function Bookings() {
  const db = useDb();
  if (!db) return <Loading />;
  const o = myOrders(db);
  const group = (title: string, list: Booking[], done?: (b: Booking) => string) => (
    <section className="mt-10">
      <Head title={title}>{list.length}</Head>
      {list.length ? (
        done ? (
          list.map((b) => <RequestList key={b.id} db={db} list={[b]} done={done(b)} />)
        ) : (
          <RequestList db={db} list={list} />
        )
      ) : (
        <p className="border-y border-line py-4 text-muted">Nothing here.</p>
      )}
    </section>
  );
  return (
    <>
      <PageTitle title="Bookings" text="Requests in your category, and the bookings you're chosen for." />
      {group("Requests", o.requests)}
      {group("Upcoming", o.upcoming, (b) => (b.stage === "confirmed" || b.stage === "advance" ? "Confirmed" : "You're Chosen"))}
      {group("Completed", o.completed, () => "Completed")}
      {group("Declined Or Cancelled", o.declined, (b) => (b.stage === "cancelled" ? "Cancelled" : "Declined"))}
    </>
  );
}

export function Availability() {
  const db = useDb();
  const [month, setMonth] = useState<Date | null>(null);
  if (!db) return <Loading />;
  const m = month ?? new Date(db.today.getFullYear(), db.today.getMonth(), 1);
  return (
    <>
      <PageTitle title="Availability" text="Tap a day to mark it off. AOD won't send requests for days you're off." />
      <div className="mt-8 flex justify-between">
        <Key />
        <MonthSwitch month={m} onChange={setMonth} />
      </div>
      <div className="mt-6 max-w-xl">
        <SmallCalendar db={db} month={m} />
      </div>
      <p className="mt-6 text-sm text-muted">{db.daysOff.filter((d) => d >= db.todayKey).length} Days Off Ahead</p>
    </>
  );
}

export function Approval() {
  const db = useDb();
  if (!db) return <Loading />;
  const checks = [
    ["Identity", "Verified By AOD"],
    ["Profile Photo", "Added"],
    ["Portfolio", `${backendEnabled ? portfolioOf(db).length : samplePortfolio.length} Files`],
    ["Artist Agreement", "Signed"],
    ["Payout Details", "Added"],
  ];
  return (
    <>
      <PageTitle title="Approval" text="Every step from your application to going live." />
      <div className="mt-10 grid gap-14 lg:grid-cols-2">
        <section>
          <Head title="Your Steps" />
          <Steps db={db} />
        </section>
        <section>
          <Head title="What AOD Checks" />
          <ul className="text-sm">
            {checks.map(([k, v]) => (
              <li key={k} className="flex justify-between border-t border-line py-2.5">
                <span>{k}</span>
                <span className="text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

const profileLabels: Record<keyof Profile, string> = {
  name: "Name",
  craft: "Craft",
  phone: "Phone",
  email: "Email",
  city: "City",
  area: "Area",
  experience: "Experience",
  languages: "Languages",
  about: "About Your Work",
  instagram: "Instagram",
  website: "Portfolio Link",
};

export function ProfilePage() {
  const db = useDb();
  const email = usePortalEmail();
  if (!db) return <Loading />;
  // A new artist (signed up, not yet approved): Complete Your Details.
  const applicant = email ? db.applications.find((a) => a.email.toLowerCase() === email && a.stage !== "approved") : undefined;
  if (applicant) return <CompleteProfile key={applicant.id} app={applicant} />;
  return <ProfileForm key={JSON.stringify(db.profile)} profile={db.profile} />;
}

function ProfileForm({ profile }: { profile: Profile }) {
  const [f, setF] = useState(profile);
  const [saved, setSaved] = useState(false);
  const locked: (keyof Profile)[] = ["name", "email", "craft"];
  return (
    <>
      <PageTitle title="Profile" text={`${complete(f)}% complete. Name, email and craft stay as AOD approved them.`} />
      <form
        className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          act.saveProfile(f);
          setSaved(true);
        }}
      >
        {(Object.keys(profileLabels) as (keyof Profile)[]).map((k) => (
          <label key={k} className={k === "about" ? "sm:col-span-2" : ""}>
            <span className={label}>{profileLabels[k]}</span>
            {k === "about" ? (
              <textarea value={f[k]} onChange={(e) => (setF({ ...f, [k]: e.target.value }), setSaved(false))} rows={4} className={`${field} h-auto py-2`} />
            ) : (
              <input value={f[k]} readOnly={locked.includes(k)} onChange={(e) => (setF({ ...f, [k]: e.target.value }), setSaved(false))} className={`${field} ${locked.includes(k) ? "bg-wash text-muted" : ""}`} />
            )}
          </label>
        ))}
        <div className="flex items-center gap-4 sm:col-span-2">
          <button className={btnMain}>Save Changes</button>
          {saved && <span className="text-sm text-muted">{backendEnabled ? "Saved." : "Saved In This Browser."}</span>}
        </div>
      </form>
    </>
  );
}

export function Portfolio() {
  if (backendEnabled) return <PortfolioLive />;
  return <PortfolioSample />;
}

function PortfolioSample() {
  const [added, setAdded] = useState<string[]>([]);
  const all = [...samplePortfolio, ...added];
  return (
    <>
      <PageTitle title="Portfolio" text={`${all.length} of 30 files. Photos up to 15 MB, videos up to 50 MB.`} />
      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {all.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element -- files added here are local object URLs
          <img key={src} src={src} alt="" className="aspect-square w-full rounded object-cover" />
        ))}
        {all.length < 30 && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded border border-dashed border-line text-[13px] text-muted hover:border-ink hover:text-ink">
            Add Photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])].slice(0, 30 - all.length);
                setAdded((a) => [...a, ...files.map((f) => URL.createObjectURL(f))]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </>
  );
}

export function MessagesPage() {
  const db = useDb();
  if (!db) return <Loading />;
  return (
    <>
      <PageTitle title="Messages" text="Your conversation with the AOD team." />
      <div className="mt-4">
        <PushToggle as="artist" />
      </div>
      <div className="mt-6 max-w-3xl">
        <ChatThread artist={db.me} side="artist" />
      </div>
    </>
  );
}

export function Documents() {
  const db = useDb();
  if (!db) return <Loading />;
  return (
    <>
      <PageTitle title="Documents" text="What AOD keeps on file for you." />
      <ul className="mt-8 max-w-2xl">
        {db.documents.map((d) => (
          <li key={d.title} className="flex justify-between gap-4 border-b border-line py-4">
            <span>
              {d.title}
              <small className="block text-[13px] text-muted">{shortDate(d.date)}</small>
            </span>
            <span className="text-muted">{d.status}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link href="/artists/messages" className={btn}>
          Ask AOD About A Document
        </Link>
      </div>
    </>
  );
}
