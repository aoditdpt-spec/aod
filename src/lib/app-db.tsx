"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { categories } from "@/data/site";
import { kindName, kindOf, kinds } from "@/data/work-questions";
import { showNotice } from "@/lib/notice";
import { backendEnabled } from "@/lib/backend";
import { artistPhotoSrc } from "@/lib/artist-photo";
import { assignedArtists, worksIn } from "@/lib/booking-needs";
import * as admin from "@/lib/admin-store";
import * as portal from "@/lib/artist-live";
import { useArtistChat, useStaffChat, type ChatMessage, type ChatSummary } from "@/lib/chat";
import { listenLive } from "@/lib/live";
import { staffChatSummary } from "@/server/actions/chat";
import { cancelMyBooking, myOrders as loadMyOrders, submitReview, type MyOrders } from "@/server/actions/customer";
import { signOutAction } from "@/server/actions/auth";
import { sendNewsletter } from "@/server/actions/newsletter";
import * as mock from "./mock-db";
import { usePortalEmail as usePortalEmailLocal } from "./portal-session";
import type { Activity, AppDetails, AppStage, Application, Artist, Booking, Case, CaseStatus, Db, Event, Issue, Line, Msg, Payment, Payout, Post, PostStatus, Profile, Reply, Stage, Staff, Subscriber } from "./mock-db";

// The data the new screens read (src/components/dash, bookings, business), in one shape whatever
// is behind it:
//   - preview (no Supabase keys, src/lib/backend.ts): the sample "database" in src/lib/mock-db.ts,
//     kept in this browser, exactly as the redesign worked;
//   - live: each part of the site loads its own data from the backend and puts it here, through a
//     provider: the admin (<AdminData>, src/lib/admin-store.ts and the chat), the artist portal
//     (<PortalData>, src/lib/artist-live.ts) and My Bookings / AOD For Business (<CustomerData>,
//     the customer's own orders). `act.*` turns each button into the matching save.
// Screens import everything from here (never from mock-db directly).

export * from "./mock-db";

const Live = createContext<Db | null | undefined>(undefined);

// The data, or null on the server, while it loads, and when signed out.
export function useDb(): Db | null {
  const live = useContext(Live);
  const sample = mock.useDb();
  return backendEnabled ? (live ?? null) : sample;
}

// ---------------------------------------------------------------------------------------------
// Shared mapping helpers

type AdminDb = admin.Db;
type AdminBooking = admin.Booking;

const DAY = 864e5;
const dayKey = mock.dayKey;
const isoDay = (iso: string | undefined) => (iso ? iso.slice(0, 10) : "");
const now = () => new Date().toISOString();
const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
const withCount = (label: string, n: number) => (n > 1 ? `${label} × ${n}` : label);

function emptyDb(): Db {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    me: "",
    today,
    todayKey: dayKey(today),
    bookings: [],
    replies: {},
    artists: [],
    applications: [],
    payments: [],
    payouts: [],
    cases: [],
    posts: [],
    subscribers: [],
    issues: [],
    staff: [],
    messages: [],
    teamRead: {},
    artistRead: "",
    settings: Object.fromEntries(mock.settingList.map((s) => [s.id, true])),
    activity: [],
    profile: { name: "", craft: "", phone: "", email: "", city: "", area: "", experience: "", languages: "", about: "", instagram: "", website: "" },
    daysOff: [],
    approval: [],
    documents: [],
    sentAt: undefined,
  };
}

