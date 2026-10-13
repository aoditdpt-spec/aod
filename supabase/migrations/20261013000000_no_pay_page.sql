-- AOD database, third step: the payment page (/pay) is gone.
-- Run once, after 20261010000000_live_and_artists.sql: Dashboard → SQL Editor → paste this file → Run.

-- Customers no longer report payments themselves (the team records them on a booking), so the
-- "Payment reported" alert has nothing to send. Running this twice is harmless.
update public.settings set data = data #- '{notify,Payment reported}' where id = 1;
