-- Replace public SECURITY DEFINER views with deliberately denormalized public
-- projection tables. RLS applies directly to these tables and the projection
-- trigger exposes only the fields intended for public discovery.

drop view if exists public.public_profile_view;
drop view if exists public.public_leaderboard_view;

create table if not exists public.public_profile_cards (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  handle text not null,
  display_name text,
  bio text,
  avatar_path text,
  current_airport_id text,
  solo_completed_focus_seconds bigint not null default 0 check (solo_completed_focus_seconds >= 0),
  solo_completed_flights integer not null default 0 check (solo_completed_flights >= 0),
  cofocus_completed_focus_seconds bigint not null default 0 check (cofocus_completed_focus_seconds >= 0),
  cofocus_completed_flights integer not null default 0 check (cofocus_completed_flights >= 0),
  pilot_since timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.public_leaderboard_rows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('solo', 'cofocus')),
  period_type text not null check (period_type in ('monthly', 'all_time')),
  period_start_utc date not null,
  completed_focus_seconds bigint not null check (completed_focus_seconds >= 0),
  completed_flights integer not null check (completed_flights >= 0),
  last_score_at timestamptz,
  handle text not null,
  display_name text,
  avatar_path text,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, category, period_type, period_start_utc)
);

create index if not exists public_leaderboard_rows_rank_lookup_idx
  on public.public_leaderboard_rows (category, period_type, period_start_utc, completed_focus_seconds desc, last_score_at asc);

