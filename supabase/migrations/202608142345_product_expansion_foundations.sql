-- FocusFlight product-expansion foundation.
-- This migration is additive: existing solo trips remain the canonical solo
-- history and none of the new group records modify a user's solo location.

create schema if not exists focusflight_private;
revoke all on schema focusflight_private from public;
grant usage on schema focusflight_private to authenticated;

alter table public.profiles
  add column if not exists handle text,
  add column if not exists bio text,
  add column if not exists avatar_path text,
  add column if not exists location_visibility text not null default 'only_me',
  add column if not exists leaderboard_opt_in boolean not null default true,
  add column if not exists solo_current_airport_id text,
  add column if not exists solo_location_version integer not null default 0,
  add column if not exists public_profile_enabled boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_handle_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_handle_format_check
      check (handle is null or handle ~ '^[a-z0-9](?:[a-z0-9_]{1,18}[a-z0-9])?$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_bio_length_check'
  ) then
    alter table public.profiles
      add constraint profiles_bio_length_check
      check (bio is null or char_length(bio) <= 280);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_location_visibility_check'
  ) then
    alter table public.profiles
      add constraint profiles_location_visibility_check
      check (location_visibility in ('only_me', 'shared_rooms', 'public'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_solo_location_version_check'
  ) then
    alter table public.profiles
      add constraint profiles_solo_location_version_check
      check (solo_location_version >= 0);
  end if;
end;
$$;

create unique index if not exists profiles_handle_lower_unique_idx
  on public.profiles (lower(handle))
  where handle is not null;

alter table public.trips
  add column if not exists started_location_version integer not null default 0,
  add column if not exists completion_month_utc date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trips_started_location_version_check'
  ) then
    alter table public.trips
      add constraint trips_started_location_version_check
      check (started_location_version >= 0);
  end if;
end;
$$;

create index if not exists trips_user_completion_month_idx
  on public.trips (user_id, completion_month_utc desc)
  where status = 'completed';

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 60),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{8}$'),
  owner_id uuid not null references auth.users(id) on delete restrict,
  visibility text not null default 'invite_only'
    check (visibility in ('invite_only', 'unlisted')),
  max_members smallint not null default 10 check (max_members between 2 and 10),
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  left_at timestamptz,
  primary key (room_id, user_id),
  check (left_at is null or left_at >= joined_at)
);

create unique index if not exists room_members_one_active_owner_idx
  on public.room_members (room_id)
  where role = 'owner' and left_at is null;

create index if not exists room_members_user_active_idx
  on public.room_members (user_id, joined_at desc)
  where left_at is null;

create table if not exists public.group_flight_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  origin_airport_id text not null,
  destination_airport_id text not null,
  distance_km integer not null check (distance_km >= 0),
  focus_duration_seconds integer not null check (focus_duration_seconds > 0),
  status text not null default 'boarding'
    check (status in ('boarding', 'active', 'paused_waiting_for_members', 'completed', 'abandoned')),
  elapsed_active_seconds integer not null default 0 check (elapsed_active_seconds >= 0),
  last_resumed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  abandoned_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (origin_airport_id <> destination_airport_id),
  check (elapsed_active_seconds <= focus_duration_seconds),
  check (
    (status = 'completed' and completed_at is not null and abandoned_at is null)
    or (status = 'abandoned' and abandoned_at is not null and completed_at is null)
    or (status in ('boarding', 'active', 'paused_waiting_for_members') and completed_at is null and abandoned_at is null)
  )
);

create index if not exists group_sessions_room_created_idx
  on public.group_flight_sessions (room_id, created_at desc);

create index if not exists group_sessions_status_idx
  on public.group_flight_sessions (status, updated_at desc)
  where status in ('boarding', 'active', 'paused_waiting_for_members');

create table if not exists public.group_flight_participants (
  session_id uuid not null references public.group_flight_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  is_ready boolean not null default false,
  ready_at timestamptz,
  joined_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz,
  completed_at timestamptz,
  primary key (session_id, user_id),
  check ((is_ready and ready_at is not null) or (not is_ready and ready_at is null))
);

create index if not exists group_participants_user_idx
  on public.group_flight_participants (user_id, joined_at desc);

