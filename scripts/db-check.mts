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

  -- Realtime: realtime.send() stores the message, realtime.topic() is the channel being joined.
  create schema realtime;
  create table realtime.messages (id bigserial primary key, topic text, extension text, payload jsonb, event text, private boolean);
  create function realtime.topic() returns text language sql stable as $$ select current_setting('realtime.topic', true) $$;
  create function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void
    language sql as $$ insert into realtime.messages (topic, extension, payload, event, private) values (topic, 'broadcast', payload, event, private) $$;
  alter table realtime.messages enable row level security;
  grant usage on schema realtime to authenticated;
  grant select on realtime.messages to authenticated;
`);
await db.exec(migration);
console.log("migration ran OK");

// Seed as the database owner (like the server's secret key).
await db.exec(`
  insert into staff (id, name, email, role) values
    ('U-1', 'Owner', 'owner@aod.test', 'owner'),
    ('U-5', 'Dev', 'dev@aod.test', 'developer'),
    ('U-4', 'Gone', 'gone@aod.test', 'developer');
  update staff set active = false where id = 'U-4';
  insert into bookings (id, customer_name, customer_email, category, status) values
    ('B-1', 'Asha', 'asha@x.test', 'photographers', 'new'),
    ('B-2', 'Ravi', 'ravi@x.test', 'musicians-djs', 'quoted'),
    ('B-3', 'Phone only', '', 'editors', 'new');
  insert into payments (id, booking_id, amount, utr) values ('PAY-1', 'B-1', 5000, '111122223333'), ('PAY-2', 'B-2', 9000, '444455556666');
  insert into leads (id, name) values ('L-1', 'Lead');
  insert into artists (id, name, email) values ('ART-1', 'Kavya', 'kavya@x.test'), ('ART-2', 'Rohan', 'rohan@x.test');
  update bookings set shortlist = '{ART-1}' where id = 'B-2';
  insert into artist_replies (booking_id, artist_id, status, quote) values ('B-2', 'ART-1', 'quoted', 25000);
  insert into cases (id, role, name, email, issue, description) values ('DC-1', 'customer', 'Asha', 'asha@x.test', 'Quality of the work', 'x');
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
  check("owner can add a team member", (await tries("insert into staff (id,name,email,role) values ('U-9','New','new@aod.test','developer')")).ok);
  check("owner can change settings", (await tries("update settings set data = data || '{\"advancePct\": 40}'")).rows === 1);
});

// Developer: everything an owner can do.
await as("dev@aod.test", async () => {
  check("developer sees all bookings", (await count("select count(*) n from bookings")) === 3);
  check("developer can add a team member", (await tries("insert into staff (id,name,email,role) values ('U-7','Dev 2','dev2@aod.test','developer')")).ok);
  check("developer can change settings", (await tries("update settings set data = data || '{\"advancePct\": 40}'")).rows === 1);
  check("developer can create a payout", (await tries("insert into payouts (id,artist_id,booking_id,amount) values ('PO-2','ART-1','B-1',100)")).ok);
  check("developer can update a booking", (await tries("update bookings set notes='x' where id='B-2'")).rows === 1);
});

// Developer: the day-to-day work too.
await as("dev@aod.test", async () => {
  check("developer can update a booking's status", (await tries("update bookings set status='matched' where id='B-1'")).rows === 1);
  check("developer can record a payment", (await tries("insert into payments (id,booking_id,amount,utr) values ('PAY-9','B-1',100,'999988887777')")).ok);
  check("developer sees leads", (await count("select count(*) n from leads")) === 1);
  check("developer can update a resolution case", (await tries("update cases set status='acknowledged' where id='DC-1'")).rows === 1);
  check("developer can write the activity log", (await tries("insert into activity (id,\"by\",area,text) values ('A-1','Dev','Bookings','x')")).ok);
});

// Only the two roles exist: owner and developer.
await as("owner@aod.test", async () => {
  for (const old of ["ops", "finance", "viewer"])
    check(`the database refuses the old "${old}" role`, !(await tries(`insert into staff (id,name,email,role) values ('U-${old}','X','${old}@aod.test','${old}')`)).ok);
});

