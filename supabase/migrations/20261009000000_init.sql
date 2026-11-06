-- AOD database, first version.
-- Run once on a new Supabase project: Dashboard → SQL Editor → paste this file → Run.
--
-- The tables mirror the admin panel's records (src/lib/admin-store.ts), so the screens stay the
-- same. IDs are the readable references the team already uses (B-1215, ART-112, PAY-3101 …).
-- Lists that only ever travel with their record (notes, status history) are stored as JSON.
--
-- Who can do what is enforced here, with row-level security:
--   • staff (listed in `staff`, signed in with that email) can read everything;
--     changes follow the admin roles: owner / ops / finance / viewer;
--   • a signed-in customer can read only the bookings (and payments) made with their email;
--   • the public website never talks to these tables directly: its forms go through the
--     server (Next.js server actions with the secret key), which checks the input first.

-- ---------------------------------------------------------------------------------------------
-- Who is signed in
-- ---------------------------------------------------------------------------------------------

-- The signed-in user's email, lower-case ('' when signed out).
create or replace function public.auth_email() returns text
language sql stable
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

-- ---------------------------------------------------------------------------------------------
-- Staff (Team & roles)
-- ---------------------------------------------------------------------------------------------

create table public.staff (
  id          text primary key,                       -- U-1, U-2 …
  name        text not null,
  email       text not null unique check (email = lower(email)),
  role        text not null check (role in ('owner', 'ops', 'finance', 'viewer')),
  active      boolean not null default true,
  two_factor  boolean not null default false,
  last_active timestamptz,
  created_at  timestamptz not null default now()
);

-- The signed-in person's staff role, or null if they aren't (active) staff.
-- `security definer` so the check itself isn't blocked by the staff table's own rules.
create or replace function public.staff_role() returns text
language sql stable security definer set search_path = public
as $$ select role from public.staff where email = public.auth_email() and active $$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public
as $$ select public.staff_role() is not null $$;

create or replace function public.staff_can(roles text[]) returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.staff_role() = any (roles), false) $$;

-- ---------------------------------------------------------------------------------------------
-- Records
-- ---------------------------------------------------------------------------------------------

create table public.applications (
  id           text primary key,                      -- APP-201
  name         text not null,
  phone        text not null default '',
  email        text not null default '',
  city         text not null default '',
  category     text not null default '',              -- category slug from site.ts
  services     text[] not null default '{}',
  experience   text not null default '',
  languages    text[] not null default '{}',
  bio          text not null default '',
  links        text[] not null default '{}',
  submitted_at timestamptz not null default now(),
  status       text not null default 'submitted'
               check (status in ('submitted', 'review', 'meeting', 'trial', 'approved', 'rejected')),
  meeting      jsonb,                                  -- { at, place }
  kyc          text not null default 'not_started' check (kyc in ('not_started', 'verified')),
  notes        jsonb not null default '[]',            -- [{ at, by, text }]
  artist_id    text                                    -- set when approved
);

create table public.artists (
  id            text primary key,                     -- ART-112
  name          text not null,
  phone         text not null default '',
  email         text not null default '',
  city          text not null default '',
  category      text not null default '',
  services      text[] not null default '{}',
  experience    text not null default '',
  languages     text[] not null default '{}',
  joined_at     timestamptz not null default now(),
  status        text not null default 'active' check (status in ('active', 'paused')),
  kyc           text not null default 'pending' check (kyc in ('verified', 'pending')),
  payout_upi    text not null default '',
  blocked_dates text[] not null default '{}',         -- yyyy-mm-dd
  notes         jsonb not null default '[]'
);