create table if not exists public.group_presence_heartbeats (
  session_id uuid not null references public.group_flight_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default timezone('utc', now()),
  primary key (session_id, user_id)
);

create index if not exists group_presence_freshness_idx
  on public.group_presence_heartbeats (session_id, last_seen_at desc);

create table if not exists public.group_trips (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.group_flight_sessions(id) on delete restrict,
  room_id uuid not null references public.rooms(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_airport_id text not null,
  destination_airport_id text not null,
  distance_km integer not null check (distance_km >= 0),
  focus_duration_seconds integer not null check (focus_duration_seconds > 0),
  completed_at timestamptz not null,
  completion_month_utc date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (session_id, user_id)
);

create index if not exists group_trips_user_completed_idx
  on public.group_trips (user_id, completed_at desc);

create table if not exists public.group_location_sync_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_session_id uuid not null references public.group_flight_sessions(id) on delete restrict,
  origin_airport_id text not null,
  destination_airport_id text not null,
  solo_location_version_at_creation integer not null check (solo_location_version_at_creation >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'used', 'invalidated_by_new_solo_flight', 'unavailable_after_location_change')),
  created_at timestamptz not null default timezone('utc', now()),
  used_at timestamptz,
  invalidated_at timestamptz,
  unique (user_id, group_session_id),
  check (
    (status = 'used' and used_at is not null and invalidated_at is null)
    or (status in ('invalidated_by_new_solo_flight', 'unavailable_after_location_change') and invalidated_at is not null and used_at is null)
    or (status = 'pending' and used_at is null and invalidated_at is null)
  )
);

create index if not exists sync_offers_user_pending_idx
  on public.group_location_sync_offers (user_id, created_at desc)
  where status = 'pending';

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  user_id_low uuid generated always as (least(requester_id, recipient_id)) stored,
  user_id_high uuid generated always as (greatest(requester_id, recipient_id)) stored,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  check (requester_id <> recipient_id),
  check ((status = 'pending' and resolved_at is null) or (status <> 'pending' and resolved_at is not null))
);

create unique index if not exists friend_requests_one_pending_pair_idx
  on public.friend_requests (user_id_low, user_id_high)
  where status = 'pending';

create index if not exists friend_requests_recipient_idx
  on public.friend_requests (recipient_id, created_at desc)
  where status = 'pending';

create table if not exists public.friendships (
  user_id_low uuid not null references auth.users(id) on delete cascade,
  user_id_high uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id_low, user_id_high),
  check (user_id_low < user_id_high)
);

create index if not exists friendships_low_idx on public.friendships (user_id_low);
create index if not exists friendships_high_idx on public.friendships (user_id_high);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

create table if not exists public.leaderboard_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('solo', 'cofocus')),
  period_type text not null check (period_type in ('monthly', 'all_time')),
  period_start_utc date not null,
  completed_focus_seconds bigint not null default 0 check (completed_focus_seconds >= 0),
  completed_flights integer not null default 0 check (completed_flights >= 0),
  last_score_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, category, period_type, period_start_utc),
  check (
    (period_type = 'all_time' and period_start_utc = date '1970-01-01')
    or period_type = 'monthly'
  )
);

create index if not exists leaderboard_rank_lookup_idx
  on public.leaderboard_entries (category, period_type, period_start_utc, completed_focus_seconds desc, last_score_at asc);

create table if not exists public.achievements (
  code text primary key check (code ~ '^[a-z0-9_]{3,64}$'),
  title text not null,
  description text not null,
  criteria_version integer not null default 1 check (criteria_version > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.achievements(code) on delete restrict,
  criteria_version integer not null check (criteria_version > 0),
  earned_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, achievement_code, criteria_version)
);

create table if not exists public.solo_location_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('initial_backfill', 'solo_trip_completed', 'group_sync_accepted')),
  airport_id text not null,
  source_trip_id uuid unique references public.trips(id) on delete restrict,
  source_group_session_id uuid references public.group_flight_sessions(id) on delete restrict,
  solo_location_version integer not null check (solo_location_version >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, source_group_session_id),
  check (
    (event_type = 'solo_trip_completed' and source_trip_id is not null and source_group_session_id is null)
    or (event_type = 'group_sync_accepted' and source_group_session_id is not null and source_trip_id is null)
    or (event_type = 'initial_backfill' and source_trip_id is not null and source_group_session_id is null)
  )
);

