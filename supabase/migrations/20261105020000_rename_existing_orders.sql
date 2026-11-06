-- AOD database: give the orders already made the new IDs. Run once, after
-- 20261105010000_artist_accept.sql: Dashboard → SQL Editor → paste this file → Run. Running it
-- twice is harmless (nothing is left to rename).
--
-- AOD-PH-102601 (month, then year) becomes AOD-PH-261001 (year, then month), and an order from a
-- business account becomes AOD-B2B-… with the same number (src/lib/order-id.ts). Everything that
-- names the order follows: its customer reference, the artists' answers, payments, payouts, leads
-- and Dispute Desk cases. Orders such as B-1215 / AOD-1215 are left alone.
-- Not changed: the Google Sheet's old rows and the activity log's earlier lines keep the old IDs
-- (search the old ID there), and a customer's earlier emails or WhatsApp messages still show it.

-- An artist's answers move with their order's ID.
alter table public.artist_replies drop constraint if exists artist_replies_booking_id_fkey;
alter table public.artist_replies
  add constraint artist_replies_booking_id_fkey
  foreign key (booking_id) references public.bookings (id) on delete cascade on update cascade;

create temp table order_rename on commit drop as
select
  id as old_id,
  'AOD-' || case when audience = 'Business' then 'B2B' else m[1] end || '-' || m[3] || m[2] || m[4] as new_id
from (
  select id, audience, regexp_match(id, '^AOD-([A-Z][A-Z0-9]{1,2})-(0[1-9]|1[0-2])([0-9]{2})([0-9]{2,})$') as m
  from public.bookings
) x
where m is not null;

update public.bookings b set id = r.new_id from order_rename r where b.id = r.old_id;
update public.bookings b set request_ref = r.new_id from order_rename r where b.request_ref = r.old_id;
update public.payments p set booking_id = r.new_id from order_rename r where p.booking_id = r.old_id;
update public.payouts p set booking_id = r.new_id from order_rename r where p.booking_id = r.old_id;
update public.leads l set booking_id = r.new_id from order_rename r where l.booking_id = r.old_id;
update public.cases c set booking_ref = r.new_id from order_rename r where upper(c.booking_ref) = r.old_id;
