-- AOD database, second step: live updates, the artist portal and portfolio files.
-- Run once, after 20261009000000_init.sql: Dashboard → SQL Editor → paste this file → Run.

-- The server's secret key works as service_role. Supabase usually grants it every table by
-- default, but some new-project options don't, so grant it explicitly (harmless if already there).
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- ---------------------------------------------------------------------------------------------
-- Artists' own profile fields and uploaded portfolio files
-- ---------------------------------------------------------------------------------------------

-- Filled from the application when the team approves an artist, then edited by the artist in the
-- portal. `portfolio` lists files in the `portfolio` storage bucket: [{ path, name, type, size, at }].
alter table public.artists add column if not exists bio text not null default '';
alter table public.artists add column if not exists links text[] not null default '{}';
alter table public.artists add column if not exists portfolio jsonb not null default '[]';
alter table public.applications add column if not exists portfolio jsonb not null default '[]';

-- Portfolio photos and videos (public, like a portfolio site; up to 50 MB a file, the free
-- plan's limit). Files are uploaded through signed upload links the server hands out to the
-- signed-in artist (src/server/actions/artist.ts), so no upload policies are needed here.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('portfolio', 'portfolio', true, 52428800,
            array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime'])
    on conflict (id) do nothing;
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Artists' replies to the booking requests they're shortlisted for
-- ---------------------------------------------------------------------------------------------

create table if not exists public.artist_replies (
  booking_id text not null references public.bookings (id) on delete cascade,
  artist_id  text not null references public.artists (id) on delete cascade,
  status     text not null check (status in ('quoted', 'declined')),
  quote      integer check (quote is null or quote > 0),   -- rupees
  note       text not null default '',
  at         timestamptz not null default now(),
  primary key (booking_id, artist_id)
);
alter table public.artist_replies enable row level security;
-- Staff read them in the admin; artists write them only through the server.
drop policy if exists "staff read" on public.artist_replies;
create policy "staff read" on public.artist_replies for select to authenticated using (public.is_staff());
grant select on public.artist_replies to authenticated;
grant all on public.artist_replies to service_role;

-- An email to the team when an artist quotes or declines (switch it off in admin Settings).
update public.settings
set data = jsonb_set(data, '{notify,Artist replied to a request}', 'true', true)
where id = 1 and not (data -> 'notify' ? 'Artist replied to a request');

-- ---------------------------------------------------------------------------------------------
-- Customers read their bookings through the server only
-- ---------------------------------------------------------------------------------------------

-- My bookings (src/server/actions/customer.ts) returns just what a customer should see. Reading
-- whole rows straight from the database would also show the team's internal notes and shortlist,
-- so customers no longer get direct read access.
drop policy if exists "staff or own booking" on public.bookings;
drop policy if exists "staff or own payment" on public.payments;
drop policy if exists "staff read" on public.bookings;
drop policy if exists "staff read" on public.payments;
create policy "staff read" on public.bookings for select to authenticated using (public.is_staff());
create policy "staff read" on public.payments for select to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------------------------
-- Live updates
-- ---------------------------------------------------------------------------------------------

-- When a record changes, the database sends a small "changed" message (the table and the record's
-- id, never its contents) on private Realtime channels, and each open page reloads its own data:
--   staff                    every change (the admin panel)
--   customer:<email key>     their bookings and the payments for them (My bookings)
--   artist:<artist id>       bookings they're shortlisted for or assigned to, their own record and replies
--   applicant:<email key>    their application (the artist portal before approval)
-- The email key is a SHA-256 of the lower-case email, so emails don't appear in channel names.
-- Who may listen to which channel is checked by the policy on realtime.messages at the end.

create or replace function public.email_key(email text) returns text
language sql immutable
as $$ select encode(sha256(convert_to(lower(coalesce(email, '')), 'UTF8')), 'hex') $$;

-- The signed-in artist's id, or null. `security definer` because artists can't read the artists
-- table themselves.
create or replace function public.my_artist_id() returns text
language sql stable security definer set search_path = public
as $$ select id from public.artists where public.auth_email() <> '' and email = public.auth_email() limit 1 $$;

-- Who hears about a change to one booking.
create or replace function public.booking_topics(b public.bookings) returns text[]
language sql stable
as $$
  select array_remove(
    array[
      case when b.customer_email <> '' then 'customer:' || public.email_key(b.customer_email) end,
      case when b.artist_id is not null then 'artist:' || b.artist_id end
    ] || coalesce((select array_agg('artist:' || s) from unnest(b.shortlist) s), '{}'),
    null)
$$;

create or replace function public.live_changed() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  topics text[] := array['staff'];
  rid    text;
  ref    text;
  t      text;
begin
  if tg_table_name = 'bookings' then
    if tg_op <> 'INSERT' then topics := topics || public.booking_topics(old); end if;
    if tg_op <> 'DELETE' then topics := topics || public.booking_topics(new); end if;
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
  elsif tg_table_name = 'payments' then
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
    ref := case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;
    topics := topics || coalesce((
      select array_agg('customer:' || public.email_key(b.customer_email))
      from public.bookings b
      where b.customer_email <> '' and ref <> '' and (b.id = ref or b.request_ref = ref)), '{}');
  elsif tg_table_name = 'artists' then
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
    topics := topics || ('artist:' || rid);
  elsif tg_table_name = 'applications' then
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
    topics := topics || ('applicant:' || public.email_key(case when tg_op = 'DELETE' then old.email else new.email end));
  elsif tg_table_name = 'artist_replies' then
    rid := case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;
    topics := topics || ('artist:' || case when tg_op = 'DELETE' then old.artist_id else new.artist_id end);
  elsif tg_table_name = 'settings' then
    rid := '1';
  else
    rid := case when tg_op = 'DELETE' then old.id::text else new.id::text end;
  end if;

  foreach t in array (select array_agg(distinct x) from unnest(topics) x) loop
    begin
      perform realtime.send(jsonb_build_object('table', tg_table_name, 'id', rid), 'changed', t, true);
    exception when others then
      null; -- a live-update hiccup must never block a save
    end;
  end loop;
  return null;
end $$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['bookings', 'payments', 'payouts', 'applications', 'artists', 'leads', 'cases', 'staff', 'settings', 'artist_replies'] loop
    execute format('drop trigger if exists live on public.%I', tbl);
    execute format('create trigger live after insert or update or delete on public.%I for each row execute function public.live_changed()', tbl);
  end loop;
end $$;

-- Who may listen: staff to "staff", everyone else only to their own channels.
do $$
begin
  if to_regclass('realtime.messages') is not null then
    drop policy if exists "aod: listen to own live channels" on realtime.messages;
    create policy "aod: listen to own live channels" on realtime.messages
      for select to authenticated
      using (
        realtime.messages.extension = 'broadcast' and (
          (realtime.topic() = 'staff' and public.is_staff())
          or realtime.topic() = 'customer:' || public.email_key(public.auth_email())
          or realtime.topic() = 'applicant:' || public.email_key(public.auth_email())
          or realtime.topic() = 'artist:' || public.my_artist_id()
        )
      );
  end if;
end $$;