// The order's stage as the new admin shows it. Older stages read as the nearest new one.
export function stageFrom(status: string): Stage {
  if (status === "matched" || status === "quoted" || status === "payment_pending") return "matched";
  if (status === "advance") return "advance";
  if (status === "confirmed" || status === "rescheduled") return "confirmed";
  if (status === "completed" || status === "delivered" || status === "reviewed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "new";
}
const statusText: Record<string, string> = {
  new: "Request received",
  matched: "Matched",
  advance: "Advance paid",
  quoted: "Quote sent",
  payment_pending: "Waiting for the payment",
  confirmed: "Confirmed",
  completed: "Completed",
  delivered: "Files delivered",
  reviewed: "Reviewed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
};

// "photographers" (a kind id) or "Photographers" (a kind as booked) → the kind's name.
const craftOf = (details: Record<string, unknown> | undefined, category: string) => {
  const k = String(details?.kind ?? "");
  return k && kinds.some((x) => x.id === k) ? kindName(k) : catName(category);
};
const instagramOf = (links: string[] | undefined) => {
  const ig = (links ?? []).find((l) => /instagram\.com\//i.test(l));
  return ig ? ig.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "") : "";
};
const otherLinkOf = (links: string[] | undefined) => (links ?? []).find((l) => !/instagram\.com\//i.test(l)) ?? "";

function bookingFrom(b: AdminBooking): Booking {
  const lines: Line[] = b.items.map((i) => ({ category: i.category, name: i.service || catName(i.category), count: i.count }));
  const events: Event[] = [
    ...b.history.map((h) => ({ at: h.at, text: statusText[h.status] ?? h.status, by: h.by })),
    ...b.notesLog.map((n) => ({ at: n.at, text: n.text, by: n.by })),
  ].sort((x, y) => x.at.localeCompare(y.at));
  const cancelledByCustomer = b.status === "cancelled" ? b.history.find((h) => h.status === "cancelled" && h.by === "Customer")?.at : undefined;
  const source: Booking["source"] =
    b.audience === "Business" ? "Business" : b.source === "whatsapp" ? "WhatsApp" : b.source === "admin" || b.history[0]?.by !== "Website" ? (b.source === "website" ? "Website" : "Admin") : "Website";
  return {
    id: b.id,
    customer: b.customer.name,
    phone: b.customer.phone,
    email: b.customer.email,
    cats: [...new Set(b.items.map((i) => i.category))],
    needs: lines.map((l) => withCount(l.name, l.count)).join(", "),
    date: b.date,
    start: b.time,
    end: b.endTime ?? "",
    city: b.city,
    venue: b.venue || undefined,
    stage: stageFrom(b.status),
    quote: b.quote ?? null,
    source,
    notes: b.notes,
    assigned: assignedArtists(b.items),
    createdAt: b.createdAt,
    occasion: b.event || undefined,
    brief: b.brief?.note || undefined,
    budget: b.budget || undefined,
    lines,
    shortlist: b.shortlist,
    delivery: b.delivery?.link,
    history: events,
    review: b.review ? { stars: b.review.rating, text: b.review.text, at: b.history.find((h) => h.status === "reviewed")?.at ?? b.createdAt } : undefined,
    customerCancelled: cancelledByCustomer,
    business: b.audience === "Business",
  };
}

// The first payment of an order is its advance, the rest its balance (payments carry no kind).
function paymentsFrom(a: AdminDb): Payment[] {
  const sorted = [...a.payments].sort((x, y) => x.reportedAt.localeCompare(y.reportedAt));
  const seen = new Set<string>();
  return sorted
    .filter((p) => p.status !== "rejected")
    .map((p) => {
      const first = !seen.has(p.bookingId);
      seen.add(p.bookingId);
      const b = a.bookings.find((x) => x.id === p.bookingId || x.requestRef === p.bookingId);
      return { id: p.id, booking: b?.id ?? p.bookingId, customer: b?.customer.name ?? p.payer, amount: p.amount, kind: first ? "Advance" : "Balance", utr: p.utr, at: p.reportedAt, verified: p.status === "verified" } satisfies Payment;
    })
    .reverse();
}

const caseStatusFrom = (s: admin.CaseStatus): CaseStatus => (s === "received" ? "new" : s === "acknowledged" || s === "investigating" ? "replied" : s === "escalated" ? "escalated" : "resolved");
const caseStatusTo = (s: CaseStatus): admin.CaseStatus => (s === "new" ? "received" : s === "replied" ? "acknowledged" : s);
const caseRole = (r: admin.ResolutionCase["role"]): Case["role"] => (r === "artist" ? "Artist" : r === "business" ? "Business" : "Customer");

const appStageFrom = (s: admin.ApplicationStatus): AppStage => (s === "submitted" ? "review" : s);

function appDetailsFrom(details: Record<string, unknown> | undefined, extra: { photo: string; languages: string[]; services: string[]; bio: string }): AppDetails {
  const d = details ?? {};
  return {
    photo: extra.photo || undefined,
    dob: String(d.dob ?? "") || undefined,
    area: String(d.locality ?? "") || undefined,
    languages: extra.languages,
    kind: String(d.kind ?? "") || undefined,
    other: Array.isArray(d.other) ? d.other.map(String) : undefined,
    services: extra.services,
    about: extra.bio || undefined,
    agree: d.agree === "yes",
    work: Object.fromEntries(Object.entries(d).filter(([k]) => k.includes("."))) as Record<string, string | string[]>,
  };
}

const lastSent = (notes: { by: string; at: string }[] | undefined) => notes?.find((n) => n.by === "Artist portal")?.at;

function postFrom(p: admin.Post): Post {
  const scheduled = p.status === "published" && !!p.publishedAt && p.publishedAt > now();
  const status: PostStatus = p.status === "draft" ? "Draft" : scheduled ? "Scheduled" : "Published";
  return { id: p.id, title: p.title, status, date: isoDay(p.publishedAt ?? p.createdAt), author: p.author, slug: p.slug, summary: p.excerpt, body: p.body, tags: p.tags.join(", "), cover: p.cover || undefined };
}

// Admin Settings: the new admin's switches, and the names the server checks (notifyEnabled).
const settingNames: Record<string, string> = {
  booking: "New booking request",
  application: "New artist application",
  cancelled: "Customer cancelled a booking",
  business: "New business account",
  artistMessage: "New artist message",
};

// ---------------------------------------------------------------------------------------------
// The admin (live)

type StaffChat = { summary: ChatSummary; open: Record<string, ChatMessage[]> };

function adminView(a: AdminDb, chat: StaffChat, session: admin.Session | null): Db {
  const base = emptyDb();
  const bookings = a.bookings.map(bookingFrom).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  const replies: Record<string, Record<string, Reply>> = {};
  for (const b of a.bookings) for (const r of b.replies ?? []) (replies[b.id] ??= {})[r.artistId] = r.status === "declined" ? "declined" : "accepted";

  // Chat: an open conversation's messages, or the last message of each other one (for the list).
  const messages: Msg[] = [];
  const teamRead: Record<string, string> = {};
  const unread: Record<string, number> = {};
  for (const [artist, s] of Object.entries(chat.summary)) {
    unread[artist] = s.unread;
    const full = chat.open[artist];
    if (full) for (const m of full) messages.push({ id: m.id, artist, from: m.fromArtist ? "artist" : "team", by: m.fromArtist ? undefined : m.sender, text: m.body, at: m.at });
    else messages.push({ id: `last-${artist}`, artist, from: s.last.fromArtist ? "artist" : "team", text: s.last.body, at: s.last.at });
  }
  for (const [artist, list] of Object.entries(chat.open)) {
    if (chat.summary[artist]) continue;
    for (const m of list) messages.push({ id: m.id, artist, from: m.fromArtist ? "artist" : "team", by: m.fromArtist ? undefined : m.sender, text: m.body, at: m.at });
  }
  messages.sort((x, y) => x.at.localeCompare(y.at));

  return {
    ...base,
    me: session?.email ?? "",
    bookings,
    replies,
    artists: a.artists.map(
      (x): Artist => ({
        id: x.id,
        name: x.name,
        craft: craftOf(x.details, x.category),
        cats: [x.category, ...x.otherCategories].filter(Boolean),
        city: x.city,
        photo: artistPhotoSrc(x.id, x.photo),
        email: x.email,
        phone: x.phone,
        since: isoDay(x.joinedAt),
        active: x.status === "active",
      }),
    ),
    applications: a.applications.map(
      (x): Application => ({
        id: x.id,
        name: x.name,
        craft: craftOf(x.details, x.category),
        cat: x.category,
        city: x.city,
        photo: artistPhotoSrc(x.id, x.photo),
        applied: isoDay(x.submittedAt),
        stage: appStageFrom(x.status),
        meetingAt: x.meeting?.at,
        email: x.email,
        phone: x.phone,
        submittedAt: lastSent(x.notes),
        experience: x.experience,
        instagram: instagramOf(x.links),
        link: otherLinkOf(x.links),
        details: appDetailsFrom(x.details, { photo: artistPhotoSrc(x.id, x.photo), languages: x.languages, services: x.services, bio: x.bio }),
      }),
    ),
    payments: paymentsFrom(a),
    payouts: a.payouts.map((p): Payout => {
      const b = a.bookings.find((x) => x.id === p.bookingId);
      return { id: p.id, booking: p.bookingId, artist: p.artistId, amount: p.amount, at: p.paidAt ?? (b?.date ? `${b.date}T00:00:00` : now()), sent: p.status === "paid" };
    }),
    cases: a.cases
      .map(
        (c): Case => ({
          id: c.id,
          role: caseRole(c.role),
          name: c.name,
          about: c.issue,
          booking: c.bookingRef || "Booked outside AOD",
          outside: !c.bookingRef,
          raisedAt: c.createdAt,
          status: caseStatusFrom(c.status),
          email: c.email,
          details: c.description,
          outcome: c.outcome,
          otherParty: c.otherParty,
          notes: c.notes.map((n) => ({ at: n.at, text: n.text, by: n.by })),
          decision: c.resolution,
        }),
      )
      .sort((x, y) => y.raisedAt.localeCompare(x.raisedAt)),
    posts: a.posts.map(postFrom).sort((x, y) => y.date.localeCompare(x.date)),
    subscribers: a.subscribers.filter((s) => s.status !== "unsubscribed").map((s): Subscriber => ({ email: s.email, status: s.status === "subscribed" ? "Confirmed" : "Pending", since: isoDay(s.createdAt) })),
    issues: a.newsletters.filter((n) => n.status === "sent").map((n): Issue => ({ id: n.id, subject: n.subject, body: n.body, sentAt: n.sentAt, count: n.recipients })),
    staff: a.team.filter((m) => m.active).map((m): Staff => ({ id: m.id, name: m.name, email: m.email, role: m.role === "owner" ? "Admin" : "Developer" })),
    messages,
    teamRead,
    unread,
    settings: Object.fromEntries(mock.settingList.map((s) => [s.id, a.settings.notify[settingNames[s.id]] !== false])),
    activity: a.activity.map((x): Activity => ({ at: x.at, text: x.text, by: x.by })),
  } as Db;
}

export function AdminData({ children }: { children: ReactNode }) {
  if (!backendEnabled) return <>{children}</>;
  return <AdminLive>{children}</AdminLive>;
}

function AdminLive({ children }: { children: ReactNode }) {
  const a = admin.useDb();
  const session = admin.useSession();
  const [summary, setSummary] = useState<ChatSummary>({});
  // The chat list reloads whenever the admin's data does (the "staff" live channel).
  useEffect(() => {
    if (!a) return;
    let stale = false;
    void staffChatSummary()
      .then((r) => !stale && r.ok && setSummary(r.summary))
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [a]);
  const db = useMemo(() => (a ? adminView(a, { summary, open: {} }, session) : null), [a, summary, session]);
  return <Live.Provider value={db}>{children}</Live.Provider>;
}

// ---------------------------------------------------------------------------------------------
// The artist portal (live)

const PortalInfo = createContext<{ status: "loading" | "signed-out" | "no-account" | "ready" | "error"; email: string; kind: "artist" | "applicant" | "" }>({ status: "loading", email: "", kind: "" });

const portalStage = (s: string, mine: boolean): Stage => stageFrom(s === "selected" && mine ? "matched" : s);

function portalView(p: portal.PortalData, team: ChatMessage[]): Db {
  const base = emptyDb();
  const prof = p.profile;
  const work = (prof.work ?? {}) as Record<string, unknown>;
  const craft = craftOf(work, prof.category);
  const photo = p.photoSrc;
  const me: Artist = { id: p.id, name: prof.fullName, craft, cats: [prof.category, ...prof.otherCategories].filter(Boolean), city: prof.city, photo, email: prof.email, phone: prof.phone, since: isoDay(p.approvedAt), active: true };
  const replies: Record<string, Record<string, Reply>> = {};
  const bookings: Booking[] = p.bookings.map((b) => {
    const mine = b.status === "selected" || b.status === "confirmed" || b.status === "completed" || (b.status === "cancelled" && !!b.stage);
    if (b.status === "accepted" || b.status === "quoted") (replies[b.id] ??= {})[p.id] = "accepted";
    if (b.status === "declined") (replies[b.id] ??= {})[p.id] = "declined";
    const stage: Stage = b.status === "completed" ? "completed" : b.status === "cancelled" ? "cancelled" : b.status === "confirmed" ? (b.stage === "advance" ? "advance" : "confirmed") : b.status === "selected" ? "matched" : portalStage(b.stage, false);
    const assigned = b.status === "selected" || b.status === "confirmed" || b.status === "completed" || (b.status === "cancelled" && mine) ? [p.id] : [];
    return {
      id: b.ref ?? b.id,
      customer: "",
      phone: "",
      email: "",
      cats: [b.category].filter(Boolean),
      needs: withCount(b.kind || catName(b.category), b.team ?? 1),
      date: b.day,
      start: b.start,
      end: b.end,
      city: b.city,
      stage,
      quote: null,
      source: b.business ? "Business" : "Website",
      notes: b.note ?? "",
      assigned,
      createdAt: b.createdAt,
      occasion: b.occasion || undefined,
      brief: b.brief?.map((r) => `${r.label}: ${r.value}`).join("\n") || undefined,
      lines: [{ category: b.category, name: b.kind, count: b.team ?? 1 }],
      shortlist: b.status === "shortlisted" ? [p.id] : [],
      history: [],
      business: b.business,
    };
  });
  // The booking's own id, for answering (cards show the line's id).
  bookingIds.clear();
  for (const b of p.bookings) bookingIds.set(b.ref ?? b.id, b.id);
  for (const [k, v] of Object.entries(replies)) {
    const key = [...bookingIds].find(([, id]) => id === k)?.[0] ?? k;
    if (key !== k) {
      replies[key] = v;
      delete replies[k];
    }
  }

  const unreadTeam = team.filter((m) => !m.fromArtist && !m.read);
  const messages: Msg[] = team.map((m) => ({ id: m.id, artist: p.id, from: m.fromArtist ? "artist" : "team", text: m.body, at: m.at }));
  const steps = [
    { label: "Application Sent", date: isoDay(p.appliedAt) },
    ...(p.kind === "artist" ? [{ label: "Approved", date: isoDay(p.approvedAt) }] : []),
  ].filter((s) => s.date);
  const links = prof.links ?? [];

  return {
    ...base,
    me: p.id,
    bookings,
    replies,
    artists: [me],
    applications:
      p.kind === "applicant"
        ? [
            {
              id: p.id,
              name: prof.fullName,
              craft,
              cat: prof.category,
              city: prof.city,
              photo,
              applied: isoDay(p.appliedAt),
              stage: appStageFrom((p.applicationStatus ?? "submitted") as admin.ApplicationStatus),
              meetingAt: p.meeting?.at,
              email: prof.email,
              phone: prof.phone,
              submittedAt: p.sentToAodAt,
              experience: prof.experience,
              instagram: instagramOf(links),
              link: otherLinkOf(links),
              details: { ...appDetailsFrom({ ...work, dob: prof.dob, locality: prof.locality }, { photo, languages: prof.languages, services: prof.services, bio: prof.bio }), agree: prof.agreeTerms },
            },
          ]
        : [],
    messages,
    // Every team message read up to the first unread one.
    artistRead: unreadTeam.length ? new Date(new Date(unreadTeam[0].at).getTime() - 1).toISOString() : now(),
    profile: {
      name: prof.fullName,
      craft,
      phone: prof.phone,
      email: prof.email,
      city: prof.city,
      area: prof.locality ?? "",
      experience: prof.experience,
      languages: prof.languages.join(", "),
      about: prof.bio,
      instagram: instagramOf(links),
      website: otherLinkOf(links),
    },
    daysOff: p.blockedDates,
    approval: steps,
    documents: [{ title: "Identity Check", status: p.identityVerified ? "Verified By AOD" : "Pending", date: isoDay(p.approvedAt ?? p.appliedAt) || dayKey(new Date()) }],
    sentAt: p.sentToAodAt,
    portfolio: p.portfolio.map((f) => ({ url: f.url, name: f.name, video: f.type.startsWith("video/"), path: f.path })),
  } as Db;
}
const bookingIds = new Map<string, string>(); // the id a card shows → the order's id

export function PortalData({ children }: { children: ReactNode }) {
  if (!backendEnabled) return <>{children}</>;
  return <PortalLive>{children}</PortalLive>;
}

function PortalLive({ children }: { children: ReactNode }) {
  const state = portal.usePortalState();
  const data = state.status === "ready" ? state.data : null;
  const chat = useArtistChat(false, data);
  const db = useMemo(() => (data ? portalView(data, chat.messages) : null), [data, chat.messages]);
  const info = useMemo(
    () => ({
      status: state.status === "idle" ? "loading" : state.status,
      email: data?.email ?? (state.status === "no-account" ? state.email : ""),
      kind: data?.kind ?? "",
    }),
    [state, data],
  );
  return (
    <PortalInfo.Provider value={info as React.ContextType<typeof PortalInfo>}>
      <Live.Provider value={db}>{children}</Live.Provider>
    </PortalInfo.Provider>
  );
}

export const usePortalInfo = () => useContext(PortalInfo);

// The portal's signed-in email: live, the server's session; preview, the email typed at sign-in.
export function usePortalEmail(): string | null {
  const live = useContext(PortalInfo);
  const local = usePortalEmailLocal();
  return backendEnabled ? live.email || "" : local;
}

// ---------------------------------------------------------------------------------------------
// My Bookings and AOD For Business (live): the signed-in customer's own orders.

type CustomerState = { status: "loading" | "signed-out" | "ready" | "error"; email: string; reload: () => void };
const CustomerInfo = createContext<CustomerState>({ status: "loading", email: "", reload: () => {} });

function customerView(m: MyOrders): Db {
  const base = emptyDb();
  const artists = new Map<string, Artist>();
  const add = (x: { name: string; craft: string; city: string; profile?: { id: string; photo: string } }) => {
    const id = x.profile?.id ?? `A-${x.name}`;
    if (!artists.has(id)) artists.set(id, { id, name: x.name, craft: x.craft, cats: [], city: x.city, photo: x.profile?.photo ?? "", email: "", phone: "", since: "", active: true });
    return id;
  };
  const payments: Payment[] = [];
  const bookings: Booking[] = m.orders.map((o) => {
    const assigned = o.artists.map(add);
    const shortlist = [...assigned, ...(o.shortlisted ?? []).map(add)];
    o.payments.forEach((p, i) => payments.push({ id: `${o.id}-${i}`, booking: o.id, customer: "", amount: p.amount, kind: i === 0 ? "Advance" : "Balance", utr: p.utr, at: p.at, verified: p.status === "verified" }));
    const status = o.status === "sent" ? "new" : o.status;
    const lines: Line[] = o.lines?.length ? o.lines : (o.again ?? []).map((g, i) => ({ category: g.slug, name: o.services[i] ?? catName(g.slug), count: g.count }));
    return {
      id: o.id,
      customer: "",
      phone: "",
      email: m.email,
      cats: [...new Set(lines.map((l) => l.category))],
      needs: lines.length ? lines.map((l) => withCount(l.name.replace(/ × \d+$/, ""), l.count)).join(", ") : o.services.join(", "),
      date: o.date,
      start: o.time ?? "",
      end: o.endTime ?? "",
      city: o.city,
      venue: o.venue,
      stage: stageFrom(status),
      quote: o.quote ?? null,
      source: o.audience === "business" ? "Business" : "Website",
      notes: o.notes ?? "",
      assigned,
      createdAt: o.createdAt,
      occasion: o.occasion && o.occasion !== "Booking" ? o.occasion : undefined,
      lines,
      shortlist,
      delivery: o.delivery?.link,
      history: o.history.map((h) => ({ at: h.at, text: statusText[h.status] ?? h.status, by: "" })),
      review: o.review ? { stars: o.review.rating, text: o.review.text, at: o.createdAt } : undefined,
      customerCancelled: o.cancelledByYou,
      business: o.audience === "business",
    };
  });
  return { ...base, me: m.email, bookings, payments, artists: [...artists.values()] } as Db;
}

export function CustomerData({ children }: { children: ReactNode }) {
  if (!backendEnabled) return <>{children}</>;
  return <CustomerLive>{children}</CustomerLive>;
}

function CustomerLive({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MyOrders | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    loadMyOrders()
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  // Status changes, quotes, payments and delivery links appear without refreshing the page.
  useEffect(() => (data?.topic ? listenLive([data.topic], load) : undefined), [data?.topic, load]);
  const db = useMemo(() => (data ? customerView(data) : null), [data]);
  const info = useMemo<CustomerState>(
    () => ({ status: error ? "error" : data === undefined ? "loading" : data === null ? "signed-out" : "ready", email: data?.email ?? "", reload: load }),
    [data, error, load],
  );
  return (
    <CustomerInfo.Provider value={info}>
      <Live.Provider value={db}>{children}</Live.Provider>
    </CustomerInfo.Provider>
  );
}

export const useCustomerInfo = () => useContext(CustomerInfo);

export async function customerSignOut() {
  await signOutAction().catch(() => {});
}

// ---------------------------------------------------------------------------------------------
// Chat threads: the admin's conversation with one artist, or the artist's with the team.

export function useThread(artist: string, side: "team" | "artist") {
  const db = useDb();
  const session = admin.useSession();
  const staff = useStaffChat(backendEnabled && side === "team" ? artist : null, db, session?.name ?? "AOD Team");
  const mine = useArtistChat(true, db, backendEnabled && side === "artist");
  if (!backendEnabled) {
    const list = db?.messages.filter((m) => m.artist === artist) ?? [];
    return {
      list,
      send: async (text: string) => mock.act.send(artist, side, text),
      error: null as string | null,
      sending: false,
      markRead: () => (side === "team" ? mock.act.readByTeam(artist) : mock.act.readByArtist()),
      unread: side === "team" ? list.some((m) => m.from === "artist" && m.at > (db?.teamRead[artist] ?? "")) : list.some((m) => m.from === "team" && m.at > (db?.artistRead ?? "")),
    };
  }
  const source = side === "team" ? staff.messages : mine.messages;
  const list: Msg[] = source.map((m) => ({ id: m.id, artist, from: m.fromArtist ? "artist" : "team", by: m.fromArtist ? undefined : m.sender, text: m.body, at: m.at }));
  return {
    list,
    send: async (text: string) => {
      await (side === "team" ? staff.send(text) : mine.send(text));
    },
    error: side === "team" ? staff.error : mine.error,
    sending: side === "team" ? staff.sending : mine.sending,
    markRead: () => {}, // the server marks a conversation read when it's opened
    unread: false,
  };
}

// ---------------------------------------------------------------------------------------------
// Counts and unread, reading the live per-artist unread counts where there are any.

export const teamUnread = (d: Db, artist: string): number => {
  const live = (d as Db & { unread?: Record<string, number> }).unread;
  return live ? (live[artist] ?? 0) : mock.teamUnread(d, artist);
};

export function counts(d: Db) {
  return {
    newRequests: d.bookings.filter((b) => b.stage === "new").length,
    applications: d.applications.filter((a) => a.stage !== "approved" && a.stage !== "rejected").length,
    toVerify: d.payments.filter((p) => !p.verified).length,
    cases: d.cases.filter((c) => c.status === "new" || c.status === "escalated").length,
    unread: d.artists.reduce((n, a) => n + teamUnread(d, a.id), 0),
  };
}

// The portal's files (live): the artist's portfolio in storage.
export type PortfolioItem = { url: string; name: string; video: boolean; path: string };
export const portfolioOf = (d: Db): PortfolioItem[] => (d as Db & { portfolio?: PortfolioItem[] }).portfolio ?? [];

// ---------------------------------------------------------------------------------------------
// Changes. Preview: the sample store (mock-db). Live: the admin's changes go through
// admin-store's update() (saved, checked against the person's role, logged); the portal's through
// its server actions.

const by = () => admin.currentUser();
const alertError = (e: string | null | undefined) => {
  if (e) showNotice(e);
};
const findBooking = (d: AdminDb, id: string) => d.bookings.find((b) => b.id === id);
const pushHistory = (b: AdminBooking, status: admin.BookingStatus) => b.history.push({ at: now(), by: by(), status });
const pushNote = (b: AdminBooking, text: string) => b.notesLog.unshift({ at: now(), by: by(), text });

const liveAct = {
  setStage(id: string, stage: Stage) {
    admin.update("Bookings", `Moved ${id} to ${mock.stageLabel(stage)}`, (d) => {
      const b = findBooking(d, id);
      if (!b || b.status === stage) return;
      b.status = stage;
      pushHistory(b, stage);
    }, id);
  },
  setQuote(id: string, quote: number | null) {
    admin.update("Bookings", `Quote for ${id} set to ${quote === null ? "none" : mock.rupees(quote)}`, (d) => {
      const b = findBooking(d, id);
      if (!b) return;
      b.quote = quote ?? undefined;
      pushNote(b, quote === null ? "Quote removed" : `Quote ${mock.rupees(quote)}`);
    }, id);
  },
  toggleAssign(id: string, artistId: string) {
    admin.update("Bookings", `Assignment changed on ${id}`, (d) => {
      const b = findBooking(d, id);
      const artist = d.artists.find((x) => x.id === artistId);
      if (!b) return;
      const on = b.items.some((i) => i.artistIds.includes(artistId));
      if (on) {
        for (const i of b.items) i.artistIds = i.artistIds.filter((x) => x !== artistId);
        pushNote(b, `Removed ${artist?.name ?? artistId}`);
        if (!assignedArtists(b.items).length && b.status === "matched") {
          b.status = "new";
          pushHistory(b, "new");
        }
      } else {
        // Their own line that still needs someone, else any line in their categories, else the first.
        const fits = (i: (typeof b.items)[number]) => (artist ? worksIn(artist, i.category) : true);
        const line = b.items.find((i) => fits(i) && i.artistIds.length < i.count) ?? b.items.find(fits) ?? b.items[0];
        if (!line) return;
        line.artistIds = [...line.artistIds, artistId];
        if (!b.shortlist.includes(artistId)) b.shortlist = [...b.shortlist, artistId];
        pushNote(b, `Assigned ${artist?.name ?? artistId}`);
        if (b.status === "new") {
          b.status = "matched";
          pushHistory(b, "matched");
        }
      }
    }, id);
  },
  reply(id: string, _artist: string, r: Reply) {
    void portal.answerRequest(bookingIds.get(id) ?? id, r).then(alertError);
  },
  setAppStage(id: string, stage: AppStage) {
    if (stage === "approved") return liveAct.approve(id);
    admin.update("Applications", `Moved ${id} to ${mock.appStageLabel(stage)}`, (d) => {
      const a = d.applications.find((x) => x.id === id);
      if (a) a.status = stage;
    }, id);
  },
  toggleArtist(id: string) {
    admin.update("Artists", `Changed ${id}'s status`, (d) => {
      const a = d.artists.find((x) => x.id === id);
      if (a) a.status = a.status === "active" ? "paused" : "active";
    }, id);
  },
  verify(payId: string) {
    admin.update("Payments", `Verified ${payId}`, (d) => {
      const p = d.payments.find((x) => x.id === payId);
      if (!p) return;
      p.status = "verified";
      p.checkedBy = by();
      p.checkedAt = now();
      const b = d.bookings.find((x) => x.id === p.bookingId || x.requestRef === p.bookingId);
      if (!b) return;
      // A verified advance (the order's first payment) moves a matched order on to Advance Paid.
      const first = d.payments.filter((x) => x.bookingId === p.bookingId && x.status !== "rejected").sort((x, y) => x.reportedAt.localeCompare(y.reportedAt))[0];
      if (first?.id === p.id && ["new", "matched", "quoted", "payment_pending"].includes(b.status)) {
        b.status = "advance";
        pushHistory(b, "advance");
      }
    }, payId);
  },
  sendPayout(id: string) {
    admin.update("Payments", `Payout ${id} sent`, (d) => {
      const p = d.payouts.find((x) => x.id === id);
      if (!p) return;
      p.status = "paid";
      p.paidAt = now();
    }, id);
  },
  setCase(id: string, status: CaseStatus) {
    admin.update("Dispute Desk", `Dispute ${id} marked ${mock.caseStatuses.find((c) => c.id === status)?.label}`, (d) => {
      const c = d.cases.find((x) => x.id === id);
      if (!c) return;
      c.status = caseStatusTo(status);
      c.history.push({ at: now(), by: by(), status: c.status });
    }, id);
  },
  setPost(id: string, status: PostStatus) {
    admin.update("Blog", `Post ${id} set to ${status}`, (d) => {
      const p = d.posts.find((x) => x.id === id);
      if (!p) return;
      p.updatedAt = now();
      if (status === "Draft") p.status = "draft";
      else {
        p.status = "published";
        if (status === "Published" && (!p.publishedAt || p.publishedAt > now())) p.publishedAt = now();
        if (status === "Scheduled" && (!p.publishedAt || p.publishedAt <= now())) p.publishedAt = new Date(Date.now() + DAY).toISOString();
      }
    }, id);
  },
  addPost(title: string) {
    const t = title || "Untitled Post";
    admin.update("Blog", `New draft "${t}"`, (d) => {
      const id = admin.newId("P");
      d.posts.unshift({ id, slug: `${mock.slugOf(t)}-${id.toLowerCase()}`, title: t, excerpt: "", body: "", cover: "", coverAlt: "", tags: [], author: by(), status: "draft", createdAt: now(), updatedAt: now() });
    });
  },
  send(artist: string, from: "team" | "artist", text: string) {
    void artist;
    void from;
    void text; // live chat goes through useThread()
  },
  readByTeam(artist: string) {
    void artist;
  },
  readByArtist() {},
  addStaff(name: string, email: string, role: Staff["role"]) {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean) || name.trim().length < 2) return showNotice("Enter their name and work email.");
    admin.update("Team", `Added ${name} as ${role}`, (d) => {
      if (d.team.some((m) => m.email.toLowerCase() === clean)) return;
      d.team.push({ id: admin.newId("U"), name: name.trim(), email: clean, role: role === "Admin" ? "owner" : "developer", active: true, twoFactor: false, lastActive: now() });
    });
  },
  setSetting(id: string, on: boolean) {
    admin.update("Settings", `${mock.settingList.find((s) => s.id === id)?.label} emails ${on ? "on" : "off"}`, (d) => {
      d.settings.notify = { ...d.settings.notify, [settingNames[id] ?? id]: on };
    });
  },
  saveProfile(profile: Partial<Profile>) {
    const links = [profile.instagram ? `https://www.instagram.com/${profile.instagram.replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")}/` : "", profile.website ?? ""].filter(Boolean);
    void portal
      .saveProfile({
        phone: profile.phone,
        city: profile.city,
        locality: profile.area,
        experience: profile.experience,
        languages: profile.languages?.split(",").map((l) => l.trim()).filter(Boolean),
        bio: profile.about,
        links,
      })
      .then(alertError);
  },
  toggleDayOff(day: string) {
    const current = portal.currentBlockedDates();
    void portal.setBlockedDates(current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort()).then(alertError);
  },
  sendUpdate() {
    void portal.sendProfileToAod().then(alertError);
  },
  addBooking(x: { customer: string; phone: string; email: string; cats: string[]; date: string; start: string; end: string; city: string; notes: string; venue?: string; budget?: string; occasion?: string; lines?: Line[] }) {
    const cats = x.cats.length ? x.cats : [categories[0].slug];
    const lines = x.lines?.length ? x.lines : cats.map((c) => ({ category: c, name: catName(c), count: 1 }));
    const id = admin.newOrderId(lines.map((l) => l.category));
    admin.update("Bookings", `Created ${id} for ${x.customer || "a customer"}`, (d) => {
      d.bookings.unshift({
        id,
        requestRef: id,
        createdAt: now(),
        audience: "Personal",
        customer: { name: x.customer, phone: x.phone, email: x.email.trim().toLowerCase() },
        items: lines.map((l) => ({ category: l.category, service: l.name, count: l.count, artistIds: [] })),
        event: x.occasion ?? "",
        date: x.date,
        time: x.start,
        endTime: x.end,
        city: x.city,
        venue: x.venue ?? "",
        budget: x.budget ?? "",
        notes: x.notes,
        status: "new",
        shortlist: [],
        history: [{ at: now(), by: by(), status: "new" }],
        notesLog: [],
        source: "admin",
      });
    }, id);
    return id;
  },
  setLineCount(id: string, index: number, count: number) {
    admin.update("Bookings", `${id}: artists needed changed`, (d) => {
      const b = findBooking(d, id);
      const i = b?.items[index];
      if (!b || !i) return;
      i.count = Math.max(1, Math.min(20, count));
      pushNote(b, `Needed: ${b.items.map((x) => withCount(x.service, x.count)).join(", ")}`);
    }, id);
  },
  toggleShortlist(id: string, artistId: string) {
    admin.update("Bookings", `Shortlist changed on ${id}`, (d) => {
      const b = findBooking(d, id);
      if (!b) return;
      const name = d.artists.find((a) => a.id === artistId)?.name ?? artistId;
      const on = b.shortlist.includes(artistId);
      b.shortlist = on ? b.shortlist.filter((a) => a !== artistId) : [...b.shortlist, artistId];
      pushNote(b, `${on ? "Removed" : "Shortlisted"} ${name}`);
    }, id);
  },
  setDelivery(id: string, link: string) {
    admin.update("Bookings", `Delivery link for ${id}`, (d) => {
      const b = findBooking(d, id);
      if (!b) return;
      b.delivery = { link: link.trim(), expires: new Date(Date.now() + (d.settings.deliveryLinkDays || 30) * DAY).toISOString() };
      pushNote(b, "Delivery link added");
    }, id);
  },
  reschedule(id: string, date: string, start: string, end: string) {
    admin.update("Bookings", `Rescheduled ${id}`, (d) => {
      const b = findBooking(d, id);
      if (!b) return;
      b.date = date;
      b.time = start;
      b.endTime = end;
      pushNote(b, `Moved to ${date ? mock.shortDate(date) : "a new date"}`);
    }, id);
  },
  deleteBooking(id: string) {
    admin.update("Bookings", `Deleted ${id}`, (d) => {
      d.bookings = d.bookings.filter((b) => b.id !== id);
      d.payments = d.payments.filter((p) => p.bookingId !== id);
      d.payouts = d.payouts.filter((p) => p.bookingId !== id);
    }, id);
  },
  recordPayment(id: string, amount: number, utr: string, kind: Payment["kind"]) {
    admin.update("Payments", `${kind} ${mock.rupees(amount || 0)} recorded for ${id}`, (d) => {
      const b = findBooking(d, id);
      d.payments.unshift({ id: admin.newId("PAY"), bookingId: id, amount: amount || 0, utr: utr.trim(), payer: b?.customer.name ?? "", reportedAt: now(), status: "pending" });
      if (b) pushNote(b, `${kind} ${mock.rupees(amount || 0)} recorded (UTR ${utr.trim() || "to add"})`);
    }, id);
  },
  addPayout(booking: string, artist: string, amount: number) {
    admin.update("Payments", `Payout added for ${booking}, ${mock.rupees(amount)}`, (d) => {
      d.payouts.unshift({ id: admin.newId("PO"), artistId: artist, bookingId: booking, amount, status: "due" });
    }, booking);
  },
  customerCancel(id: string) {
    void cancelMyBooking(id).then((r) => (r.ok ? customerReload() : showNotice(r.error)));
  },
  review(id: string, stars: number, text: string) {
    void submitReview(id, stars, text).then((r) => (r.ok ? customerReload() : showNotice(r.error)));
  },
  raiseCase(c: Omit<Case, "id" | "raisedAt" | "status" | "notes">) {
    void c;
    return ""; // live cases go through the Dispute Desk form's server action
  },
  caseNote(id: string, text: string) {
    admin.update("Dispute Desk", `Note on ${id}`, (d) => {
      const c = d.cases.find((x) => x.id === id);
      if (c && text.trim()) c.notes.push({ at: now(), by: by(), text: text.trim() });
    }, id);
  },
  caseDecision(id: string, text: string) {
    admin.update("Dispute Desk", `Decision written for ${id}`, (d) => {
      const c = d.cases.find((x) => x.id === id);
      if (c) c.resolution = text.trim();
    }, id);
  },
  escalate(id: string) {
    void id; // live: the tracking page escalates through the server
  },
  addArtist(a: Omit<Artist, "id" | "since" | "active">) {
    const id = admin.newId("ART");
    admin.update("Artists", `Added artist ${a.name}`, (d) => {
      const cats = a.cats.length ? a.cats : [categories[0].slug];
      d.artists.push({
        id,
        name: a.name,
        phone: a.phone,
        email: a.email.trim().toLowerCase(),
        city: a.city,
        category: cats[0],
        otherCategories: cats.slice(1),
        services: [],
        experience: "",
        languages: [],
        joinedAt: now(),
        status: "active",
        kyc: "pending",
        payoutUpi: "",
        blockedDates: [],
        notes: [],
        details: { kind: kindOf(a.craft, cats[0]) },
      });
    }, id);
    return id;
  },
  editArtist(id: string, edit: Partial<Artist>) {
    admin.update("Artists", `Edited ${id}'s profile`, (d) => {
      const a = d.artists.find((x) => x.id === id);
      if (!a) return;
      if (edit.name !== undefined) a.name = edit.name;
      if (edit.phone !== undefined) a.phone = edit.phone;
      if (edit.email !== undefined) a.email = edit.email.trim().toLowerCase();
      if (edit.city !== undefined) a.city = edit.city;
      if (edit.cats?.length) {
        a.category = edit.cats[0];
        a.otherCategories = edit.cats.slice(1);
      }
      if (edit.craft !== undefined) a.details = { ...(a.details ?? {}), kind: kindOf(edit.craft, a.category) };
    }, id);
  },
  setMeeting(id: string, iso: string) {
    admin.update("Applications", `Meeting with ${id} set`, (d) => {
      const a = d.applications.find((x) => x.id === id);
      if (!a) return;
      a.meeting = { at: iso, place: a.meeting?.place ?? "To be confirmed" };
      a.status = "meeting";
    }, id);
  },
  // Approving makes the applicant an artist with the same categories, profile, photo and answers.
  approve(id: string) {
    const artistId = admin.newId("ART");
    admin.update("Applications", `Approved ${id}; artist ${artistId} created`, (d) => {
      const a = d.applications.find((x) => x.id === id);
      if (!a || a.artistId) return;
      a.status = "approved";
      a.artistId = artistId;
      d.artists.push({
        id: artistId,
        name: a.name,
        phone: a.phone,
        email: a.email,
        city: a.city,
        category: a.category,
        otherCategories: a.otherCategories,
        services: a.services,
        experience: a.experience,
        languages: a.languages,
        joinedAt: now(),
        status: "active",
        kyc: a.kyc === "verified" ? "verified" : "pending",
        payoutUpi: "",
        blockedDates: [],
        notes: [],
        bio: a.bio,
        links: a.links,
        portfolio: a.portfolio,
        photo: a.photo,
        details: a.details,
      });
    }, id);
  },
  // Mark unapproved: the application goes back to Portfolio Review and the artist record made by
  // approving it is deleted (its replies and chat go with it). The admin only offers it while that
  // artist isn't on any order or payout.
  unapprove(id: string) {
    admin.update("Applications", `Marked ${id} unapproved`, (d) => {
      const a = d.applications.find((x) => x.id === id);
      if (!a) return;
      const email = a.email.toLowerCase();
      const artist = d.artists.find((x) => x.id === a.artistId) ?? d.artists.find((x) => x.email.toLowerCase() === email);
      a.status = "review";
      a.artistId = undefined;
      if (artist) d.artists = d.artists.filter((x) => x.id !== artist.id);
    }, id);
  },
  saveAppDetails(_appId: string, details: AppDetails) {
    void savePortalDetails(details).then(alertError);
  },
  submitForReview() {
    void portal.sendProfileToAod().then(alertError);
  },
  savePost(id: string, edit: Partial<Post>) {
    admin.update("Blog", `Saved post "${edit.title ?? id}"`, (d) => {
      const p = d.posts.find((x) => x.id === id);
      if (!p) return;
      if (edit.title !== undefined) p.title = edit.title;
      if (edit.slug !== undefined) p.slug = mock.slugOf(edit.slug) || p.slug;
      if (edit.summary !== undefined) p.excerpt = edit.summary;
      if (edit.body !== undefined) p.body = edit.body;
      if (edit.tags !== undefined) p.tags = edit.tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (edit.author !== undefined) p.author = edit.author;
      if (edit.cover !== undefined) p.cover = edit.cover;
      if (edit.date !== undefined && edit.date) p.publishedAt = new Date(`${edit.date}T09:00:00+05:30`).toISOString();
      if (edit.status !== undefined) p.status = edit.status === "Draft" ? "draft" : "published";
      p.updatedAt = now();
    }, id);
  },
  unsubscribe(email: string) {
    admin.update("Newsletter", `Unsubscribed ${email}`, (d) => {
      const s = d.subscribers.find((x) => x.email === email);
      if (!s) return;
      s.status = "unsubscribed";
      s.unsubscribedAt = now();
    });
  },
  sendIssue(subject: string, body: string) {
    const id = admin.newId("N");
    admin.update("Newsletter", `Newsletter "${subject}" written`, (d) => {
      d.newsletters.unshift({ id, subject: subject || "Untitled Issue", body, status: "draft", createdAt: now(), sentBy: by(), recipients: 0 });
    });
    // Sent once the draft is saved.
    window.setTimeout(() => {
      void sendNewsletter(id, subject, body, "all").then((r) => (r.ok ? showNotice(`Sent to ${r.sent} subscribers.`) : showNotice(r.error)));
    }, 1500);
  },
  reset() {},
};

// Complete Your Details (live): the answers, then the photo if it's a new one.
async function savePortalDetails(d: AppDetails): Promise<string | null> {
  const err = await portal.saveProfile({
    dob: d.dob,
    locality: d.area,
    languages: d.languages,
    services: d.services,
    bio: d.about,
    work: d.work,
    kind: d.kind,
    other: d.other,
    agree: d.agree,
  } as Parameters<typeof portal.saveProfile>[0]);
  if (err) return err;
  if (d.photo?.startsWith("data:image/")) return portal.changePhoto(d.photo);
  return null;
}

let customerReload = () => {};
export function CustomerReloader() {
  const { reload } = useCustomerInfo();
  useEffect(() => {
    customerReload = reload;
  }, [reload]);
  return null;
}

export const act: typeof mock.act = backendEnabled ? (liveAct as unknown as typeof mock.act) : mock.act;

// The admin's signed-in staff member (live), or the email typed in the preview.
export const useAdminSessionLive = admin.useSession;
export const reloadAdmin = admin.reloadAdmin;
export const adminSignOut = admin.signOut;
export const useAdminReady = admin.useBrowserReady;
export const useAdminError = admin.useAdminError;
export const useAdminSaving = admin.useAdminSaving;
export const useLiveConnection = admin.useLiveConnection;
export { portal as portalLive };
