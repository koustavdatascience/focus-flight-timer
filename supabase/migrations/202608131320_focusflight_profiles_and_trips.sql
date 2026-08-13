-- FocusFlight user profile and travel-history schema.
-- Airport fields intentionally store the canonical airport dataset identifier only;
-- airport names, countries, and coordinates remain sourced from client/src/data/airports.json.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  home_airport_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_airport_id text not null,
  destination_airport_id text not null,
  distance_km integer not null check (distance_km >= 0),
  focus_duration_seconds integer not null check (focus_duration_seconds > 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists trips_user_completed_at_idx on public.trips (user_id, completed_at desc);
create index if not exists trips_user_created_at_idx on public.trips (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.trips enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.trips to authenticated;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "trips_select_own"
  on public.trips for select to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "trips_insert_own"
  on public.trips for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "trips_update_own"
  on public.trips for update to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
