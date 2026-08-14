-- Co-Focus group-flight lifecycle. All state-changing operations are exposed
-- through authenticated RPCs so the browser cannot create completion credit or
-- advance a shared timer by updating tables directly.

create or replace function public.create_focus_room(
  p_name text,
  p_visibility text default 'invite_only',
  p_max_members smallint default 10
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room_id uuid;
  v_invite_code text;
  v_attempt integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 60 then
    raise exception 'room_name_must_be_between_2_and_60_characters' using errcode = '22023';
  end if;
  if p_visibility not in ('invite_only', 'unlisted') then
    raise exception 'invalid_room_visibility' using errcode = '22023';
  end if;
  if p_max_members not between 2 and 10 then
    raise exception 'room_capacity_must_be_between_2_and_10' using errcode = '22023';
  end if;

  for v_attempt in 1..5 loop
    v_invite_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
    begin
      insert into public.rooms (name, invite_code, owner_id, visibility, max_members)
      values (trim(p_name), v_invite_code, v_user_id, p_visibility, p_max_members)
      returning id into v_room_id;
      exit;
    exception when unique_violation then
      v_room_id := null;
    end;
  end loop;

  if v_room_id is null then
    raise exception 'unable_to_create_unique_invite_code' using errcode = '40001';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (v_room_id, v_user_id, 'owner');

  return v_room_id;
end;
$$;

create or replace function public.join_focus_room(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_active_members integer;
  v_left_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select * into v_room
  from public.rooms
  where invite_code = upper(trim(coalesce(p_invite_code, '')))
  for update;

  if not found or v_room.archived_at is not null then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;

  select left_at into v_left_at
  from public.room_members
  where room_id = v_room.id and user_id = v_user_id;

  if found and v_left_at is null then
    return v_room.id;
  end if;

  select count(*) into v_active_members
  from public.room_members
  where room_id = v_room.id and left_at is null;

  if v_active_members >= v_room.max_members then
    raise exception 'room_is_full' using errcode = 'P0001';
  end if;

  if v_left_at is not null then
    update public.room_members
    set left_at = null, joined_at = timezone('utc', now()), role = 'member'
    where room_id = v_room.id and user_id = v_user_id;
  else
    insert into public.room_members (room_id, user_id, role)
    values (v_room.id, v_user_id, 'member');
  end if;

  return v_room.id;
end;
$$;

create or replace function public.start_group_flight(
  p_room_id uuid,
  p_origin_airport_id text,
  p_destination_airport_id text,
  p_distance_km integer,
  p_focus_duration_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;
  if p_origin_airport_id is null or p_destination_airport_id is null or p_origin_airport_id = p_destination_airport_id then
    raise exception 'select_two_different_airports' using errcode = '22023';
  end if;
  if p_distance_km < 0 or p_focus_duration_seconds <= 0 then
    raise exception 'invalid_group_flight_duration_or_distance' using errcode = '22023';
  end if;

  -- Serialize session creation and membership inspection per room.
  perform 1 from public.rooms where id = p_room_id and archived_at is null for update;
  if not found then
    raise exception 'room_not_found' using errcode = 'P0002';
  end if;

  select role into v_role
  from public.room_members
  where room_id = p_room_id and user_id = v_user_id and left_at is null;
  if not found then
    raise exception 'room_membership_required' using errcode = '42501';
  end if;
  if v_role <> 'owner' then
    raise exception 'only_the_room_owner_can_start_a_group_flight' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.group_flight_sessions
    where room_id = p_room_id
      and status in ('boarding', 'active', 'paused_waiting_for_members')
  ) then
    raise exception 'room_already_has_a_live_group_flight' using errcode = 'P0001';
  end if;

  insert into public.group_flight_sessions (
    room_id, created_by, origin_airport_id, destination_airport_id,
    distance_km, focus_duration_seconds, status
  ) values (
    p_room_id, v_user_id, p_origin_airport_id, p_destination_airport_id,
    p_distance_km, p_focus_duration_seconds, 'boarding'
  ) returning id into v_session_id;

  -- The current room membership at takeoff is the session roster. A subset can
  -- never start: every active member receives a participant row and must be
  -- ready and present before the timer starts.
  insert into public.group_flight_participants (session_id, user_id)
  select v_session_id, user_id
  from public.room_members
  where room_id = p_room_id and left_at is null;

  return v_session_id;
end;
$$;

create or replace function public.reconcile_group_flight(p_session_id uuid)
returns public.group_flight_sessions
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.group_flight_sessions%rowtype;
  v_total_participants integer;
  v_ready_and_present integer;
  v_elapsed integer;
  v_now timestamptz := timezone('utc', now());
  v_participant_user_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select s.* into v_session
  from public.group_flight_sessions s
  join public.room_members rm on rm.room_id = s.room_id
  where s.id = p_session_id and rm.user_id = v_user_id and rm.left_at is null
  for update of s;
  if not found then
    raise exception 'group_session_not_found_or_not_authorized' using errcode = '42501';
  end if;
  if v_session.status in ('completed', 'abandoned') then
    return v_session;
  end if;

  v_elapsed := v_session.elapsed_active_seconds;
  if v_session.status = 'active' and v_session.last_resumed_at is not null then
    v_elapsed := least(
      v_session.focus_duration_seconds,
      v_elapsed + greatest(0, floor(extract(epoch from (v_now - v_session.last_resumed_at)))::integer)
    );
  end if;

  select
    count(*),
    count(*) filter (
      where p.is_ready
        and h.last_seen_at >= v_now - interval '45 seconds'
    )
  into v_total_participants, v_ready_and_present
  from public.group_flight_participants p
  left join public.group_presence_heartbeats h
    on h.session_id = p.session_id and h.user_id = p.user_id
  where p.session_id = v_session.id;

  if v_total_participants = 0 then
    raise exception 'group_session_has_no_participants' using errcode = 'P0001';
  end if;

  -- A session is only abandoned after it has actually started and every member
  -- has subsequently become absent. A newly created boarding session stays
  -- available while members join and mark themselves ready.
  if v_session.started_at is not null and v_ready_and_present = 0 then
    update public.group_flight_sessions
    set status = 'abandoned',
        elapsed_active_seconds = v_elapsed,
        last_resumed_at = null,
        abandoned_at = v_now
    where id = v_session.id
    returning * into v_session;
    return v_session;
  end if;

  if v_ready_and_present = v_total_participants then
    if v_elapsed >= v_session.focus_duration_seconds then
      update public.group_flight_sessions
      set status = 'completed',
          elapsed_active_seconds = focus_duration_seconds,
          last_resumed_at = null,
          completed_at = v_now
      where id = v_session.id
      returning * into v_session;

      update public.group_flight_participants
      set completed_at = v_now
      where session_id = v_session.id and completed_at is null;

      for v_participant_user_id in
        insert into public.group_trips (
          session_id, room_id, user_id, origin_airport_id, destination_airport_id,
          distance_km, focus_duration_seconds, completed_at, completion_month_utc
        )
        select
          v_session.id, v_session.room_id, p.user_id, v_session.origin_airport_id,
          v_session.destination_airport_id, v_session.distance_km,
          v_session.focus_duration_seconds, v_now,
          date_trunc('month', v_now at time zone 'UTC')::date
        from public.group_flight_participants p
        where p.session_id = v_session.id
        on conflict (session_id, user_id) do nothing
        returning user_id
      loop
        perform focusflight_private.increment_leaderboard(
          v_participant_user_id,
          'cofocus',
          v_session.focus_duration_seconds,
          v_now
        );
      end loop;

      return v_session;
    end if;

    update public.group_flight_sessions
    set status = 'active',
        elapsed_active_seconds = v_elapsed,
        started_at = coalesce(started_at, v_now),
        last_resumed_at = case when status = 'active' then last_resumed_at else v_now end
    where id = v_session.id
    returning * into v_session;
    return v_session;
  end if;

  -- Someone is not ready or not currently present. The shared timer stops at
  -- the authoritative elapsed point and resumes only once the entire roster is
  -- again ready and fresh.
  if v_session.started_at is null then
    update public.group_flight_sessions
    set status = 'boarding', elapsed_active_seconds = v_elapsed, last_resumed_at = null
    where id = v_session.id
    returning * into v_session;
  else
    update public.group_flight_sessions
    set status = 'paused_waiting_for_members',
        elapsed_active_seconds = v_elapsed,
        last_resumed_at = null
    where id = v_session.id
    returning * into v_session;
  end if;
  return v_session;
end;
$$;

create or replace function public.set_group_flight_ready(
  p_session_id uuid,
  p_is_ready boolean
)
returns public.group_flight_sessions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select s.status into v_status
  from public.group_flight_sessions s
  join public.group_flight_participants p on p.session_id = s.id
  where s.id = p_session_id and p.user_id = v_user_id;
  if not found then
    raise exception 'group_session_participation_required' using errcode = '42501';
  end if;
  if v_status in ('completed', 'abandoned') then
    raise exception 'group_session_is_no_longer_live' using errcode = 'P0001';
  end if;

  update public.group_flight_participants
  set is_ready = p_is_ready,
      ready_at = case when p_is_ready then coalesce(ready_at, timezone('utc', now())) else null end,
      last_seen_at = timezone('utc', now())
  where session_id = p_session_id and user_id = v_user_id;

  if p_is_ready then
    insert into public.group_presence_heartbeats (session_id, user_id, last_seen_at)
    values (p_session_id, v_user_id, timezone('utc', now()))
    on conflict (session_id, user_id)
    do update set last_seen_at = excluded.last_seen_at;
  end if;

  return public.reconcile_group_flight(p_session_id);
end;
$$;

create or replace function public.heartbeat_group_flight(
  p_session_id uuid,
  p_present boolean default true
)
returns public.group_flight_sessions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_status text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select s.status into v_status
  from public.group_flight_sessions s
  join public.group_flight_participants p on p.session_id = s.id
  where s.id = p_session_id and p.user_id = v_user_id;
  if not found then
    raise exception 'group_session_participation_required' using errcode = '42501';
  end if;
  if v_status in ('completed', 'abandoned') then
    return (select s from public.group_flight_sessions s where s.id = p_session_id);
  end if;

  if p_present then
    insert into public.group_presence_heartbeats (session_id, user_id, last_seen_at)
    values (p_session_id, v_user_id, timezone('utc', now()))
    on conflict (session_id, user_id)
    do update set last_seen_at = excluded.last_seen_at;

    update public.group_flight_participants
    set last_seen_at = timezone('utc', now())
    where session_id = p_session_id and user_id = v_user_id;
  else
    delete from public.group_presence_heartbeats
    where session_id = p_session_id and user_id = v_user_id;
  end if;

  return public.reconcile_group_flight(p_session_id);
end;
$$;

create or replace function public.abandon_group_flight(p_session_id uuid)
returns public.group_flight_sessions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.group_flight_sessions%rowtype;
  v_elapsed integer;
  v_now timestamptz := timezone('utc', now());
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select s.* into v_session
  from public.group_flight_sessions s
  where s.id = p_session_id and s.created_by = v_user_id
  for update;
  if not found then
    raise exception 'only_the_session_creator_can_abandon_this_group_flight' using errcode = '42501';
  end if;
  if v_session.status in ('completed', 'abandoned') then
    return v_session;
  end if;

  v_elapsed := v_session.elapsed_active_seconds;
  if v_session.status = 'active' and v_session.last_resumed_at is not null then
    v_elapsed := least(
      v_session.focus_duration_seconds,
      v_elapsed + greatest(0, floor(extract(epoch from (v_now - v_session.last_resumed_at)))::integer)
    );
  end if;

  update public.group_flight_sessions
  set status = 'abandoned',
      elapsed_active_seconds = v_elapsed,
      last_resumed_at = null,
      abandoned_at = v_now
  where id = v_session.id
  returning * into v_session;

  return v_session;
end;
$$;

create or replace function public.get_group_flight_roster(p_session_id uuid)
returns table (
  user_id uuid,
  is_ready boolean,
  is_present boolean,
  last_seen_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p.user_id,
    p.is_ready,
    coalesce(h.last_seen_at >= timezone('utc', now()) - interval '45 seconds', false) as is_present,
    h.last_seen_at
  from public.group_flight_participants p
  join public.group_flight_sessions s on s.id = p.session_id
  left join public.group_presence_heartbeats h
    on h.session_id = p.session_id and h.user_id = p.user_id
  where p.session_id = p_session_id
    and exists (
      select 1 from public.room_members viewer
      where viewer.room_id = s.room_id
        and viewer.user_id = auth.uid()
        and viewer.left_at is null
    )
  order by p.joined_at asc;
$$;

revoke all on function public.create_focus_room(text, text, smallint) from public, anon;
revoke all on function public.join_focus_room(text) from public, anon;
revoke all on function public.start_group_flight(uuid, text, text, integer, integer) from public, anon;
revoke all on function public.reconcile_group_flight(uuid) from public, anon;
revoke all on function public.set_group_flight_ready(uuid, boolean) from public, anon;
revoke all on function public.heartbeat_group_flight(uuid, boolean) from public, anon;
revoke all on function public.abandon_group_flight(uuid) from public, anon;
revoke all on function public.get_group_flight_roster(uuid) from public, anon;

grant execute on function public.create_focus_room(text, text, smallint) to authenticated;
grant execute on function public.join_focus_room(text) to authenticated;
grant execute on function public.start_group_flight(uuid, text, text, integer, integer) to authenticated;
grant execute on function public.reconcile_group_flight(uuid) to authenticated;
grant execute on function public.set_group_flight_ready(uuid, boolean) to authenticated;
grant execute on function public.heartbeat_group_flight(uuid, boolean) to authenticated;
grant execute on function public.abandon_group_flight(uuid) to authenticated;
grant execute on function public.get_group_flight_roster(uuid) to authenticated;

comment on function public.reconcile_group_flight(uuid) is
  'Authoritative Co-Focus state transition. It only advances while every session participant is ready and has a fresh persisted presence heartbeat.';
comment on function public.heartbeat_group_flight(uuid, boolean) is
  'Authenticated participant heartbeat. Presence becomes stale after 45 seconds and reconciliation pauses or abandons the shared flight as appropriate.';
