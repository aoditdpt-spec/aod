-- AOD database. Run once, after 20261105040000_chat.sql:
-- push notifications for the chat (a phone or laptop that allowed them), and an admin Settings
-- switch for the team's email when an artist writes.

-- One row per browser or phone that allowed notifications. `kind` says who it belongs to: a team
-- member (staff_email) or an artist (artist_id). Only the server reads or writes this table (it
-- holds the push endpoints and keys), so row-level security has no policy and nobody else can.
create table if not exists public.push_subscriptions (
  id          bigint generated always as identity primary key,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  kind        text not null check (kind in ('staff', 'artist')),
  staff_email text not null default '',
  artist_id   text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_artist_idx on public.push_subscriptions (artist_id) where kind = 'artist';
create index if not exists push_subscriptions_staff_idx on public.push_subscriptions (kind) where kind = 'staff';

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant all on public.push_subscriptions to service_role;

-- Settings → alerts: "New artist message" (an email to the team when an artist writes), on.
update public.settings
set data = jsonb_set(data, '{notify,New artist message}', 'true', true)
where id = 1 and not (data -> 'notify') ? 'New artist message';
