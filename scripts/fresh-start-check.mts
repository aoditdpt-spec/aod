// Checks that the database can be built again from nothing: runs every migration on PGlite (with
// stand-ins for Supabase's auth and Realtime), adds some data, runs supabase/reset-everything.sql,
// checks nothing of AOD is left, then runs every migration again and checks the tables, the starting
// settings row and the live-update trigger are back. Run: npm run check:fresh
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const migrations = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(new URL(f, dir), "utf8"))
  .join("\n");
const reset = readFileSync(new URL("../supabase/reset-everything.sql", import.meta.url), "utf8");

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  grant execute on function auth.jwt() to anon, authenticated;
  create schema realtime;
  create table realtime.messages (id bigserial primary key, topic text, extension text, payload jsonb, event text, private boolean);
  create function realtime.topic() returns text language sql stable as $$ select current_setting('realtime.topic', true) $$;
  create function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void
    language sql as $$ insert into realtime.messages (topic, extension, payload, event, private) values (topic, 'broadcast', payload, event, private) $$;
  alter table realtime.messages enable row level security;
  grant usage on schema realtime to authenticated;
  grant select on realtime.messages to authenticated;
`);

let failures = 0;
const check = (label: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};
const n = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);
const tables = () => n(`select count(*)::int as n from pg_tables where schemaname = 'public'`);

await db.exec(migrations);
const before = await tables();
check("the migrations build the database", before >= 18, `${before} tables`);
await db.exec(`
  insert into staff (id, name, email, role) values ('U-1', 'Owner', 'owner@aod.test', 'owner');
  insert into bookings (id, customer_name, customer_email, category, status) values ('AOD-PH-261101', 'Asha', 'asha@x.test', 'photo-video', 'advance');
  insert into auth.users (email) values ('owner@aod.test'), ('asha@x.test');
`);

await db.exec(reset);
check("reset: no AOD table is left", (await tables()) === 0, `${await tables()} left`);
check("reset: the private schema is gone", (await n(`select count(*)::int as n from pg_namespace where nspname = 'private'`)) === 0);
check("reset: AOD's functions are gone", (await n(`select count(*)::int as n from pg_proc where pronamespace = 'public'::regnamespace`)) === 0);
check("reset: the live-updates rule is gone", (await n(`select count(*)::int as n from pg_policies where schemaname = 'realtime'`)) === 0);
check("reset: every sign-in account is gone", (await n(`select count(*)::int as n from auth.users`)) === 0);

await db.exec(migrations);
check("the migrations run again on the empty database", (await tables()) === before, `${await tables()} tables`);
check("the starting settings row is back", (await n(`select count(*)::int as n from settings where id = 1`)) === 1);
check("the live-updates rule is back", (await n(`select count(*)::int as n from pg_policies where schemaname = 'realtime'`)) === 1);
await db.exec(`insert into bookings (id, customer_name, customer_email, category, status) values ('AOD-PH-261101', 'Asha', 'asha@x.test', 'photo-video', 'advance')`);
check("a new booking (with the advance stage) saves and tells the live channel", (await n(`select count(*)::int as n from realtime.messages where topic = 'staff'`)) >= 1);

console.log(failures ? `\n${failures} failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
