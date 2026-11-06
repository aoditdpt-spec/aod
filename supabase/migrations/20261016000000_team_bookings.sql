-- AOD database, sixth step. Run once, after 20261014010000_outbox_rule.sql:
-- Dashboard → SQL Editor → paste this file → Run. Running it twice is harmless.
-- Run it BEFORE deploying the code that goes with it: the website's booking form saves the new
-- `artists_needed` column, and saving fails until the column exists.
--
-- 1. Several artists per booking. A request can already need several categories (one booking each);
--    now each booking also says how many artists of its category are needed ("Photographers × 3",
--    up to 20), and the team assigns that many. `artist_ids` holds the assigned artists;
--    `artist_id` stays as the first of them, so anything still reading it keeps working.
-- 2. Artists in more than one category: `category` stays the main one, and `other_categories`
--    lists the others an artist (or applicant) also works in. Matching offers an artist for a
--    booking in any of their categories.

alter table public.bookings add column if not exists artists_needed integer not null default 1;
alter table public.bookings drop constraint if exists bookings_artists_needed_check;
alter table public.bookings add constraint bookings_artists_needed_check check (artists_needed between 1 and 20);

alter table public.bookings add column if not exists artist_ids text[] not null default '{}';
update public.bookings set artist_ids = array[artist_id] where artist_id is not null and artist_ids = '{}';

alter table public.artists add column if not exists other_categories text[] not null default '{}';
alter table public.applications add column if not exists other_categories text[] not null default '{}';

-- Live updates: every assigned artist hears about a change to the booking, not just the first.
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
