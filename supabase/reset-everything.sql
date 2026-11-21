-- AOD: remove EVERYTHING the migrations made, to build the database again from nothing.
--
-- Not a migration (it's outside supabase/migrations on purpose): run it by hand in Supabase → SQL
-- Editor, only when you want a completely fresh database. It can't be undone: every booking,
-- artist, application, payment, case, post, chat message, company account, the team (staff), the
-- settings and every sign-in account are deleted, and the tables, rules and functions with them.
--
-- Afterwards run every file in supabase/migrations in date order (or the guides folder's
-- supabase/fresh-start/ALL-IN-ONE.sql, which is the same files joined), then add the first Admin.
-- `npm run check:fresh` runs the migrations, this file and the migrations again on PGlite, so
-- check it still passes after adding a table.
--
-- Not touched (SQL can't remove them, or they live outside the database): the `portfolio` and
-- `blog` storage buckets and their files (Supabase → Storage; the migrations simply find the
-- buckets again), the artists' photos on the Google Shared Drive, the orders Google Sheet.

begin;

-- The live-updates rule on Supabase's own Realtime table.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    drop policy if exists "aod: listen to own live channels" on realtime.messages;
  end if;
end $$;

-- Every table (their rules, triggers and indexes go with them).
drop table if exists
  public.chat_messages,
  public.push_subscriptions,
  public.artist_replies,
  public.payments,
  public.payouts,
  public.bookings,
  public.artists,
  public.applications,
  public.companies,
  public.leads,
  public.cases,
  public.activity,
  public.outbox,
  public.posts,
  public.newsletters,
  public.subscribers,
  public.settings,
  public.staff
cascade;

-- The functions the migrations made in public (whatever their arguments), and the private schema.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('booking_topics', 'live_changed', 'staff_role', 'staff_can', 'my_artist_id', 'is_staff', 'email_key', 'auth_email')
  loop
    execute format('drop function if exists %s cascade', f);
  end loop;
end $$;
drop schema if exists private cascade;

-- Every sign-in account (customers, artists, companies and the team: they sign in again with a code).
do $$
begin
  if to_regclass('auth.users') is not null then
    delete from auth.users;
  end if;
end $$;

commit;