// Deactivated staff: nothing.
await as("gone@aod.test", async () => {
  check("deactivated staff see no bookings", (await count("select count(*) n from bookings")) === 0);
});

// Customer: only their own booking and its payment; nothing else.
await as("Asha@X.test".toLowerCase(), async () => {
  check("customer cannot read booking rows directly (My bookings goes through the server)", (await count("select count(*) n from bookings")) === 0);
  check("customer cannot read payment rows directly", (await count("select count(*) n from payments")) === 0);
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
  // Supabase's security advisor: the access checks aren't callable through the API.
  check("the access checks are no longer in public (the API's schema)", !(await tries("select public.is_staff()")).ok);
  check("signed-out visitor cannot run the access checks", !(await tries("select private.staff_role()")).ok);
  check("signed-out visitor cannot run the live-update trigger function", !(await tries("select public.live_changed()")).ok);
});

// ---- Artists ----
await as("kavya@x.test", async () => {
  check("artist cannot read the artists table directly", (await count("select count(*) n from artists")) === 0);
  check("artist cannot read replies directly", (await count("select count(*) n from artist_replies")) === 0);
  check("artist cannot write a reply directly (goes through the server)", !(await tries("insert into artist_replies (booking_id, artist_id, status) values ('B-1','ART-1','declined')")).ok);
});
// The server (secret key, no row rules) saves an artist's answer; the status must be one of the three.
const reply = (status: string) => db.exec(`insert into artist_replies (booking_id, artist_id, status) values ('B-1', 'ART-2', '${status}')`).then(() => true, () => false);
check("an artist's answer can be 'accepted' (20261105010000)", await reply("accepted"));
check("…but not anything else", !(await reply("maybe")));
await db.exec("delete from artist_replies where booking_id = 'B-1' and artist_id = 'ART-2'");
await as("owner@aod.test", async () => {
  check("staff read artist replies", (await count("select count(*) n from artist_replies")) === 1);
});

// ---- Live updates: who hears about a change, and who may listen ----
const key = async (email: string) => (await db.query<{ k: string }>("select public.email_key($1) k", [email])).rows[0].k;
const sentTo = (topic: string) => count("select count(*) n from realtime.messages where topic = $1", [topic]);
await db.exec("delete from realtime.messages");
await as("dev@aod.test", async () => {
  await db.exec("update bookings set status = 'matched' where id = 'B-2'");
  await db.exec("reset role"); // count the messages as the database owner (listening rules are checked below)
  check("a booking change reaches the staff channel", (await sentTo("staff")) >= 1);
  check("…and its customer's channel", (await sentTo(`customer:${await key("ravi@x.test")}`)) === 1);
  check("…and the shortlisted artist's channel", (await sentTo("artist:ART-1")) === 1);
  check("…and the shared artists channel, while the order is open (20261105010000)", (await sentTo("artists")) >= 1);
  check("…but not other customers or artists", (await sentTo(`customer:${await key("asha@x.test")}`)) === 0 && (await sentTo("artist:ART-2")) === 0);
  check("the message carries the table and id, never the record", (await count("select count(*) n from realtime.messages where payload - 'table' - 'id' <> '{}'::jsonb")) === 0);
  await db.exec("insert into payments (id, booking_id, amount, utr) values ('PAY-7', 'B-1', 100, '121212121212')");
  check("a payment reaches its booking's customer", (await sentTo(`customer:${await key("asha@x.test")}`)) === 1);
});

