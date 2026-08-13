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
});
