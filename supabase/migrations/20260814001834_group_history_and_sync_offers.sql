-- Phase 5: separate private group history and transaction-safe optional solo-location sync offers.
-- Group flights never write solo trips. An offer exists only when the member was at the shared origin
-- at completion, and starting a new solo flight continues to invalidate all pending offers.

create or replace function focusflight_private.create_group_location_sync_offers()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    insert into public.group_location_sync_offers (
      user_id,
      group_session_id,
      origin_airport_id,
      destination_airport_id,
      solo_location_version_at_creation
    )
    select
      participant.user_id,
      new.id,
      new.origin_airport_id,
      new.destination_airport_id,
      profile.solo_location_version
    from public.group_flight_participants participant
    join public.profiles profile on profile.id = participant.user_id
    where participant.session_id = new.id
      and profile.solo_current_airport_id = new.origin_airport_id
    on conflict (user_id, group_session_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.accept_group_location_sync_offer(p_offer_id uuid)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, focusflight_private
as $$
declare
  v_user_id uuid := auth.uid();
  v_offer public.group_location_sync_offers%rowtype;
  v_profile public.profiles%rowtype;
  v_next_version integer;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select * into v_offer
  from public.group_location_sync_offers
  where id = p_offer_id and user_id = v_user_id
  for update;
  if not found then
    raise exception 'sync_offer_not_found_or_not_authorized' using errcode = '42501';
  end if;
  if v_offer.status <> 'pending' then
    return v_offer.status;
  end if;

  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if v_profile.solo_current_airport_id is distinct from v_offer.origin_airport_id
     or v_profile.solo_location_version <> v_offer.solo_location_version_at_creation then
    update public.group_location_sync_offers
    set status = 'unavailable_after_location_change',
        invalidated_at = timezone('utc', now())
    where id = v_offer.id and status = 'pending';
    return 'unavailable_after_location_change';
  end if;

  update public.profiles
  set solo_current_airport_id = v_offer.destination_airport_id,
      solo_location_version = solo_location_version + 1,
      updated_at = timezone('utc', now())
  where id = v_user_id
  returning solo_location_version into v_next_version;

  insert into public.solo_location_events (
    user_id,
    event_type,
    airport_id,
    source_group_session_id,
    solo_location_version
  ) values (
    v_user_id,
    'group_sync_accepted',
    v_offer.destination_airport_id,
    v_offer.group_session_id,
    v_next_version
  ) on conflict (user_id, source_group_session_id) do nothing;

  update public.group_location_sync_offers
  set status = 'used', used_at = timezone('utc', now())
  where id = v_offer.id and status = 'pending';

  -- A successful manual move makes any remaining old origin-based offers stale.
  update public.group_location_sync_offers
  set status = 'unavailable_after_location_change',
      invalidated_at = timezone('utc', now())
  where user_id = v_user_id
    and id <> v_offer.id
    and status = 'pending';

  return 'used';
end;
$$;

drop trigger if exists group_sessions_create_location_sync_offers on public.group_flight_sessions;
create trigger group_sessions_create_location_sync_offers
after update on public.group_flight_sessions
for each row execute function focusflight_private.create_group_location_sync_offers();

revoke all on function focusflight_private.create_group_location_sync_offers() from public, anon, authenticated;
revoke all on function public.accept_group_location_sync_offer(uuid) from public, anon;
grant execute on function public.accept_group_location_sync_offer(uuid) to authenticated;

comment on function public.accept_group_location_sync_offer(uuid) is
  'Optional post-completion manual solo-location update. It does not create a solo trip or award solo leaderboard credit.';