// ---- Several artists per booking, and artists in several categories ----
await db.exec("delete from realtime.messages");
await as("dev@aod.test", async () => {
  check("an order can need more than 20 artists in all (up to 20 of each category)", (await tries("update bookings set artists_needed = 25 where id = 'B-1'")).rows === 1);
  check("…but not none", !(await tries("update bookings set artists_needed = 0 where id = 'B-1'")).ok);
  check("an order's lines are a list", !(await tries(`update bookings set items = '{"category":"photographers"}' where id = 'B-1'`)).ok);
  check(
    "staff can save an order with several lines",
    (await tries(`update bookings set items = '[{"category":"photographers","service":"Photographers","count":2,"artistIds":["ART-1"]},{"category":"models","service":"Models","count":1,"artistIds":[]}]' where id = 'B-1'`)).rows === 1,
  );
  check("staff can give an artist other categories", (await tries("update artists set other_categories = '{cinematographers}' where id = 'ART-1'")).rows === 1);
  await db.exec("update bookings set artist_ids = '{ART-1,ART-2}', artist_id = 'ART-1' where id = 'B-3'");
  await db.exec("reset role");
  check("a booking change reaches every assigned artist", (await sentTo("artist:ART-1")) >= 1 && (await sentTo("artist:ART-2")) === 1);
});
// A booking saved with one artist before the sixth migration gets them in artist_ids (and running it again is harmless).
await db.exec("update bookings set artist_id = 'ART-2', artist_ids = '{}' where id = 'B-2'");
await db.exec(readFileSync(new URL("20261016000000_team_bookings.sql", dir), "utf8"));
check(
  "the sixth migration moves a booking's single artist into artist_ids",
  (await db.query<{ a: string[] }>("select artist_ids a from bookings where id = 'B-2'")).rows[0].a.join() === "ART-2",
);
// …and the seventh gives a booking saved before orders had lines one line from its own columns.
await db.exec(readFileSync(new URL("20261016010000_one_order_per_request.sql", dir), "utf8"));
const line = (await db.query<{ i: { category: string; count: number; artistIds: string[] }[] }>("select items i from bookings where id = 'B-2'")).rows[0].i;
check(
  "the seventh migration makes one order line from a booking's old columns",
  line.length === 1 && line[0].category === "musicians-djs" && line[0].count === 1 && line[0].artistIds.join() === "ART-2",
);
check(
  "…and lets an order need more than 20 artists again",
  await as("dev@aod.test", async () => (await tries("update bookings set artists_needed = 25 where id = 'B-2'")).rows === 1),
);
check(
  "…and adds the customer-cancelled alert to the settings",
  (await count(`select count(*) n from settings where data -> 'notify' ? 'Customer cancelled a booking'`)) === 1,
);

// Joining a channel = reading realtime.messages with realtime.topic() set to it (as Realtime does).
const channels = ["staff", "artist:ART-1", "artist:ART-2", `customer:${await key("asha@x.test")}`, `customer:${await key("ravi@x.test")}`, "artists"];
for (const t of channels) await db.query("insert into realtime.messages (topic, extension) values ($1, 'broadcast')", [t]);
const canJoin = (email: string, topic: string) =>
  as(email, async () => {
    await db.query("select set_config('realtime.topic', $1, true)", [topic]);
    return (await count("select count(*) n from realtime.messages where topic = $1", [topic])) > 0;
  });
check("staff can join the staff channel", await canJoin("dev@aod.test", "staff"));
check("deactivated staff cannot join the staff channel", !(await canJoin("gone@aod.test", "staff")));
check("a customer cannot join the staff channel", !(await canJoin("asha@x.test", "staff")));
check("a customer can join their own channel", await canJoin("asha@x.test", channels[3]));
check("a customer cannot join someone else's channel", !(await canJoin("asha@x.test", channels[4])));
check("an artist can join their own channel", await canJoin("kavya@x.test", "artist:ART-1"));
check("an artist cannot join another artist's channel", !(await canJoin("kavya@x.test", "artist:ART-2")));
check("an artist can join the shared artists channel", await canJoin("kavya@x.test", "artists"));
check("a customer cannot join the shared artists channel", !(await canJoin("asha@x.test", "artists")));
check("staff cannot join it by being staff (it is for artists)", !(await canJoin("dev@aod.test", "artists")));

// ---- The customer's brief for the artists (ninth migration) ----
await as("dev@aod.test", async () => {
  check("a booking's brief saves as an object", (await tries(`update bookings set brief = '{"byCategory":{"photographers":{"style":["Candid"]}},"note":"x"}' where id = 'B-1'`)).rows === 1);
  check("…and nothing else (not a list or text)", !(await tries(`update bookings set brief = '["x"]' where id = 'B-1'`)).ok);
});
check("a booking saved before the brief existed has an empty one", (await count(`select count(*) n from bookings where id = 'B-3' and brief = '{}'::jsonb`)) === 1);