create table public.bookings (
  id             text primary key,                    -- B-1215
  request_ref    text,                                -- AOD-1048: one website request can need several categories
  created_at     timestamptz not null default now(),
  audience       text not null default 'Personal' check (audience in ('Personal', 'Business')),
  customer_name  text not null default '',
  customer_phone text not null default '',
  customer_email text not null default '' check (customer_email = lower(customer_email)),
  category       text not null default '',            -- category slug
  service        text not null default '',
  event          text not null default '',
  event_date     text not null default '',            -- yyyy-mm-dd, or '' if not fixed
  event_time     text not null default '',            -- start, HH:MM
  event_end_time text not null default '',            -- end, HH:MM (earlier than the start = ends after midnight)
  city           text not null default '',
  venue          text not null default '',
  budget         text not null default '',
  notes          text not null default '',
  status         text not null default 'new' check (status in
                   ('new', 'matched', 'quoted', 'payment_pending', 'confirmed', 'completed',
                    'delivered', 'reviewed', 'cancelled', 'rescheduled')),
  artist_id      text,
  shortlist      text[] not null default '{}',         -- artist ids offered to the customer
  quote          integer,
  advance        integer,
  delivery       jsonb,                                -- { link, expires }
  review         jsonb,                                -- { rating, text }
  history        jsonb not null default '[]',          -- [{ at, by, status }]
  notes_log      jsonb not null default '[]',          -- [{ at, by, text }]
  source         text not null default 'website'       -- website, whatsapp, phone, admin …
);
create index bookings_customer_email on public.bookings (customer_email);
create index bookings_status on public.bookings (status);
create index bookings_request_ref on public.bookings (request_ref);

create table public.payments (
  id          text primary key,                       -- PAY-3101
  booking_id  text not null default '',               -- booking or request reference, if the customer gave one
  amount      integer not null check (amount > 0),    -- rupees
  utr         text not null,                           -- 12-digit UPI transaction ID / bank reference
  payer       text not null default '',
  payer_phone text not null default '',
  purpose     text not null default '',
  reported_at timestamptz not null default now(),
  status      text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  checked_by  text,
  checked_at  timestamptz,
  reason      text
);
create index payments_booking on public.payments (booking_id);
create index payments_utr on public.payments (utr);

create table public.payouts (
  id         text primary key,                        -- PO-501
  artist_id  text not null,
  booking_id text not null,
  amount     integer not null check (amount > 0),
  status     text not null default 'due' check (status in ('due', 'paid')),
  paid_at    timestamptz,
  reference  text
);

create table public.leads (
  id         text primary key,                        -- L-401
  created_at timestamptz not null default now(),
  name       text not null default '',
  phone      text not null default '',
  source     text not null default 'Website',
  type       text not null default 'Personal' check (type in ('Personal', 'Business')),
  need       text not null default '',
  city       text not null default '',
  status     text not null default 'new' check (status in ('new', 'contacted', 'converted', 'lost')),
  notes      jsonb not null default '[]',
  booking_id text
);

-- Resolution Centre cases: problems with a booking raised by a customer, business or artist.
create table public.cases (
  id            text primary key,                     -- RC-1001
  created_at    timestamptz not null default now(),
  role          text not null check (role in ('customer', 'business', 'artist')),
  name          text not null,
  email         text not null check (email = lower(email)),
  phone         text not null default '',
  booking_ref   text not null default '',
  issue         text not null,
  incident_date text not null default '',              -- yyyy-mm-dd
  description   text not null,
  outcome       text not null default '',              -- what they'd like done
  evidence      text[] not null default '{}',          -- links
  status        text not null default 'received' check (status in
                  ('received', 'acknowledged', 'investigating', 'resolved', 'escalated', 'closed')),
  resolution    text,                                  -- AOD's decision, shown to the person
  history       jsonb not null default '[]',           -- [{ at, by, status }]
  notes         jsonb not null default '[]'            -- internal
);
create index cases_status on public.cases (status);

-- Who did what, newest first in the admin's Activity log.
create table public.activity (
  id     text primary key,
  at     timestamptz not null default now(),
  "by"   text not null default '',
  area   text not null default '',
  text   text not null default '',
  target text
);
create index activity_at on public.activity (at desc);

-- One row of panel settings (commission, advance %, notifications …).
create table public.settings (
  id   integer primary key default 1 check (id = 1),
  data jsonb not null
);
insert into public.settings (id, data) values (1, '{
  "commissionPct": 15,
  "paymentHoldHours": 48,
  "deliveryLinkDays": 30,
  "advancePct": 30,
  "notify": {
    "New booking request": true,
    "Payment reported": true,
    "New resolution case": true,
    "New artist application": true,
    "Event tomorrow": true,
    "Delivery link expiring": true,
    "Daily summary email": false
  }
}');

