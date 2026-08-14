import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = (name: string) => readFileSync(
  resolve(process.cwd(), "supabase", "migrations", name),
  "utf8",
);

describe("FocusFlight product expansion database contract", () => {
  const foundation = migration("202608142345_product_expansion_foundations.sql");
  const publicProjection = migration("202608142355_public_projection_security.sql");
  const groupHistoryAndSync = migration("202608150030_group_history_and_sync_offers.sql");
  const socialPrivacy = migration("202608150045_social_privacy_and_profile_access.sql");
  const socialGrantRestriction = migration("202608150050_restrict_social_rpc_grants.sql");

  it("keeps solo completion, group history, and sync offers as separate models", () => {
    expect(foundation).toContain("create table if not exists public.solo_location_events");
    expect(foundation).toContain("create table if not exists public.group_trips");
    expect(foundation).toContain("create table if not exists public.group_location_sync_offers");
    expect(foundation).toContain("unique (user_id, source_group_session_id)");
    expect(foundation).toContain("solo_location_version_at_creation integer not null");
  });

  it("requires a room-wide participant roster and tracks authoritative presence separately", () => {
    expect(foundation).toContain("create table if not exists public.rooms");
    expect(foundation).toContain("create table if not exists public.room_members");
    expect(foundation).toContain("create table if not exists public.group_flight_sessions");
    expect(foundation).toContain("create table if not exists public.group_flight_participants");
    expect(foundation).toContain("create table if not exists public.group_presence_heartbeats");
    expect(foundation).toContain("status in ('boarding', 'active', 'paused_waiting_for_members', 'completed', 'abandoned')");
  });

  it("makes privacy controls deny-by-default and protects every sensitive table with RLS", () => {
    expect(foundation).toContain("default 'only_me'");
    expect(foundation).toContain("location_visibility in ('only_me', 'shared_rooms', 'public')");
    expect(foundation).toContain("alter table public.group_trips enable row level security");
    expect(foundation).toContain("alter table public.group_location_sync_offers enable row level security");
    expect(foundation).toContain("alter table public.friendships enable row level security");
    expect(foundation).toContain("alter table public.blocks enable row level security");
  });

  it("exposes public discovery data only through RLS-protected projection tables", () => {
    expect(publicProjection).toContain("drop view if exists public.public_profile_view");
    expect(publicProjection).toContain("create table if not exists public.public_profile_cards");
    expect(publicProjection).toContain("create table if not exists public.public_leaderboard_rows");
    expect(publicProjection).toContain("alter table public.public_profile_cards enable row level security");
    expect(publicProjection).toContain("alter table public.public_leaderboard_rows enable row level security");
    expect(publicProjection).toContain("case when card_profile.location_visibility = 'public'");
  });

  it("aggregates completed focus time into separate UTC leaderboard periods and removes opted-out pilots", () => {
    expect(foundation).toContain("create or replace function focusflight_private.increment_leaderboard(");
    expect(foundation).toContain("date_trunc('month', p_completed_at at time zone 'UTC')::date");
    expect(foundation).toContain("'all_time'");
    expect(foundation).toContain("'solo'");
    expect(publicProjection).toContain("board_profile.leaderboard_opt_in");
    expect(publicProjection).toContain("delete from public.public_leaderboard_rows");
    expect(publicProjection).toContain("public_leaderboard_rows_rank_lookup_idx");
  });

  it("creates optional group sync offers only at completion and accepts them without solo-trip credit", () => {
    expect(groupHistoryAndSync).toContain("create_group_location_sync_offers");
    expect(groupHistoryAndSync).toContain("new.status = 'completed'");
    expect(groupHistoryAndSync).toContain("profile.solo_current_airport_id = new.origin_airport_id");
    expect(groupHistoryAndSync).toContain("accept_group_location_sync_offer");
    expect(groupHistoryAndSync).toContain("event_type,\n    airport_id,\n    source_group_session_id");
    expect(groupHistoryAndSync).toContain("Optional post-completion manual solo-location update. It does not create a solo trip");
  });

  it("uses canonical friendships and makes blocks supersede requests and friendships", () => {
    expect(socialPrivacy).toContain("public.send_focusflight_friend_request");
    expect(socialPrivacy).toContain("insert into public.friendships (user_id_low, user_id_high)");
    expect(socialPrivacy).toContain("delete from public.friendships");
    expect(socialPrivacy).toContain("status = 'cancelled'");
  });

  it("replaces direct public-card reads with viewer-aware profile access", () => {
    expect(socialPrivacy).toContain("public.get_focusflight_profile(p_handle text)");
    expect(socialPrivacy).toContain("location_visibility = 'shared_rooms'");
    expect(socialPrivacy).toContain("may_view_deep_details");
    expect(socialPrivacy).toContain("drop policy if exists public_profile_cards_read");
  });

  it("keeps social actions authenticated-only while allowing the privacy-filtered public profile reader", () => {
    expect(socialGrantRestriction).toContain("revoke execute on function public.get_focusflight_social_overview() from anon");
    expect(socialGrantRestriction).toContain("revoke execute on function public.block_focusflight_user(uuid) from anon");
    expect(socialGrantRestriction).toContain("grant execute on function public.send_focusflight_friend_request(uuid) to authenticated");
  });
});
