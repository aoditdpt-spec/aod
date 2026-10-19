-- AOD database, ninth step: the "Brief for the artists". Run once, after
-- 20261019000000_blog_and_newsletter.sql: Dashboard → SQL Editor → paste this file → Run.
-- Running it twice is harmless.
--
-- The booking form's optional "Brief for the artists" (src/content/artist-brief.ts): for each kind
-- of artist booked, quick answers (style, coverage, music, looks…), plus preferences about the
-- artist, reference links and anything else:
--   { "byCategory": { "photographers": { "style": ["Candid"], "coverage": "Full day" } },
--     "preferences": "…", "references": "…", "note": "…" }
-- Until this is run, the website still saves requests, with the brief written into the notes.

alter table public.bookings add column if not exists brief jsonb not null default '{}';
alter table public.bookings drop constraint if exists bookings_brief_check;
alter table public.bookings add constraint bookings_brief_check check (jsonb_typeof(brief) = 'object');
