-- AOD database. Run once, after 20261105020000_rename_existing_orders.sql:
-- an approved artist keeps the rest of their application (date of birth, area and the answers to
-- "Your work details"), so the artist portal's Profile and the admin can show and edit all of it.

alter table public.artists add column if not exists details jsonb not null default '{}';

-- Artists already approved take what their application holds.
update public.artists a
set details = ap.details
from public.applications ap
where ap.artist_id = a.id
  and a.details = '{}'::jsonb
  and ap.details <> '{}'::jsonb;
