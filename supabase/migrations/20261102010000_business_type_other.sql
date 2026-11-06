-- AOD database, fourteenth step: what a company means by "Other". Run once, after
-- 20261102000000_business_portal.sql: Dashboard → SQL Editor → paste this file → Run.
-- Running it twice is harmless.

-- A company that picks the account type "Other" writes what it is ("Production house"). Only the
-- server writes it, like the rest of the company.
alter table public.companies add column if not exists type_other text not null default '';