create index if not exists solo_location_events_user_created_idx
  on public.solo_location_events (user_id, created_at desc);

create or replace function focusflight_private.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function focusflight_private.prepare_solo_trip()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  next_location_version integer;
begin
  update public.profiles
  set solo_location_version = solo_location_version + 1,
      updated_at = timezone('utc', now())
  where id = new.user_id
  returning solo_location_version into next_location_version;

  if next_location_version is null then
    raise exception 'FocusFlight profile is required before starting a solo trip';
  end if;

  new.started_location_version := next_location_version;
  new.updated_at := timezone('utc', now());

  update public.group_location_sync_offers
  set status = 'invalidated_by_new_solo_flight',
      invalidated_at = timezone('utc', now())
  where user_id = new.user_id
    and status = 'pending';

  return new;
end;
$$;

create or replace function focusflight_private.prepare_solo_trip_completion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status <> 'completed') then
    new.completed_at := coalesce(new.completed_at, timezone('utc', now()));
    new.completion_month_utc := date_trunc('month', new.completed_at at time zone 'UTC')::date;
    new.elapsed_seconds := greatest(new.elapsed_seconds, new.focus_duration_seconds);
    new.is_paused := false;
  end if;

  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

create or replace function focusflight_private.increment_leaderboard(
  p_user_id uuid,
  p_category text,
  p_seconds integer,
  p_completed_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  month_start date := date_trunc('month', p_completed_at at time zone 'UTC')::date;
begin
  insert into public.leaderboard_entries (
    user_id, category, period_type, period_start_utc,
    completed_focus_seconds, completed_flights, last_score_at
  ) values
    (p_user_id, p_category, 'all_time', date '1970-01-01', p_seconds, 1, p_completed_at),
    (p_user_id, p_category, 'monthly', month_start, p_seconds, 1, p_completed_at)
  on conflict (user_id, category, period_type, period_start_utc)
  do update set
    completed_focus_seconds = public.leaderboard_entries.completed_focus_seconds + excluded.completed_focus_seconds,
    completed_flights = public.leaderboard_entries.completed_flights + excluded.completed_flights,
    last_score_at = greatest(public.leaderboard_entries.last_score_at, excluded.last_score_at),
    updated_at = timezone('utc', now());
end;
$$;

create or replace function focusflight_private.record_solo_trip_completion()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status <> 'completed') then
    update public.profiles
    set solo_current_airport_id = new.destination_airport_id,
        updated_at = timezone('utc', now())
    where id = new.user_id;

    insert into public.solo_location_events (
      user_id, event_type, airport_id, source_trip_id, solo_location_version
    ) values (
      new.user_id, 'solo_trip_completed', new.destination_airport_id, new.id, new.started_location_version
    ) on conflict (source_trip_id) do nothing;

    perform focusflight_private.increment_leaderboard(
      new.user_id,
      'solo',
      new.focus_duration_seconds,
      new.completed_at
    );
  end if;

  return new;
end;
$$;

create or replace function focusflight_private.is_room_member(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = p_room_id
      and user_id = auth.uid()
      and left_at is null
  );
$$;

