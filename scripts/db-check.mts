// Checks the database's access rules (supabase/migrations) without a Supabase project: runs the
// migrations on PGlite (real Postgres in WebAssembly) with stand-ins for Supabase's auth helpers,
// then tries reading and changing records as each kind of user. Run: npm run check:db
// Add a case here when you change a table's row-level security.
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const dir = new URL("../supabase/migrations/", import.meta.url);
const migration = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(new URL(f, dir), "utf8"))
  .join(String.fromCharCode(10));
const db = new PGlite();

// Supabase's roles and auth helpers (auth.jwt() reads the request's JWT claims, as on Supabase).
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  grant execute on function auth.jwt() to anon, authenticated;
`);
await db.exec(migration);
console.log("migration ran OK");

// Seed as the database owner (like the server's secret key).
await db.exec(`
  insert into staff (id, name, email, role) values
    ('U-1', 'Owner', 'owner@aod.test', 'owner'),
    ('U-2', 'Ops', 'ops@aod.test', 'ops'),
    ('U-3', 'Viewer', 'viewer@aod.test', 'viewer'),
    ('U-4', 'Gone', 'gone@aod.test', 'ops');
  update staff set active = false where id = 'U-4';
  insert into bookings (id, customer_name, customer_email, category, status) values
    ('B-1', 'Asha', 'asha@x.test', 'photographers', 'new'),
    ('B-2', 'Ravi', 'ravi@x.test', 'musicians-djs', 'quoted'),
    ('B-3', 'Phone only', '', 'editors', 'new');
  insert into payments (id, booking_id, amount, utr) values ('PAY-1', 'B-1', 5000, '111122223333'), ('PAY-2', 'B-2', 9000, '444455556666');
  insert into leads (id, name) values ('L-1', 'Lead');
  insert into cases (id, role, name, email, issue, description) values ('RC-1', 'customer', 'Asha', 'asha@x.test', 'Quality of the work', 'x');
`);

let failures = 0;
const check = (label: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};

// Run statements as a signed-in user with this email (or as anon when email is null).
async function as<T>(email: string | null, fn: () => Promise<T>) {
  await db.exec("begin");
  try {
    if (email === null) await db.exec("set local role anon");
    else {
      await db.exec("set local role authenticated");
      await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ email })]);
    }
    return await fn();
  } finally {
    await db.exec("rollback");
  }
}
const count = async (sql: string, params?: unknown[]) => Number((await db.query<{ n: number }>(sql, params)).rows[0].n);
// Each attempt runs in a savepoint, so a refused statement doesn't abort the rest of the test.
const tries = async (sql: string): Promise<{ ok: boolean; rows?: number; err?: string }> => {
  await db.exec("savepoint t");
  try {
    const r = await db.query(sql);
    await db.exec("release savepoint t");
    return { ok: true, rows: r.affectedRows ?? 0 };
  } catch (e) {
    await db.exec("rollback to savepoint t");
    return { ok: false, err: String((e as Error).message).slice(0, 80) };
  }
};

// Owner: sees and changes everything.
await as("owner@aod.test", async () => {
  check("owner sees all bookings", (await count("select count(*) n from bookings")) === 3);
  check("owner can add a team member", (await tries("insert into staff (id,name,email,role) values ('U-9','New','new@aod.test','ops')")).ok);
  check("owner can change settings", (await tries("update settings set data = data || '{\"advancePct\": 40}'")).rows === 1);
});

// Ops: bookings yes, team and payouts no.
await as("ops@aod.test", async () => {
  check("ops can update a booking", (await tries("update bookings set status='matched' where id='B-1'")).rows === 1);
  check("ops can record a payment", (await tries("insert into payments (id,booking_id,amount,utr) values ('PAY-9','B-1',100,'999988887777')")).ok);
  check("ops cannot add a team member", !(await tries("insert into staff (id,name,email,role) values ('U-8','X','x@aod.test','owner')")).ok);
  check("ops cannot create a payout", !(await tries("insert into payouts (id,artist_id,booking_id,amount) values ('PO-1','ART-1','B-1',100)")).ok);
  check("ops cannot change settings", (await tries("update settings set data = '{}'")).rows === 0);
  check("ops can update a resolution case", (await tries("update cases set status='acknowledged' where id='RC-1'")).rows === 1);
  check("ops can write the activity log", (await tries("insert into activity (id,\"by\",area,text) values ('A-1','Ops','Bookings','x')")).ok);
});

// Viewer: reads everything, changes nothing.
await as("viewer@aod.test", async () => {
  check("viewer sees all bookings", (await count("select count(*) n from bookings")) === 3);
  check("viewer sees leads", (await count("select count(*) n from leads")) === 1);
  check("viewer cannot update a booking", (await tries("update bookings set status='matched' where id='B-1'")).rows === 0);
  check("viewer cannot add a lead", !(await tries("insert into leads (id,name) values ('L-9','x')")).ok);
  check("viewer sees resolution cases", (await count("select count(*) n from cases")) === 1);
  check("viewer cannot update a resolution case", (await tries("update cases set status='closed' where id='RC-1'")).rows === 0);
  check("viewer cannot write the activity log", !(await tries("insert into activity (id,\"by\") values ('A-2','x')")).ok);
});

// Deactivated staff: nothing.
await as("gone@aod.test", async () => {
  check("deactivated staff see no bookings", (await count("select count(*) n from bookings")) === 0);
});

// Customer: only their own booking and its payment; nothing else.
await as("Asha@X.test".toLowerCase(), async () => {
  check("customer sees only their booking", (await count("select count(*) n from bookings")) === 1);
  check("customer sees only their payment", (await count("select count(*) n from payments")) === 1);
  check("customer sees no leads", (await count("select count(*) n from leads")) === 0);
  check("customer cannot read cases directly (tracking goes through the server)", (await count("select count(*) n from cases")) === 0);
  check("customer sees no staff", (await count("select count(*) n from staff")) === 0);
  check("customer cannot change their booking", (await tries("update bookings set status='confirmed' where id='B-1'")).rows === 0);
});

// Someone signed in with an email that has no bookings: nothing (and the phone-only booking stays hidden).
await as("stranger@x.test", async () => {
  check("stranger sees no bookings", (await count("select count(*) n from bookings")) === 0);
});
await as("", async () => {
  check("empty email doesn't match phone-only bookings", (await count("select count(*) n from bookings")) === 0);
});

// Signed out: no access at all.
await as(null, async () => {
  const r = await tries("select * from bookings");
  check("signed-out visitor cannot read bookings", !r.ok, r.err);
  const o = await tries("select * from outbox");
  check("signed-out visitor cannot read the outbox", !o.ok);
});

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
