-- AOD database, seventh step. Run once, after 20261016000000_team_bookings.sql (it repeats that
-- step's changes, so it also works if that one wasn't run):
-- Dashboard → SQL Editor → paste this file → Run. Running it twice is harmless.
-- Run it BEFORE deploying the code that goes with it: the website's booking form saves `items`,
-- and saving fails until the column exists.
--
-- 1. One order per request. A booking request for several kinds of artist (photographers, a model
--    and an anchor) is now one booking, B-1215, instead of one booking per category. `items` lists
--    what the order needs, one line per category, each with the artists assigned to it:
--      [{ "category": "photographers", "service": "Photographers", "count": 2, "artistIds": ["ART-201"] }, …]
--    The older columns stay, filled in from it: `category` and `service` (the first line),
--    `artists_needed` (every line added up), `artist_ids` (every assigned artist; live updates and
--    the artist portal use it) and `artist_id` (the first of them).
-- 2. Customers can cancel from My bookings within 2 hours of booking. The team is emailed unless
--    "Customer cancelled a booking" is switched off in admin Settings.

-- The sixth step's changes (harmless if it was run).
alter table public.bookings add column if not exists artists_needed integer not null default 1;
alter table public.bookings add column if not exists artist_ids text[] not null default '{}';
update public.bookings set artist_ids = array[artist_id] where artist_id is not null and artist_ids = '{}';
alter table public.artists add column if not exists other_categories text[] not null default '{}';
alter table public.applications add column if not exists other_categories text[] not null default '{}';

-- Up to 20 artists of each category, so an order can need more than 20 in all.
alter table public.bookings drop constraint if exists bookings_artists_needed_check;
alter table public.bookings add constraint bookings_artists_needed_check check (artists_needed >= 1);

-- The order's lines. Bookings saved before get one line made from their own columns.
alter table public.bookings add column if not exists items jsonb not null default '[]';
alter table public.bookings drop constraint if exists bookings_items_check;
alter table public.bookings add constraint bookings_items_check check (jsonb_typeof(items) = 'array');
update public.bookings
set items = jsonb_build_array(jsonb_build_object(
  'category', category,
  'service', service,
  'count', greatest(artists_needed, cardinality(artist_ids), 1),
  'artistIds', to_jsonb(artist_ids)))
where items = '[]'::jsonb;

-- Live updates: every assigned artist hears about a change to the booking (as in the sixth step).
create or replace function public.booking_topics(b public.bookings) returns text[]
language sql stable set search_path = ''
as $$
  select array_remove(
    array[
      case when b.customer_email <> '' then 'customer:' || public.email_key(b.customer_email) end,
      case when b.artist_id is not null then 'artist:' || b.artist_id end
    ]
    || coalesce((select array_agg('artist:' || a) from unnest(b.artist_ids) a), '{}')
    || coalesce((select array_agg('artist:' || s) from unnest(b.shortlist) s), '{}'),
    null)
$$;

-- The new team alert, on by default (admin Settings → Notify the team about).
update public.settings
set data = jsonb_set(data, '{notify,Customer cancelled a booking}', 'true', true)
where id = 1 and not (data -> 'notify' ? 'Customer cancelled a booking');
