-- AOD database: order IDs with the year before the month, and B2B orders. Run once, after
-- 20261102010000_business_type_other.sql: Dashboard → SQL Editor → paste this file → Run. Running
-- it twice is harmless.
--
-- New orders are AOD-<code>-<YYMM><number> (src/lib/order-id.ts): AOD-PH-261001, and AOD-B2B-261002
-- for an order from a business account. Orders already made keep their IDs (AOD-PH-102601 has the
-- month first). The unique index from 20261023000000_order_ids.sql refuses a second order with the
-- same year and number whatever the category code; it is rebuilt so that it reads both formats
-- (a month is 01 to 12 and a year is 13 or more, so they can't be confused) and the three-letter
-- B2B code. Until this is run, new orders still save; only that rare clash isn't caught.

drop index if exists public.bookings_order_number_key;

create unique index if not exists bookings_order_number_key
  on public.bookings ((
    case
      when id ~ '^AOD-[A-Z][A-Z0-9]{1,2}-(0[1-9]|1[0-2])[0-9]{2}[0-9]{2,}$'
        then substring(id from '^AOD-[A-Z][A-Z0-9]{1,2}-[0-9]{2}([0-9]{2}[0-9]+)$')
      else substring(id from '^AOD-[A-Z][A-Z0-9]{1,2}-([0-9]{2})[0-9]{2}[0-9]{2,}$')
           || substring(id from '^AOD-[A-Z][A-Z0-9]{1,2}-[0-9]{4}([0-9]{2,})$')
    end
  ))
  where id ~ '^AOD-[A-Z][A-Z0-9]{1,2}-[0-9]{4}[0-9]{2,}$';
