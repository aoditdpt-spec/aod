-- AOD database, thirteenth step: companies for the business portal (aod.co.in/business). Run once,
-- after 20261026000000_artist_photo.sql: Dashboard → SQL Editor → paste this file → Run.
-- Running it twice is harmless.

-- A company signs up on the website (after confirming its email with an emailed code) and signs in
-- with that email. Its orders are the bookings made with the same email, so My bookings, the admin
-- and the business portal all show the same records. Only the server (with the secret key) adds or
-- changes a company; the team can read them, and an Admin can change them.
create table if not exists public.companies (
  id            text primary key,                                    -- BIZ-101
  name          text not null,
  type          text not null default '' check (type in ('', 'Brand owner', 'Event planner', 'Agency', 'Other')),
  contact_name  text not null default '',
  email         text not null unique check (email = lower(email)),   -- the company's sign-in
  phone         text not null default '',
  city          text not null default '',
  website       text not null default '',
  created_at    timestamptz not null default now()
);

alter table public.companies enable row level security;

drop policy if exists "staff read" on public.companies;
create policy "staff read" on public.companies for select to authenticated using (private.is_staff());
drop policy if exists "team changes companies" on public.companies;
create policy "team changes companies" on public.companies for update to authenticated
  using (private.staff_can('{owner}')) with check (private.staff_can('{owner}'));

revoke all on public.companies from anon;
grant select, update on public.companies to authenticated;
grant all on public.companies to service_role;

-- Live updates: the admin reloads when one changes (staff channel only).
drop trigger if exists live on public.companies;
create trigger live after insert or update or delete on public.companies
  for each row execute function public.live_changed();
