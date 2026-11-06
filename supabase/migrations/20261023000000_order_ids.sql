-- AOD database, tenth step: the new order IDs. Run once, after 20261019010000_artist_brief.sql:
-- Dashboard → SQL Editor → paste this file → Run. Running it twice is harmless.
--
-- New orders are AOD-<category code>-<MMYY><number> (src/lib/order-id.ts): AOD-PH-102601, then
-- AOD-MIX-102602 for an order of several categories, AOD-DJ-112603 in November … The number counts
-- every order of the year whatever its category, and starts again at 01 each January. The primary
-- key alone would let AOD-PH-102605 and AOD-DJ-102605 both exist (two orders saved at the same
-- moment), so this index refuses a second order with the same year and number. The website and
-- the admin then take the next number. Older IDs (B-1215) aren't touched by it.
-- Until this is run, new orders still save; only that rare clash isn't caught.

create unique index if not exists bookings_order_number_key
  on public.bookings (substring(id from '^AOD-[A-Z]+-[0-9]{2}([0-9]{2}[0-9]+)$'))
  where id ~ '^AOD-[A-Z]+-[0-9]{4}[0-9]{2,}$';
