-- Cached, source-attributed route durations are intentionally separate from airport metadata and user trips.
create table if not exists public.flight_durations (
  route_key text primary key,
  origin_airport_code text not null,
  destination_airport_code text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  source_type text not null check (source_type in ('verified_direct', 'estimated')),
  direct_flight boolean not null default false,
  source_label text not null,
  source_url text,
  fetched_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists flight_durations_airport_pair_idx
  on public.flight_durations (origin_airport_code, destination_airport_code);

alter table public.flight_durations enable row level security;

grant select on public.flight_durations to anon, authenticated;

create policy "flight_durations_public_read"
  on public.flight_durations for select
  to anon, authenticated
  using (true);

alter table public.trips
  add column if not exists flight_duration_route_key text,
  add column if not exists duration_source text check (duration_source in ('verified_direct', 'estimated')),
  add column if not exists duration_source_label text;

insert into public.flight_durations (
  route_key, origin_airport_code, destination_airport_code, duration_seconds,
  source_type, direct_flight, source_label, source_url, fetched_at, expires_at
) values
  ('CCU-DEL', 'CCU', 'DEL', 9900, 'verified_direct', true, 'Direct schedule duration · FlightsFrom', 'https://www.flightsfrom.com/CCU-DEL', '2026-08-13T00:00:00Z', '2027-02-13T00:00:00Z'),
  ('DEL-BOM', 'DEL', 'BOM', 9300, 'verified_direct', true, 'Direct schedule duration · FlightsFrom', 'https://www.flightsfrom.com/DEL-BOM', '2026-08-13T00:00:00Z', '2027-02-13T00:00:00Z'),
  ('JFK-LAX', 'JFK', 'LAX', 23760, 'verified_direct', true, 'Direct schedule duration · FlightsFrom', 'https://www.flightsfrom.com/JFK-LAX', '2026-08-13T00:00:00Z', '2027-02-13T00:00:00Z')
on conflict (route_key) do update set
  duration_seconds = excluded.duration_seconds,
  source_type = excluded.source_type,
  direct_flight = excluded.direct_flight,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  fetched_at = excluded.fetched_at,
  expires_at = excluded.expires_at,
  updated_at = timezone('utc', now());
