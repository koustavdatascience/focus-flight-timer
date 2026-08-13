-- Preserve resumable timer state without weakening the existing user-scoped RLS policies.

alter table public.trips
  add column if not exists elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  add column if not exists is_paused boolean not null default false,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists trips_user_status_updated_at_idx
  on public.trips (user_id, status, updated_at desc);
