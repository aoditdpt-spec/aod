-- AOD database. Run once, after 20261105030000_artist_details.sql:
-- chat between the AOD team and each artist. One conversation per artist, shared by the whole
-- team: the admin sees which team member wrote each message, the artist only sees "Admin".
-- Artists never read the table directly (like everything else they see): the artist portal goes
-- through server actions that check who is signed in. Only the team can read it from the admin.

create table if not exists public.chat_messages (
  id           bigint generated always as identity primary key,
  artist_id    text not null references public.artists(id) on delete cascade on update cascade,
  from_artist  boolean not null default false,
  sender       text not null default '',                       -- the team member's name; empty for the artist's own messages
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now(),
  read_at      timestamptz                                      -- when the other side opened it
);

create index if not exists chat_messages_artist_idx on public.chat_messages (artist_id, created_at);
create index if not exists chat_messages_unread_idx on public.chat_messages (artist_id) where read_at is null;

alter table public.chat_messages enable row level security;

drop policy if exists "staff read" on public.chat_messages;
create policy "staff read" on public.chat_messages for select to authenticated using (private.is_staff());

revoke all on public.chat_messages from anon;
grant select on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;

-- Live updates: the team's panel (staff channel) and the artist's own channel hear about a message.
create or replace function public.live_changed() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  topics text[] := array['staff'];
  rid    text;
  ref    text;
  t      text;
begin
  if tg_table_name = 'bookings' then
    if tg_op <> 'INSERT' then topics := topics || public.booking_topics(old); end if;
    if tg_op <> 'DELETE' then topics := topics || public.booking_topics(new); end if;
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
  elsif tg_table_name = 'payments' then
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
    ref := case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;
    topics := topics || coalesce((
      select array_agg('customer:' || public.email_key(b.customer_email))
      from public.bookings b
      where b.customer_email <> '' and ref <> '' and (b.id = ref or b.request_ref = ref)), '{}');
  elsif tg_table_name = 'artists' then
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
    topics := topics || ('artist:' || rid);
  elsif tg_table_name = 'applications' then
    rid := case when tg_op = 'DELETE' then old.id else new.id end;
    topics := topics || ('applicant:' || public.email_key(case when tg_op = 'DELETE' then old.email else new.email end));
  elsif tg_table_name = 'artist_replies' then
    rid := case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;
    topics := topics || ('artist:' || case when tg_op = 'DELETE' then old.artist_id else new.artist_id end);
  elsif tg_table_name = 'chat_messages' then
    rid := case when tg_op = 'DELETE' then old.id::text else new.id::text end;
    topics := topics || ('artist:' || case when tg_op = 'DELETE' then old.artist_id else new.artist_id end);
  elsif tg_table_name = 'settings' then
    rid := '1';
  else
    rid := case when tg_op = 'DELETE' then old.id::text else new.id::text end;
  end if;

  foreach t in array (select array_agg(distinct x) from unnest(topics) x) loop
    begin
      perform realtime.send(jsonb_build_object('table', tg_table_name, 'id', rid), 'changed', t, true);
    exception when others then
      null; -- a live-update hiccup must never block a save
    end;
  end loop;
  return null;
end $$;

revoke execute on function public.live_changed() from public, anon, authenticated;

drop trigger if exists live on public.chat_messages;
create trigger live after insert or update or delete on public.chat_messages
  for each row execute function public.live_changed();
