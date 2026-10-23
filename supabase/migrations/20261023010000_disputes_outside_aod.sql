-- AOD database, eleventh step: Dispute Desk cases for bookings made outside AOD. Run once, after
-- 20261023000000_order_ids.sql: Dashboard → SQL Editor → paste this file → Run. Running it twice
-- is harmless.
--
-- The Dispute Desk now also takes disputes about work booked directly, through another platform or
-- by word of mouth. Such a case has no AOD booking number (booking_ref stays empty); other_party
-- says who the dispute is with and how to reach them, as the person typed it. Until this is run,
-- the website still saves those cases, with that written into booking_ref instead.

alter table public.cases add column if not exists other_party text not null default '';
