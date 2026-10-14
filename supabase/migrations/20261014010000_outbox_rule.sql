-- AOD database, fifth step. Run once, after 20261014000000_details_and_developers.sql:
-- Dashboard → SQL Editor → paste this file → Run. Running it twice is harmless.

-- The outbox (emails and sheet rows waiting to be retried) is only ever read and written by the
-- server with the secret key, which skips these rules. Saying so with a rule that lets nobody else
-- in keeps it that way and answers Supabase's "RLS Enabled No Policy" note.
drop policy if exists "server only" on public.outbox;
create policy "server only" on public.outbox for all to anon, authenticated using (false) with check (false);