create or replace function focusflight_private.is_group_session_participant(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
  select exists (
    select 1
    from public.group_flight_participants
    where session_id = p_session_id
      and user_id = auth.uid()
  );
$$;

create or replace function focusflight_private.users_are_blocked(p_left_user_id uuid, p_right_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
  select exists (
    select 1
    from public.blocks
    where (blocker_id = p_left_user_id and blocked_id = p_right_user_id)
       or (blocker_id = p_right_user_id and blocked_id = p_left_user_id)
  );
$$;

revoke all on function focusflight_private.touch_updated_at() from public, anon, authenticated;
revoke all on function focusflight_private.prepare_solo_trip() from public, anon, authenticated;
revoke all on function focusflight_private.prepare_solo_trip_completion() from public, anon, authenticated;
revoke all on function focusflight_private.increment_leaderboard(uuid, text, integer, timestamptz) from public, anon, authenticated;
revoke all on function focusflight_private.record_solo_trip_completion() from public, anon, authenticated;
revoke all on function focusflight_private.is_room_member(uuid) from public, anon, authenticated;
revoke all on function focusflight_private.is_group_session_participant(uuid) from public, anon, authenticated;
revoke all on function focusflight_private.users_are_blocked(uuid, uuid) from public, anon, authenticated;
grant execute on function focusflight_private.is_room_member(uuid) to authenticated;
grant execute on function focusflight_private.is_group_session_participant(uuid) to authenticated;
grant execute on function focusflight_private.users_are_blocked(uuid, uuid) to authenticated;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function focusflight_private.touch_updated_at();

drop trigger if exists rooms_touch_updated_at on public.rooms;
create trigger rooms_touch_updated_at
before update on public.rooms
for each row execute function focusflight_private.touch_updated_at();

drop trigger if exists group_sessions_touch_updated_at on public.group_flight_sessions;
create trigger group_sessions_touch_updated_at
before update on public.group_flight_sessions
for each row execute function focusflight_private.touch_updated_at();

drop trigger if exists trips_prepare_solo_start on public.trips;
create trigger trips_prepare_solo_start
before insert on public.trips
for each row execute function focusflight_private.prepare_solo_trip();

drop trigger if exists trips_prepare_solo_completion on public.trips;
create trigger trips_prepare_solo_completion
before insert or update on public.trips
for each row execute function focusflight_private.prepare_solo_trip_completion();

drop trigger if exists trips_record_solo_completion on public.trips;
create trigger trips_record_solo_completion
after insert or update on public.trips
for each row execute function focusflight_private.record_solo_trip_completion();

-- Bring existing completed solo history forward exactly once. Accounts without a
-- completed arrival retain a null current location and the guest landing behavior.
with latest_completed as (
  select distinct on (t.user_id)
    t.id,
    t.user_id,
    t.destination_airport_id,
    coalesce(t.completed_at, t.updated_at, t.created_at) as arrived_at
  from public.trips t
  where t.status = 'completed'
  order by t.user_id, coalesce(t.completed_at, t.updated_at, t.created_at) desc, t.id desc
), updated_profiles as (
  update public.profiles p
  set solo_current_airport_id = latest_completed.destination_airport_id,
      solo_location_version = greatest(p.solo_location_version, 1),
      updated_at = timezone('utc', now())
  from latest_completed
  where p.id = latest_completed.user_id
    and p.solo_current_airport_id is null
  returning p.id, p.solo_location_version
)
insert into public.solo_location_events (
  user_id, event_type, airport_id, source_trip_id, solo_location_version, created_at
)
select
  latest_completed.user_id,
  'initial_backfill',
  latest_completed.destination_airport_id,
  latest_completed.id,
  updated_profiles.solo_location_version,
  latest_completed.arrived_at
from latest_completed
join updated_profiles on updated_profiles.id = latest_completed.user_id
on conflict (source_trip_id) do nothing;

-- Row Level Security keeps raw histories private. Public data is exposed only
-- through the explicitly sanitized views below.
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.group_flight_sessions enable row level security;
alter table public.group_flight_participants enable row level security;
alter table public.group_presence_heartbeats enable row level security;
alter table public.group_trips enable row level security;
alter table public.group_location_sync_offers enable row level security;
alter table public.solo_location_events enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

grant select on public.rooms, public.room_members, public.group_flight_sessions,
  public.group_flight_participants, public.group_presence_heartbeats,
  public.group_trips, public.group_location_sync_offers, public.solo_location_events,
  public.friend_requests, public.friendships, public.blocks, public.leaderboard_entries,
  public.achievements, public.user_achievements to authenticated;

drop policy if exists rooms_select_current_member on public.rooms;
create policy rooms_select_current_member
  on public.rooms for select to authenticated
  using (focusflight_private.is_room_member(id));

drop policy if exists room_members_select_current_member on public.room_members;
create policy room_members_select_current_member
  on public.room_members for select to authenticated
  using (focusflight_private.is_room_member(room_id));

drop policy if exists group_sessions_select_current_member on public.group_flight_sessions;
create policy group_sessions_select_current_member
  on public.group_flight_sessions for select to authenticated
  using (focusflight_private.is_room_member(room_id));

drop policy if exists group_participants_select_participant on public.group_flight_participants;
create policy group_participants_select_participant
  on public.group_flight_participants for select to authenticated
  using (focusflight_private.is_group_session_participant(session_id));

drop policy if exists group_presence_select_participant on public.group_presence_heartbeats;
create policy group_presence_select_participant
  on public.group_presence_heartbeats for select to authenticated
  using (focusflight_private.is_group_session_participant(session_id));

drop policy if exists group_trips_select_own on public.group_trips;
create policy group_trips_select_own
  on public.group_trips for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists sync_offers_select_own on public.group_location_sync_offers;
create policy sync_offers_select_own
  on public.group_location_sync_offers for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists solo_location_events_select_own on public.solo_location_events;
create policy solo_location_events_select_own
  on public.solo_location_events for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists friend_requests_select_party on public.friend_requests;
create policy friend_requests_select_party
  on public.friend_requests for select to authenticated
  using ((select auth.uid()) = requester_id or (select auth.uid()) = recipient_id);

drop policy if exists friendships_select_party on public.friendships;
create policy friendships_select_party
  on public.friendships for select to authenticated
  using ((select auth.uid()) = user_id_low or (select auth.uid()) = user_id_high);

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own
  on public.blocks for select to authenticated
  using ((select auth.uid()) = blocker_id);

drop policy if exists leaderboard_entries_select_own on public.leaderboard_entries;
create policy leaderboard_entries_select_own
  on public.leaderboard_entries for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists achievements_select_authenticated on public.achievements;
create policy achievements_select_authenticated
  on public.achievements for select to authenticated
  using (true);

drop policy if exists user_achievements_select_own on public.user_achievements;
create policy user_achievements_select_own
  on public.user_achievements for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace view public.public_profile_view as
select
  p.id as profile_id,
  p.handle,
  p.display_name,
  p.bio,
  p.avatar_path,
  case when p.location_visibility = 'public' then p.solo_current_airport_id else null end as current_airport_id,
  coalesce(solo.completed_focus_seconds, 0) as solo_completed_focus_seconds,
  coalesce(solo.completed_flights, 0) as solo_completed_flights,
  coalesce(cofocus.completed_focus_seconds, 0) as cofocus_completed_focus_seconds,
  coalesce(cofocus.completed_flights, 0) as cofocus_completed_flights,
  p.created_at as pilot_since
from public.profiles p
left join public.leaderboard_entries solo
  on solo.user_id = p.id
 and solo.category = 'solo'
 and solo.period_type = 'all_time'
 and solo.period_start_utc = date '1970-01-01'
left join public.leaderboard_entries cofocus
  on cofocus.user_id = p.id
 and cofocus.category = 'cofocus'
 and cofocus.period_type = 'all_time'
 and cofocus.period_start_utc = date '1970-01-01'
where p.public_profile_enabled
  and p.handle is not null;

create or replace view public.public_leaderboard_view as
select
  e.category,
  e.period_type,
  e.period_start_utc,
  e.completed_focus_seconds,
  e.completed_flights,
  e.last_score_at,
  rank() over (
    partition by e.category, e.period_type, e.period_start_utc
    order by e.completed_focus_seconds desc, e.last_score_at asc nulls last, e.user_id asc
  ) as shared_rank,
  p.id as profile_id,
  p.handle,
  p.display_name,
  p.avatar_path,
  p.public_profile_enabled
from public.leaderboard_entries e
join public.profiles p on p.id = e.user_id
where p.leaderboard_opt_in
  and p.handle is not null;

grant select on public.public_profile_view, public.public_leaderboard_view to anon, authenticated;

comment on table public.group_trips is
  'Append-only Co-Focus history. These rows never update public.profiles.solo_current_airport_id.';
comment on table public.group_location_sync_offers is
  'Per-session optional offers. Starting any solo trip invalidates every pending offer for that user.';
comment on table public.solo_location_events is
  'Immutable arrivals from completed solo flights and explicitly accepted group-sync offers.';