// ---- The blog and the newsletter (eighth migration) ----
await db.exec(`
  insert into posts (id, slug, title, status, published_at) values
    ('P-1', 'live-post', 'Live', 'published', now() - interval '1 day'),
    ('P-2', 'draft-post', 'Draft', 'draft', null),
    ('P-3', 'later-post', 'Later', 'published', now() + interval '1 day');
  insert into subscribers (id, email, status, token) values ('S-1', 'reader@x.test', 'subscribed', 'tok-aaaaaaaaaaaaaaaaaaaaaaaa');
  insert into newsletters (id, subject) values ('N-1', 'Hello');
`);
await as(null, async () => {
  check("signed-out visitor reads published posts only (not drafts or scheduled ones)", (await count("select count(*) n from posts")) === 1);
  check("signed-out visitor cannot add a post", !(await tries("insert into posts (id, slug, title) values ('P-9', 'x', 'X')")).ok);
  check("signed-out visitor cannot read subscribers", !(await tries("select * from subscribers")).ok);
  check("signed-out visitor cannot add a subscriber directly (sign-up goes through the server)", !(await tries("insert into subscribers (id, email, token) values ('S-9', 'x@x.test', 'tok-bbbbbbbbbbbbbbbbbbbbbbbb')")).ok);
  check("signed-out visitor cannot read newsletters", !(await tries("select * from newsletters")).ok);
});
await as("asha@x.test", async () => {
  check("a customer reads published posts only", (await count("select count(*) n from posts")) === 1);
  check("a customer cannot read subscribers", (await count("select count(*) n from subscribers")) === 0);
  check("a customer cannot change a post", (await tries("update posts set title = 'x' where id = 'P-1'")).rows === 0);
});
await as("dev@aod.test", async () => {
  check("staff read every post, drafts and scheduled too", (await count("select count(*) n from posts")) === 3);
  check("staff can add a post", (await tries("insert into posts (id, slug, title) values ('P-4', 'new-post', 'New')")).ok);
  check("staff can publish a post", (await tries("update posts set status = 'published', published_at = now() where id = 'P-2'")).rows === 1);
  check("a post's address must be lowercase words and dashes", !(await tries("update posts set slug = 'Not A Slug' where id = 'P-2'")).ok);
  check("staff read subscribers", (await count("select count(*) n from subscribers")) === 1);
  check("staff can unsubscribe someone", (await tries("update subscribers set status = 'unsubscribed' where id = 'S-1'")).rows === 1);
  check("staff can remove a subscriber", (await tries("delete from subscribers where id = 'S-1'")).rows === 1);
  check("staff cannot add a subscriber (only the person can, by confirming)", !(await tries("insert into subscribers (id, email, token) values ('S-8', 'y@x.test', 'tok-cccccccccccccccccccccccc')")).ok);
  check("staff can write a newsletter", (await tries("update newsletters set body = 'Hi' where id = 'N-1'")).rows === 1);
});
await as("gone@aod.test", async () => {
  check("deactivated staff see only published posts", (await count("select count(*) n from posts")) === 1);
  check("deactivated staff cannot read subscribers", (await count("select count(*) n from subscribers")) === 0);
});
// ---- Companies for the business portal (thirteenth migration) ----
await db.exec(`insert into companies (id, name, type, email) values ('BIZ-1', 'Sunrise Hotels', 'Brand owner', 'ops@sunrise.test')`);
await as(null, async () => {
  check("signed-out visitor cannot read companies", !(await tries("select * from companies")).ok);
  check("signed-out visitor cannot add a company directly (sign-up goes through the server)", !(await tries("insert into companies (id, name, email) values ('BIZ-9', 'X', 'x@x.test')")).ok);
});
await as("asha@x.test", async () => {
  check("a customer cannot read companies", (await count("select count(*) n from companies")) === 0);
  check("a customer cannot change a company", (await tries("update companies set name = 'x' where id = 'BIZ-1'")).rows === 0);
});
await as("dev@aod.test", async () => {
  check("staff read companies", (await count("select count(*) n from companies")) === 1);
  check("staff can change a company", (await tries("update companies set city = 'Surat' where id = 'BIZ-1'")).rows === 1);
  check("staff cannot add a company (only the server, after the email is confirmed)", !(await tries("insert into companies (id, name, email) values ('BIZ-8', 'Y', 'y@x.test')")).ok);
  check("a company's account type must be one of the listed ones", !(await tries("update companies set type = 'Pirate' where id = 'BIZ-1'")).ok);
  check("a company that is 'Other' can say what it is", (await tries("update companies set type = 'Other', type_other = 'Production house' where id = 'BIZ-1'")).rows === 1);
  check("a company's email must be lowercase", !(await tries("update companies set email = 'UP@x.test' where id = 'BIZ-1'")).ok);
});
// Order IDs (src/lib/order-id.ts): one number per order in a year, whatever the category code.
await as("dev@aod.test", async () => {
  const order = (id: string) => tries(`insert into bookings (id, customer_name, category, status) values ('${id}', 'X', 'photographers', 'new')`);
  check("staff can add an order with a new-style ID", (await order("AOD-PH-102601")).ok);
  check("a second order can't take the same number under another category", !(await order("AOD-MIX-102601")).ok);
  check("…nor in another month of the same year", !(await order("AOD-DJ-112601")).ok);
  check("the number starts again in a new year", (await order("AOD-PH-012701")).ok);
  check("numbers past 99 have three digits and don't clash with two", (await order("AOD-PH-1026100")).ok && (await order("AOD-PH-102610")).ok);
  // The current format: year, then month (…20261105000000_order_ids_yymm.sql).
  check("staff can add an order with a year-first ID", (await order("AOD-PH-261120")).ok);
  check("a business order can't reuse a number under B2B", !(await order("AOD-B2B-261120")).ok);
  check("…nor in another month, nor in the earlier format", !(await order("AOD-DJ-261220")).ok && !(await order("AOD-DJ-112620")).ok);
  check("a business order with a new number is fine", (await order("AOD-B2B-261121")).ok);
  check("the number starts again in a new year (year-first)", (await order("AOD-B2B-270130")).ok);
  check("past 99 in the year-first format", (await order("AOD-B2B-2611101")).ok && !(await order("AOD-PH-2612101")).ok);
});

