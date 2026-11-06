-- AOD database: artists accept an order, AOD shortlists from those who accepted. Run once, after
-- 20261105000000_order_ids_yymm.sql: Dashboard → SQL Editor → paste this file → Run. Running it
-- twice is harmless.
--
-- 1. An artist's answer to an order can now be "accepted" (I'm available that day) as well as
--    "declined"; "quoted" stays so earlier answers still read.
-- 2. Every artist hears about a change to an order that is still open (a new order, say) on one
--    shared "artists" live channel, so a new order shows in each artist's portal by itself. The
--    message names only the table and id, never the order; the portal then loads only what that
--    artist may see. Only artists (and not customers or visitors) may join that channel.
-- Until this is run, "Accept" in the artist portal is refused by the database.

alter table public.artist_replies drop constraint if exists artist_replies_status_check;
alter table public.artist_replies
  add constraint artist_replies_status_check check (status in ('accepted', 'quoted', 'declined'));

create or replace function public.booking_topics(b public.bookings) returns text[]
language sql stable set search_path = ''
as $$
  select array_remove(
    array[
      case when b.customer_email <> '' then 'customer:' || public.email_key(b.customer_email) end,
      case when b.artist_id is not null then 'artist:' || b.artist_id end,
      case when b.status in ('new', 'matched', 'quoted', 'rescheduled') then 'artists' end
    ]
    || coalesce((select array_agg('artist:' || a) from unnest(b.artist_ids) a), '{}')
    || coalesce((select array_agg('artist:' || s) from unnest(b.shortlist) s), '{}'),
    null)
$$;

do $$
begin
  if to_regclass('realtime.messages') is not null then
    drop policy if exists "aod: listen to own live channels" on realtime.messages;
    create policy "aod: listen to own live channels" on realtime.messages
      for select to authenticated
      using (
        realtime.messages.extension = 'broadcast' and (
          (realtime.topic() = 'staff' and private.is_staff())
          or realtime.topic() = 'customer:' || public.email_key(public.auth_email())
          or realtime.topic() = 'applicant:' || public.email_key(public.auth_email())
          or realtime.topic() = 'artist:' || private.my_artist_id()
          or (realtime.topic() = 'artists' and private.my_artist_id() is not null)
        )
      );
  end if;
end $$;
