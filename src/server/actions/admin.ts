"use server";

import type { Role } from "@/content/admin";
import type { Activity, Db, Session, Settings } from "@/lib/admin-store";
import { backendEnabled } from "@/lib/backend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fromRow, settingsFromRow, toRow } from "@/server/rows";

// The admin panel's data on the real database. The screens keep working on one `Db` object
// (src/lib/admin-store.ts): `loadAdminDb` fills it, and `saveAdminChanges` writes back just the
// records an action changed. Every call checks the signed-in staff member first, and the
// database's own rules (row-level security) check the role again on every row.

export type Collection = "applications" | "artists" | "bookings" | "payments" | "payouts" | "leads" | "cases" | "team";

// `changed` carries each record before and after the action, so only the fields that actually
// changed are written: two people (or the team and an artist in the portal) editing different
// parts of the same record at the same time don't undo each other.
export type AdminChanges = {
  added: Partial<Record<Collection, unknown[]>>;
  changed: Partial<Record<Collection, { before: unknown; after: unknown }[]>>;
  removed: Partial<Record<Collection, string[]>>;
  settings?: Settings;
  activity: Activity[];
};

export type SaveResult = { ok: true } | { ok: false; error: string };

// Which roles may change each kind of record (matches the buttons' permissions in src/content/admin.ts).
const writeRoles: Record<Collection | "settings", Role[]> = {
  applications: ["owner", "ops"],
  artists: ["owner", "ops"],
  bookings: ["owner", "ops", "finance"], // finance confirms bookings when verifying payments
  payments: ["owner", "ops", "finance"], // ops records payments from a booking
  payouts: ["owner", "finance"],
  leads: ["owner", "ops"],
  cases: ["owner", "ops"],
  team: ["owner"],
  settings: ["owner"],
};

const tables = {
  applications: { table: "applications", toRow: toRow.application },
  artists: { table: "artists", toRow: toRow.artist },
  bookings: { table: "bookings", toRow: toRow.booking },
  payments: { table: "payments", toRow: toRow.payment },
  payouts: { table: "payouts", toRow: toRow.payout },
  leads: { table: "leads", toRow: toRow.lead },
  cases: { table: "cases", toRow: toRow.case },
  team: { table: "staff", toRow: toRow.member },
} as const;

const labels: Record<Collection | "settings", string> = {
  applications: "applications",
  artists: "artists",
  bookings: "bookings",
  payments: "payments",
  payouts: "payouts",
  leads: "leads",
  cases: "resolution cases",
  team: "the team",
  settings: "settings",
};

// The signed-in, active staff member, with a database client acting as them.
async function currentStaff() {
  if (!backendEnabled) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email?.toLowerCase();
  if (!email) return null;
  const { data } = await supabase.from("staff").select("*").eq("email", email).eq("active", true).maybeSingle();
  if (!data) return null;
  return { supabase, staff: fromRow.member(data) };
}

export async function adminSession(): Promise<Session | null> {
  const me = await currentStaff();
  if (!me) return null;
  // Best effort: shows on Team & roles as "last active".
  await createAdminClient().from("staff").update({ last_active: new Date().toISOString() }).eq("id", me.staff.id);
  return { name: me.staff.name, email: me.staff.email, role: me.staff.role };
}

const defaultSettings: Settings = { commissionPct: 15, paymentHoldHours: 48, deliveryLinkDays: 30, advancePct: 30, notify: {} };

export async function loadAdminDb(): Promise<Db | null> {
  const me = await currentStaff();
  if (!me) return null;
  const s = me.supabase;
  const [applications, artists, bookings, payments, payouts, leads, cases, team, activity, settings, replies] = await Promise.all([
    s.from("applications").select("*").order("submitted_at", { ascending: false }),
    s.from("artists").select("*").order("joined_at", { ascending: false }),
    s.from("bookings").select("*").order("created_at", { ascending: false }),
    s.from("payments").select("*").order("reported_at", { ascending: false }),
    s.from("payouts").select("*").order("id", { ascending: false }),
    s.from("leads").select("*").order("created_at", { ascending: false }),
    s.from("cases").select("*").order("created_at", { ascending: false }),
    s.from("staff").select("*").order("created_at", { ascending: true }),
    s.from("activity").select("*").order("at", { ascending: false }).limit(500),
    s.from("settings").select("*").eq("id", 1).maybeSingle(),
    s.from("artist_replies").select("*"),
  ]);
  const failed = [applications, artists, bookings, payments, payouts, leads, cases, team, activity, settings, replies].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  return {
    version: 1,
    applications: (applications.data ?? []).map(fromRow.application),
    artists: (artists.data ?? []).map(fromRow.artist),
    // Each booking carries the shortlisted artists' replies from the portal.
    bookings: (bookings.data ?? []).map((r) => {
      const b = fromRow.booking(r);
      const own = (replies.data ?? []).map(fromRow.reply).filter((x) => x.bookingId === b.id);
      return own.length ? { ...b, replies: own.map((x) => ({ artistId: x.artistId, status: x.status, quote: x.quote, note: x.note, at: x.at })) } : b;
    }),
    payments: (payments.data ?? []).map(fromRow.payment),
    payouts: (payouts.data ?? []).map(fromRow.payout),
    leads: (leads.data ?? []).map(fromRow.lead),
    cases: (cases.data ?? []).map(fromRow.case),
    team: (team.data ?? []).map(fromRow.member),
    activity: (activity.data ?? []).map(fromRow.activity),
    settings: settingsFromRow(settings.data) ?? defaultSettings,
  };
}