// Renaming the orders already made (20261105020000): month-first IDs become year-first, and a business account's order becomes B2B.
{
  await db.exec("insert into bookings (id, request_ref, customer_name, category, status, audience) values ('AOD-PH-102690', 'AOD-PH-102690', 'X', 'photographers', 'new', 'Personal'), ('AOD-DJ-102691', 'AOD-DJ-102691', 'X', 'musicians-djs', 'new', 'Business')");
  await db.exec("insert into artist_replies (booking_id, artist_id, status) values ('AOD-PH-102690', 'ART-2', 'accepted')");
  await db.exec("insert into payments (id, booking_id, amount, utr) values ('PAY-R1', 'AOD-DJ-102691', 100, '909090909090')");
  await db.exec(readFileSync(new URL("20261105020000_rename_existing_orders.sql", dir), "utf8"));
  const has = async (id: string) => (await count("select count(*) n from bookings where id = $1", [id])) === 1;
  check("an existing order gets a year-first ID", (await has("AOD-PH-261090")) && !(await has("AOD-PH-102690")));
  check("a business account's order becomes B2B", (await has("AOD-B2B-261091")) && !(await has("AOD-DJ-102691")));
  check("its customer reference follows", (await count("select count(*) n from bookings where id = 'AOD-PH-261090' and request_ref = 'AOD-PH-261090'")) === 1);
  check("the artist's answer follows its order", (await count("select count(*) n from artist_replies where booking_id = 'AOD-PH-261090'")) === 1);
  check("payments follow it", (await count("select count(*) n from payments where booking_id = 'AOD-B2B-261091'")) === 1);
  check("older IDs (B-1) are left alone", (await has("B-1")));
  await db.exec(readFileSync(new URL("20261105020000_rename_existing_orders.sql", dir), "utf8"));
  check("running it again changes nothing", (await has("AOD-PH-261090")) && (await has("AOD-B2B-261091")));
}

