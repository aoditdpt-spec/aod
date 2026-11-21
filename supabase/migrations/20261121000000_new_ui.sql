-- The new design (2026-11-21). Run once in the SQL Editor, before deploying the code that uses it.
--
-- 1. Bookings get the "advance" stage: the admin's pipeline is now Request Received → Matched →
--    Advance Paid → Confirmed → Completed (or Cancelled). Verifying an advance moves a matched
--    booking to "advance"; the team then confirms it. The older stages stay allowed, so earlier
--    bookings still save.
-- 2. Nothing else changes in the tables: the six new categories (photo-video, anchors-hosts,
--    musicians-djs, comedians, models-creators, makeup-styling) are plain text in the same columns,
--    and an artist's kind of artist, other kinds and declaration live in `details` (jsonb).

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check (status in
  ('new', 'matched', 'advance', 'quoted', 'payment_pending', 'confirmed', 'completed',
   'delivered', 'reviewed', 'cancelled', 'rescheduled'));