create or replace function focusflight_private.sync_public_profile_card(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  card_profile public.profiles%rowtype;
  solo_entry public.leaderboard_entries%rowtype;
  cofocus_entry public.leaderboard_entries%rowtype;
begin
  select * into card_profile from public.profiles where id = p_user_id;

  if not found or not card_profile.public_profile_enabled or card_profile.handle is null then
    delete from public.public_profile_cards where profile_id = p_user_id;
    return;
  end if;

  select * into solo_entry
  from public.leaderboard_entries
  where user_id = p_user_id
    and category = 'solo'
    and period_type = 'all_time'
    and period_start_utc = date '1970-01-01';

  select * into cofocus_entry
  from public.leaderboard_entries
  where user_id = p_user_id
    and category = 'cofocus'
    and period_type = 'all_time'
    and period_start_utc = date '1970-01-01';

  insert into public.public_profile_cards (
    profile_id, handle, display_name, bio, avatar_path, current_airport_id,
    solo_completed_focus_seconds, solo_completed_flights,
    cofocus_completed_focus_seconds, cofocus_completed_flights, pilot_since, updated_at
  ) values (
    card_profile.id,
    card_profile.handle,
    card_profile.display_name,
    card_profile.bio,
    card_profile.avatar_path,
    case when card_profile.location_visibility = 'public' then card_profile.solo_current_airport_id else null end,
    coalesce(solo_entry.completed_focus_seconds, 0),
    coalesce(solo_entry.completed_flights, 0),
    coalesce(cofocus_entry.completed_focus_seconds, 0),
    coalesce(cofocus_entry.completed_flights, 0),
    card_profile.created_at,
    timezone('utc', now())
  ) on conflict (profile_id) do update set
    handle = excluded.handle,
    display_name = excluded.display_name,
    bio = excluded.bio,
    avatar_path = excluded.avatar_path,
    current_airport_id = excluded.current_airport_id,
    solo_completed_focus_seconds = excluded.solo_completed_focus_seconds,
    solo_completed_flights = excluded.solo_completed_flights,
    cofocus_completed_focus_seconds = excluded.cofocus_completed_focus_seconds,
    cofocus_completed_flights = excluded.cofocus_completed_flights,
    pilot_since = excluded.pilot_since,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function focusflight_private.sync_public_leaderboard_row(
  p_user_id uuid,
  p_category text,
  p_period_type text,
  p_period_start_utc date
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  board_profile public.profiles%rowtype;
  board_entry public.leaderboard_entries%rowtype;
begin
  select * into board_profile from public.profiles where id = p_user_id;
  select * into board_entry
  from public.leaderboard_entries
  where user_id = p_user_id
    and category = p_category
    and period_type = p_period_type
    and period_start_utc = p_period_start_utc;

  if not found
    or not board_profile.leaderboard_opt_in
    or board_profile.handle is null then
    delete from public.public_leaderboard_rows
    where user_id = p_user_id
      and category = p_category
      and period_type = p_period_type
      and period_start_utc = p_period_start_utc;
    return;
  end if;

  insert into public.public_leaderboard_rows (
    user_id, category, period_type, period_start_utc,
    completed_focus_seconds, completed_flights, last_score_at,
    handle, display_name, avatar_path, updated_at
  ) values (
    board_entry.user_id,
    board_entry.category,
    board_entry.period_type,
    board_entry.period_start_utc,
    board_entry.completed_focus_seconds,
    board_entry.completed_flights,
    board_entry.last_score_at,
    board_profile.handle,
    board_profile.display_name,
    board_profile.avatar_path,
    timezone('utc', now())
  ) on conflict (user_id, category, period_type, period_start_utc) do update set
    completed_focus_seconds = excluded.completed_focus_seconds,
    completed_flights = excluded.completed_flights,
    last_score_at = excluded.last_score_at,
    handle = excluded.handle,
    display_name = excluded.display_name,
    avatar_path = excluded.avatar_path,
    updated_at = excluded.updated_at;
end;
$$;

create or replace function focusflight_private.sync_public_profile_after_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  perform focusflight_private.sync_public_profile_card(new.id);

  perform focusflight_private.sync_public_leaderboard_row(
    entry.user_id, entry.category, entry.period_type, entry.period_start_utc
  )
  from public.leaderboard_entries entry
  where entry.user_id = new.id;

  return new;
end;
$$;

create or replace function focusflight_private.sync_public_leaderboard_after_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  perform focusflight_private.sync_public_profile_card(new.user_id);
  perform focusflight_private.sync_public_leaderboard_row(
    new.user_id, new.category, new.period_type, new.period_start_utc
  );
  return new;
end;
$$;

revoke all on function focusflight_private.sync_public_profile_card(uuid) from public, anon, authenticated;
revoke all on function focusflight_private.sync_public_leaderboard_row(uuid, text, text, date) from public, anon, authenticated;
revoke all on function focusflight_private.sync_public_profile_after_change() from public, anon, authenticated;
revoke all on function focusflight_private.sync_public_leaderboard_after_change() from public, anon, authenticated;

drop trigger if exists profiles_sync_public_projection on public.profiles;
create trigger profiles_sync_public_projection
after insert or update of handle, display_name, bio, avatar_path, location_visibility,
  solo_current_airport_id, leaderboard_opt_in, public_profile_enabled
on public.profiles
for each row execute function focusflight_private.sync_public_profile_after_change();

drop trigger if exists leaderboard_entries_sync_public_projection on public.leaderboard_entries;
create trigger leaderboard_entries_sync_public_projection
after insert or update on public.leaderboard_entries
for each row execute function focusflight_private.sync_public_leaderboard_after_change();

alter table public.public_profile_cards enable row level security;
alter table public.public_leaderboard_rows enable row level security;

grant select on public.public_profile_cards, public.public_leaderboard_rows to anon, authenticated;

drop policy if exists public_profile_cards_read on public.public_profile_cards;
create policy public_profile_cards_read
  on public.public_profile_cards for select to anon, authenticated
  using (true);

drop policy if exists public_leaderboard_rows_read on public.public_leaderboard_rows;
create policy public_leaderboard_rows_read
  on public.public_leaderboard_rows for select to anon, authenticated
  using (true);

select focusflight_private.sync_public_profile_card(profile.id)
from public.profiles profile;

select focusflight_private.sync_public_leaderboard_row(
  entry.user_id, entry.category, entry.period_type, entry.period_start_utc
)
from public.leaderboard_entries entry;
