-- Phase 6: social actions remain RPC-only, while public profile detail is
-- evaluated for the requesting viewer. Blocks supersede friendships and
-- pending requests; a friend relationship never overrides location privacy.

create or replace function focusflight_private.are_friends(
  p_left_user_id uuid,
  p_right_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
  select p_left_user_id is not null
    and p_right_user_id is not null
    and p_left_user_id <> p_right_user_id
    and exists (
      select 1
      from public.friendships
      where user_id_low = least(p_left_user_id, p_right_user_id)
        and user_id_high = greatest(p_left_user_id, p_right_user_id)
    );
$$;

create or replace function focusflight_private.users_share_active_room(
  p_left_user_id uuid,
  p_right_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
  select p_left_user_id is not null
    and p_right_user_id is not null
    and p_left_user_id <> p_right_user_id
    and exists (
      select 1
      from public.room_members left_member
      join public.room_members right_member
        on right_member.room_id = left_member.room_id
      where left_member.user_id = p_left_user_id
        and right_member.user_id = p_right_user_id
        and left_member.left_at is null
        and right_member.left_at is null
    );
$$;

create or replace function public.get_focusflight_profile(p_handle text)
returns table (
  profile_id uuid,
  handle text,
  display_name text,
  bio text,
  avatar_path text,
  current_airport_id text,
  solo_completed_focus_seconds bigint,
  solo_completed_flights integer,
  cofocus_completed_focus_seconds bigint,
  cofocus_completed_flights integer,
  pilot_since timestamptz,
  access_level text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  target_profile public.profiles%rowtype;
  viewer_id uuid := auth.uid();
  viewer_is_self boolean := false;
  viewer_is_friend boolean := false;
  viewer_shares_room boolean := false;
  may_open_profile boolean := false;
  may_view_deep_details boolean := false;
  solo_entry public.leaderboard_entries%rowtype;
  cofocus_entry public.leaderboard_entries%rowtype;
begin
  select * into target_profile
  from public.profiles
  where lower(profiles.handle) = lower(trim(p_handle));

  if not found then
    return;
  end if;

  viewer_is_self := viewer_id = target_profile.id;

  if viewer_id is not null and not viewer_is_self
    and focusflight_private.users_are_blocked(viewer_id, target_profile.id) then
    return;
  end if;

  viewer_is_friend := viewer_id is not null
    and focusflight_private.are_friends(viewer_id, target_profile.id);
  viewer_shares_room := viewer_id is not null
    and focusflight_private.users_share_active_room(viewer_id, target_profile.id);
  may_open_profile := viewer_is_self or viewer_is_friend or target_profile.public_profile_enabled;
  may_view_deep_details := viewer_is_self or viewer_is_friend;

  if not may_open_profile then
    return;
  end if;

  select * into solo_entry
  from public.leaderboard_entries
  where user_id = target_profile.id
    and category = 'solo'
    and period_type = 'all_time'
    and period_start_utc = date '1970-01-01';

  select * into cofocus_entry
  from public.leaderboard_entries
  where user_id = target_profile.id
    and category = 'cofocus'
    and period_type = 'all_time'
    and period_start_utc = date '1970-01-01';

  return query select
    target_profile.id,
    target_profile.handle,
    target_profile.display_name,
    target_profile.bio,
    target_profile.avatar_path,
    case
      when viewer_is_self then target_profile.solo_current_airport_id
      when target_profile.location_visibility = 'public' then target_profile.solo_current_airport_id
      when target_profile.location_visibility = 'shared_rooms' and viewer_shares_room then target_profile.solo_current_airport_id
      else null
    end,
    case when may_view_deep_details then coalesce(solo_entry.completed_focus_seconds, 0) else null end,
    case when may_view_deep_details then coalesce(solo_entry.completed_flights, 0) else null end,
    case when may_view_deep_details then coalesce(cofocus_entry.completed_focus_seconds, 0) else null end,
    case when may_view_deep_details then coalesce(cofocus_entry.completed_flights, 0) else null end,
    target_profile.created_at,
    case when viewer_is_self then 'self' when viewer_is_friend then 'friend' else 'public' end;
end;
$$;

create or replace function public.send_focusflight_friend_request(p_recipient_id uuid)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  viewer_id uuid := auth.uid();
  request_id uuid;
begin
  if viewer_id is null then
    raise exception 'Sign in to send a friend request';
  end if;
  if p_recipient_id is null or p_recipient_id = viewer_id then
    raise exception 'Choose another FocusFlight pilot';
  end if;
  if not exists (select 1 from public.profiles where id = p_recipient_id) then
    raise exception 'That FocusFlight profile is unavailable';
  end if;
  if focusflight_private.users_are_blocked(viewer_id, p_recipient_id) then
    raise exception 'This pilot is unavailable';
  end if;
  if focusflight_private.are_friends(viewer_id, p_recipient_id) then
    raise exception 'You are already friends';
  end if;
  if exists (
    select 1 from public.friend_requests
    where user_id_low = least(viewer_id, p_recipient_id)
      and user_id_high = greatest(viewer_id, p_recipient_id)
      and status = 'pending'
  ) then
    raise exception 'A friend request is already pending';
  end if;

  insert into public.friend_requests (requester_id, recipient_id)
  values (viewer_id, p_recipient_id)
  returning id into request_id;

  return request_id;
end;
$$;

create or replace function public.respond_to_focusflight_friend_request(
  p_request_id uuid,
  p_accept boolean
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  viewer_id uuid := auth.uid();
  request_row public.friend_requests%rowtype;
begin
  if viewer_id is null then
    raise exception 'Sign in to manage friend requests';
  end if;

  select * into request_row
  from public.friend_requests
  where id = p_request_id
    and recipient_id = viewer_id
  for update;

  if not found or request_row.status <> 'pending' then
    raise exception 'That friend request is no longer available';
  end if;
  if focusflight_private.users_are_blocked(request_row.requester_id, viewer_id) then
    raise exception 'This request is unavailable';
  end if;

  update public.friend_requests
  set status = case when p_accept then 'accepted' else 'declined' end,
      resolved_at = timezone('utc', now())
  where id = request_row.id;

  if p_accept then
    insert into public.friendships (user_id_low, user_id_high)
    values (request_row.user_id_low, request_row.user_id_high)
    on conflict do nothing;
  end if;

  return p_accept;
end;
$$;

create or replace function public.cancel_focusflight_friend_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  update public.friend_requests
  set status = 'cancelled',
      resolved_at = timezone('utc', now())
  where id = p_request_id
    and requester_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'That outgoing friend request is unavailable';
  end if;
end;
$$;

create or replace function public.block_focusflight_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  viewer_id uuid := auth.uid();
begin
  if viewer_id is null then
    raise exception 'Sign in to block a pilot';
  end if;
  if p_blocked_id is null or p_blocked_id = viewer_id then
    raise exception 'Choose another FocusFlight pilot';
  end if;
  if not exists (select 1 from public.profiles where id = p_blocked_id) then
    raise exception 'That FocusFlight profile is unavailable';
  end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (viewer_id, p_blocked_id)
  on conflict do nothing;

  delete from public.friendships
  where user_id_low = least(viewer_id, p_blocked_id)
    and user_id_high = greatest(viewer_id, p_blocked_id);

  update public.friend_requests
  set status = 'cancelled',
      resolved_at = timezone('utc', now())
  where user_id_low = least(viewer_id, p_blocked_id)
    and user_id_high = greatest(viewer_id, p_blocked_id)
    and status = 'pending';
end;
$$;

create or replace function public.unblock_focusflight_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  delete from public.blocks
  where blocker_id = auth.uid()
    and blocked_id = p_blocked_id;

  if not found then
    raise exception 'That pilot is not currently blocked';
  end if;
end;
$$;

create or replace function public.get_focusflight_social_overview()
returns table (
  relation text,
  request_id uuid,
  profile_id uuid,
  handle text,
  display_name text,
  avatar_path text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
  with viewer as (select auth.uid() as id), overview as (
    select
      'incoming'::text as relation,
      request.id as request_id,
      request.requester_id as profile_id,
      request.created_at
    from public.friend_requests request, viewer
    where request.recipient_id = viewer.id
      and request.status = 'pending'
      and not focusflight_private.users_are_blocked(viewer.id, request.requester_id)
    union all
    select 'outgoing', request.id, request.recipient_id, request.created_at
    from public.friend_requests request, viewer
    where request.requester_id = viewer.id
      and request.status = 'pending'
      and not focusflight_private.users_are_blocked(viewer.id, request.recipient_id)
    union all
    select
      'friend',
      null::uuid,
      case when friendship.user_id_low = viewer.id then friendship.user_id_high else friendship.user_id_low end,
      friendship.created_at
    from public.friendships friendship, viewer
    where viewer.id in (friendship.user_id_low, friendship.user_id_high)
      and not focusflight_private.users_are_blocked(
        viewer.id,
        case when friendship.user_id_low = viewer.id then friendship.user_id_high else friendship.user_id_low end
      )
    union all
    select 'blocked', null::uuid, block.blocked_id, block.created_at
    from public.blocks block, viewer
    where block.blocker_id = viewer.id
  )
  select overview.relation, overview.request_id, profile.id, profile.handle,
    profile.display_name, profile.avatar_path, overview.created_at
  from overview
  join public.profiles profile on profile.id = overview.profile_id
  order by overview.created_at desc;
$$;

revoke all on function focusflight_private.are_friends(uuid, uuid) from public, anon, authenticated;
revoke all on function focusflight_private.users_share_active_room(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_focusflight_profile(text) from public;
revoke all on function public.send_focusflight_friend_request(uuid) from public;
revoke all on function public.respond_to_focusflight_friend_request(uuid, boolean) from public;
revoke all on function public.cancel_focusflight_friend_request(uuid) from public;
revoke all on function public.block_focusflight_user(uuid) from public;
revoke all on function public.unblock_focusflight_user(uuid) from public;
revoke all on function public.get_focusflight_social_overview() from public;
grant execute on function public.get_focusflight_profile(text) to anon, authenticated;
grant execute on function public.send_focusflight_friend_request(uuid) to authenticated;
grant execute on function public.respond_to_focusflight_friend_request(uuid, boolean) to authenticated;
grant execute on function public.cancel_focusflight_friend_request(uuid) to authenticated;
grant execute on function public.block_focusflight_user(uuid) to authenticated;
grant execute on function public.unblock_focusflight_user(uuid) to authenticated;
grant execute on function public.get_focusflight_social_overview() to authenticated;

drop policy if exists friend_requests_select_party on public.friend_requests;
create policy friend_requests_select_party
  on public.friend_requests for select to authenticated
  using (
    ((select auth.uid()) = requester_id or (select auth.uid()) = recipient_id)
    and not focusflight_private.users_are_blocked(requester_id, recipient_id)
  );

drop policy if exists friendships_select_party on public.friendships;
create policy friendships_select_party
  on public.friendships for select to authenticated
  using (
    ((select auth.uid()) = user_id_low or (select auth.uid()) = user_id_high)
    and not focusflight_private.users_are_blocked(user_id_low, user_id_high)
  );

revoke select on public.public_profile_cards from anon;
drop policy if exists public_profile_cards_read on public.public_profile_cards;
create policy public_profile_cards_owner_read
  on public.public_profile_cards for select to authenticated
  using ((select auth.uid()) = profile_id);

comment on function public.get_focusflight_profile(text) is
  'Viewer-aware profile contract. Friends can see deep totals; current location still follows only-me/shared-room/public privacy.';
comment on function public.block_focusflight_user(uuid) is
  'A block cancels pending requests and removes a canonical friendship; it does not delete historic group or solo records.';