// An approved artist keeps the rest of the application (20261105030000): date of birth, area and the work-details answers.
{
  await db.exec("insert into artists (id, name, phone, email, category) values ('ART-D1', 'Dev One', '9800000011', 'devone@x.test', 'photographers')");
  await db.exec("insert into applications (id, name, phone, email, category, artist_id, details) values ('APP-D1', 'Dev One', '9800000011', 'devone@x.test', 'photographers', 'ART-D1', '{\"dob\":\"1995-04-02\",\"locality\":\"Bopal\"}')");
  await db.exec(readFileSync(new URL("20261105030000_artist_details.sql", dir), "utf8"));
  const d = (await db.query<{ details: { dob?: string; locality?: string } }>("select details from artists where id = 'ART-D1'")).rows[0]?.details;
  check("an approved artist takes their application's date of birth and area", d?.dob === "1995-04-02" && d?.locality === "Bopal");
  check("an artist with no application starts with no details", (await count("select count(*) n from artists where id <> 'ART-D1' and details <> '{}'::jsonb")) === 0);
}

// Chat between the team and an artist (20261105040000): staff read it, artists and signed-out visitors can't, and a message reaches the staff and that artist's channel only.
{
  await db.exec("delete from realtime.messages");
  await db.exec("insert into chat_messages (artist_id, from_artist, sender, body) values ('ART-1', false, 'Vaibhav', 'Hello'), ('ART-1', true, '', 'Hi team')");
  check("a chat message reaches the staff channel and that artist's channel", (await sentTo("staff")) === 2 && (await sentTo("artist:ART-1")) === 2);
  check("…and no other artist's", (await sentTo("artist:ART-2")) === 0);
  await as("dev@aod.test", async () => {
    check("staff can read the chat", (await count("select count(*) n from chat_messages")) === 2);
    check("staff can't write it from the browser (only the server does)", !(await tries("insert into chat_messages (artist_id, body) values ('ART-1', 'x')")).ok);
  });
  await as("kavya@x.test", async () => {
    check("an artist can't read the chat table (the portal goes through the server)", (await count("select count(*) n from chat_messages")) === 0);
  });
}
await db.exec("delete from realtime.messages");
try {
  await db.exec("insert into chat_messages (artist_id, body) values ('ART-1', '')");
  check("an empty message is refused", false);
} catch {
  check("an empty message is refused", true);
}

// Push subscriptions (20261105050000): only the server holds them; staff, artists and visitors can't read or write them.
await db.exec("insert into push_subscriptions (endpoint, p256dh, auth, kind, artist_id) values ('https://push.example/abc', 'k', 'a', 'artist', 'ART-1')");
await as("dev@aod.test", async () => {
  check("staff can't read push subscriptions (they hold device keys)", !(await tries("select 1 from push_subscriptions")).ok);
});
await as("kavya@x.test", async () => {
  check("an artist can't read or add push subscriptions from the browser", !(await tries("select 1 from push_subscriptions")).ok && !(await tries("insert into push_subscriptions (endpoint, p256dh, auth, kind) values ('https://push.example/x', 'k', 'a', 'staff')")).ok);
});

// Dispute Desk cases for a booking made outside AOD: no booking number, who it's with instead.
await db.exec("insert into cases (id, role, name, email, issue, description, other_party) values ('DC-2', 'artist', 'Kavya', 'kavya@x.test', 'Unpaid or delayed payment', 'x', 'Rahul Shah, +91 98000 00000')");
check(
  "a case can be about a booking outside AOD (other_party, no booking number)",
  (await db.query<{ other_party: string; booking_ref: string }>("select other_party, booking_ref from cases where id = 'DC-2'")).rows[0]?.booking_ref === "",
);

// Profile photos: a Google Drive link on applications and artists, empty until one is given.
await db.exec("insert into applications (id, name, phone, email, category, photo) values ('APP-9', 'Kavya', '9800000000', 'kavya.photo@x.test', 'photographers', 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view')");
check(
  "an application keeps its profile photo link, and an artist starts with none",
  (await db.query<{ photo: string }>("select photo from applications where id = 'APP-9'")).rows[0]?.photo.startsWith("https://drive.google.com/") &&
    (await db.query<{ photo: string }>("select photo from artists limit 1")).rows.every((r) => r.photo === ""),
);

await db.exec("delete from realtime.messages");
await db.exec("update posts set title = 'Live!' where id = 'P-1'");
check("a post change reaches the staff channel (the admin reloads)", (await sentTo("staff")) === 1);

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