export async function saveAdminChanges(changes: AdminChanges): Promise<SaveResult> {
  const me = await currentStaff();
  if (!me) return { ok: false, error: "You're signed out. Please sign in again." };
  const role = me.staff.role;

  // 1. Is this person allowed to change everything in this save?
  const touched = new Set<Collection | "settings">();
  for (const part of [changes.added, changes.changed, changes.removed]) {
    for (const [key, items] of Object.entries(part ?? {})) if (items?.length) touched.add(key as Collection);
  }
  if (changes.settings) touched.add("settings");
  for (const key of touched) {
    if (!(key in writeRoles)) return { ok: false, error: "Unknown kind of record." };
    if (!writeRoles[key].includes(role)) return { ok: false, error: `Your role can't change ${labels[key]}.` };
  }

  // 2. The team must keep at least one active owner.
  if (touched.has("team")) {
    const { data } = await me.supabase.from("staff").select("*");
    const byId = new Map((data ?? []).map((r) => [String(r.id), fromRow.member(r)]));
    for (const m of [...(changes.added.team ?? []), ...(changes.changed.team ?? []).map((c) => c.after)] as ReturnType<typeof fromRow.member>[]) byId.set(m.id, m);
    for (const id of changes.removed.team ?? []) byId.delete(id);
    if (![...byId.values()].some((m) => m.role === "owner" && m.active)) return { ok: false, error: "The team needs at least one active owner." };
  }

  // 3. Write. Row-level security checks the role again on every row.
  const s = me.supabase;
  for (const key of Object.keys(tables) as Collection[]) {
    const { table, toRow: convert } = tables[key];
    const added = (changes.added[key] ?? []) as Parameters<typeof convert>[0][];
    const changed = (changes.changed[key] ?? []) as { before: Parameters<typeof convert>[0]; after: Parameters<typeof convert>[0] }[];
    const removed = changes.removed[key] ?? [];

    if (added.length) {
      const { error } = await s.from(table).insert(added.map((x) => convert(x as never)));
      if (error) {
        if (error.code === "23505") return { ok: false, error: "Someone else just added a record with the same number. The page has been refreshed; please try again." };
        return { ok: false, error: `Couldn't save ${labels[key]}: ${error.message}` };
      }
    }
    for (const item of changed) {
      const now = convert(item.after as never) as Record<string, unknown>;
      const was = convert(item.before as never) as Record<string, unknown>;
      const patch = Object.fromEntries(Object.entries(now).filter(([k, v]) => k !== "id" && JSON.stringify(v) !== JSON.stringify(was[k])));
      if (!Object.keys(patch).length) continue;
      const { error, count } = await s.from(table).update(patch, { count: "exact" }).eq("id", now.id as string);
      if (error) return { ok: false, error: `Couldn't save ${labels[key]}: ${error.message}` };
      if (count === 0) return { ok: false, error: `Couldn't save ${labels[key]}: it may have been deleted, or your role can't change it.` };
    }
    if (removed.length) {
      const { error } = await s.from(table).delete().in("id", removed);
      if (error) return { ok: false, error: `Couldn't delete from ${labels[key]}: ${error.message}` };
    }
  }

  if (changes.settings) {
    const { error } = await s.from("settings").update({ data: changes.settings }).eq("id", 1);
    if (error) return { ok: false, error: `Couldn't save settings: ${error.message}` };
  }

  if (changes.activity.length) {
    // The log records who really made the change, whatever the browser says.
    const rows = changes.activity.map((a) => toRow.activity({ ...a, by: me.staff.name }));
    const { error } = await s.from("activity").insert(rows);
    if (error) console.error("[admin] activity log", error.message);
  }

  return { ok: true };
}
