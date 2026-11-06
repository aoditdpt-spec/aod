-- AOD database, eighth step: the blog and the newsletter. Run once, after
-- 20261016010000_one_order_per_request.sql: Dashboard → SQL Editor → paste this file → Run.
-- Running it twice is harmless.

-- ---------------------------------------------------------------------------------------------
-- Blog posts: written in the admin (Blog), shown on aod.co.in/blog once published
-- ---------------------------------------------------------------------------------------------

create table if not exists public.posts (
  id            text primary key,                                    -- P-101
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null,
  excerpt       text not null default '',                            -- the summary on the list and in link previews
  body          text not null default '',                            -- Markdown (src/lib/markdown.ts)
  cover         text not null default '',                            -- image address (the `blog` bucket)
  cover_alt     text not null default '',
  tags          text[] not null default '{}',
  author        text not null default '',
  status        text not null default 'draft' check (status in ('draft', 'published')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists posts_published on public.posts (status, published_at desc);

-- ---------------------------------------------------------------------------------------------
-- Newsletter: subscribers (double opt-in) and the issues the team sends
-- ---------------------------------------------------------------------------------------------

-- Added only by the website's server: a sign-up is 'pending' until the person clicks the link in
-- the confirmation email. `token` is in their confirm and unsubscribe links.
create table if not exists public.subscribers (
  id               text primary key,                                 -- S-101
  email            text not null unique check (email = lower(email)),
  status           text not null default 'pending' check (status in ('pending', 'subscribed', 'unsubscribed')),
  source           text not null default '',                         -- the page they signed up on
  token            text not null unique,
  created_at       timestamptz not null default now(),
  confirmed_at     timestamptz,
  unsubscribed_at  timestamptz,
  last_sent_at     timestamptz                                       -- the last confirmation email (no more than one in 10 minutes)
);

create table if not exists public.newsletters (
  id          text primary key,                                      -- N-101
  subject     text not null,
  body        text not null default '',                              -- Markdown
  status      text not null default 'draft' check (status in ('draft', 'sent')),
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  sent_by     text not null default '',
  recipients  integer not null default 0
);

-- ---------------------------------------------------------------------------------------------
-- Who may read and change them
-- ---------------------------------------------------------------------------------------------

alter table public.posts       enable row level security;
alter table public.subscribers enable row level security;
alter table public.newsletters enable row level security;

-- Everyone, signed in or not, reads published posts (the blog pages read them without signing in).
drop policy if exists "anyone reads published posts" on public.posts;
create policy "anyone reads published posts" on public.posts for select to anon, authenticated
  using (status = 'published' and published_at is not null and published_at <= now());

-- Staff read everything (drafts too) and write; subscribers and newsletters are staff-only.
drop policy if exists "staff read" on public.posts;
create policy "staff read" on public.posts for select to authenticated using (private.is_staff());
drop policy if exists "team edits posts" on public.posts;
create policy "team edits posts" on public.posts for all to authenticated
  using (private.staff_can('{owner}')) with check (private.staff_can('{owner}'));

drop policy if exists "staff read" on public.subscribers;
create policy "staff read" on public.subscribers for select to authenticated using (private.is_staff());
drop policy if exists "team manages subscribers" on public.subscribers;
create policy "team manages subscribers" on public.subscribers for update to authenticated
  using (private.staff_can('{owner}')) with check (private.staff_can('{owner}'));
drop policy if exists "team removes subscribers" on public.subscribers;
create policy "team removes subscribers" on public.subscribers for delete to authenticated
  using (private.staff_can('{owner}'));

drop policy if exists "staff read" on public.newsletters;
create policy "staff read" on public.newsletters for select to authenticated using (private.is_staff());
drop policy if exists "team writes newsletters" on public.newsletters;
create policy "team writes newsletters" on public.newsletters for all to authenticated
  using (private.staff_can('{owner}')) with check (private.staff_can('{owner}'));

-- Table access (row-level security above decides which rows). Signed-out visitors may only read
-- posts; nobody adds a subscriber except the server (with the secret key).
revoke all on public.posts, public.subscribers, public.newsletters from anon;
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts, public.newsletters to authenticated;
grant select, update, delete on public.subscribers to authenticated;
grant all on public.posts, public.subscribers, public.newsletters to service_role;

-- Live updates: the admin reloads when any of them changes (staff channel only).
do $$
declare
  tbl text;
begin
  foreach tbl in array array['posts', 'subscribers', 'newsletters'] loop
    execute format('drop trigger if exists live on public.%I', tbl);
    execute format('create trigger live after insert or update or delete on public.%I for each row execute function public.live_changed()', tbl);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Blog photos: a public bucket (the website shows them). The admin uploads through one-time
-- links the server hands out to signed-in staff (src/server/actions/blog.ts), so no upload
-- policies are needed here.
-- ---------------------------------------------------------------------------------------------

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('blog', 'blog', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;
  end if;
end $$;
