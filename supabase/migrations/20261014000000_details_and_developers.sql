-- AOD database, fourth step. Run once, after 20261013000000_no_pay_page.sql:
-- Dashboard → SQL Editor → paste this file → Run. Running it twice is harmless.

-- 1. The answers from the artist application's "Your work details" page (questions for the
--    applicant's category: how they work, specialisation, travel, gear and so on), kept as one JSON
--    object per application, by question id.
alter table public.applications add column if not exists details jsonb not null default '{}';

-- 2. Team & roles has two roles: owner (shown as "Admin") and developer (full access, the same as
--    an owner). The old ops, finance and viewer roles are gone; anyone who still had one becomes a
--    developer with access switched off, so nobody gains access until an admin restores it.
update public.staff set role = 'developer', active = false where role in ('ops', 'finance', 'viewer');
alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check check (role in ('owner', 'developer'));

-- 3. Supabase's security advisor.
-- The access checks used by the row-level security rules run with extra rights (`security
-- definer`), so they move out of `public`, which the website's API exposes as /rest/v1/rpc/…, into
-- a `private` schema it doesn't. The rules keep working: they point at the functions themselves,
-- not their names. Only signed-in users (whose rules call them) may run them.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

do $$
declare f text;
begin
  foreach f in array array['staff_role()', 'is_staff()', 'staff_can(text[])', 'my_artist_id()'] loop
    if to_regprocedure('public.' || f) is not null then
      execute format('alter function public.%s set schema private', f);
    end if;
  end loop;
end $$;

-- Rewritten to call each other in their new place. Every rule an owner passes, a developer passes too.
create or replace function private.staff_role() returns text
language sql stable security definer set search_path = ''
as $$ select role from public.staff where email = public.auth_email() and active $$;

create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = ''
as $$ select private.staff_role() is not null $$;

create or replace function private.staff_can(roles text[]) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    private.staff_role() = any (roles) or (private.staff_role() = 'developer' and 'owner' = any (roles)),
    false
  )
$$;

create or replace function private.my_artist_id() returns text
language sql stable security definer set search_path = ''
as $$ select id from public.artists where public.auth_email() <> '' and email = public.auth_email() limit 1 $$;

revoke execute on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- The trigger that announces changes (Live updates) only runs as a trigger, never by itself.
revoke execute on function public.live_changed() from public, anon, authenticated;

-- A fixed search path for the remaining helpers (they name every table and function in full).
alter function public.auth_email() set search_path = '';
alter function public.email_key(text) set search_path = '';
alter function public.booking_topics(public.bookings) set search_path = '';