-- Jobs that run after a form is saved (spreadsheet rows, emails). A job that fails stays here
-- with its error and is retried by /api/jobs/retry. Only the server (secret key) uses this table.
create table public.outbox (
  id         bigint generated always as identity primary key,
  kind       text not null,                            -- 'sheet' | 'email'
  payload    jsonb not null,
  status     text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  attempts   integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  done_at    timestamptz
);
create index outbox_pending on public.outbox (status) where status = 'pending';

-- ---------------------------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------------------------

alter table public.staff        enable row level security;
alter table public.applications enable row level security;
alter table public.artists      enable row level security;
alter table public.bookings     enable row level security;
alter table public.payments     enable row level security;
alter table public.payouts      enable row level security;
alter table public.leads        enable row level security;
alter table public.cases        enable row level security;
alter table public.activity     enable row level security;
alter table public.settings     enable row level security;
alter table public.outbox       enable row level security;   -- no policies: server only

-- Staff can read everything.
create policy "staff read"  on public.staff        for select to authenticated using (public.is_staff());
create policy "staff read"  on public.applications for select to authenticated using (public.is_staff());
create policy "staff read"  on public.artists      for select to authenticated using (public.is_staff());
create policy "staff read"  on public.payouts      for select to authenticated using (public.is_staff());
create policy "staff read"  on public.leads        for select to authenticated using (public.is_staff());
create policy "staff read"  on public.cases        for select to authenticated using (public.is_staff());
create policy "staff read"  on public.activity     for select to authenticated using (public.is_staff());
create policy "staff read"  on public.settings     for select to authenticated using (public.is_staff());

-- Bookings and payments: staff, or the customer the booking belongs to.
create policy "staff or own booking" on public.bookings for select to authenticated
  using (public.is_staff() or (customer_email <> '' and customer_email = public.auth_email()));
create policy "staff or own payment" on public.payments for select to authenticated
  using (public.is_staff() or booking_id in (select b.id from public.bookings b
                                             where b.customer_email <> '' and b.customer_email = public.auth_email()));

-- Changes, by role (the same rules as the admin screens' buttons, src/content/admin.ts).
create policy "owner edits team"     on public.staff        for all to authenticated
  using (public.staff_can('{owner}')) with check (public.staff_can('{owner}'));
create policy "ops edit applications" on public.applications for all to authenticated
  using (public.staff_can('{owner,ops}')) with check (public.staff_can('{owner,ops}'));
create policy "ops edit artists"     on public.artists      for all to authenticated
  using (public.staff_can('{owner,ops}')) with check (public.staff_can('{owner,ops}'));
create policy "team edits bookings"  on public.bookings     for all to authenticated
  using (public.staff_can('{owner,ops,finance}')) with check (public.staff_can('{owner,ops,finance}'));
create policy "team edits payments"  on public.payments     for all to authenticated
  using (public.staff_can('{owner,ops,finance}')) with check (public.staff_can('{owner,ops,finance}'));
create policy "finance pays artists" on public.payouts      for all to authenticated
  using (public.staff_can('{owner,finance}')) with check (public.staff_can('{owner,finance}'));
create policy "ops edit leads"       on public.leads        for all to authenticated
  using (public.staff_can('{owner,ops}')) with check (public.staff_can('{owner,ops}'));
create policy "ops handle cases"     on public.cases        for all to authenticated
  using (public.staff_can('{owner,ops}')) with check (public.staff_can('{owner,ops}'));
create policy "team logs activity"   on public.activity     for insert to authenticated
  with check (public.staff_can('{owner,ops,finance}'));
create policy "owner edits settings" on public.settings     for update to authenticated
  using (public.staff_can('{owner}')) with check (public.staff_can('{owner}'));

-- Table access for signed-in users (row-level security above decides which rows);
-- signed-out visitors (anon) get nothing.
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on
  public.staff, public.applications, public.artists, public.bookings, public.payments,
  public.payouts, public.leads, public.cases, public.activity, public.settings
  to authenticated;
revoke all on public.outbox from authenticated;
