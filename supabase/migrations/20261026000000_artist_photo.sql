-- AOD database, twelfth step: artists' profile photos. Run once, after
-- 20261023010000_disputes_outside_aod.sql: Dashboard → SQL Editor → paste this file → Run. Running
-- it twice is harmless.
--
-- An artist adds a profile photo when applying, as a link to the photo in their own Google Drive
-- (src/lib/drive-photo.ts); AOD stores only the link, never the file. Approving an application
-- copies it to the artist, and the artist can change it in the portal. Until this is run, the
-- website still saves applications, with the photo link written into the notes instead.

alter table public.applications add column if not exists photo text not null default '';
alter table public.artists add column if not exists photo text not null default '';
