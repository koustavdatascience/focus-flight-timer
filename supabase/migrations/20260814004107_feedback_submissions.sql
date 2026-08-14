-- FocusFlight feedback is private by default: authenticated pilots submit through
-- a rate-limited RPC; there is no browser-readable submissions table.
create table if not exists public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug', 'idea', 'map_route', 'account', 'other')),
  message text not null check (char_length(message) between 10 and 5000),
  context_path text check (char_length(context_path) <= 500),
  created_at timestamptz not null default now()
);

alter table public.feedback_submissions enable row level security;
revoke all on table public.feedback_submissions from anon, authenticated;

create or replace function public.submit_focusflight_feedback(
  p_category text,
  p_message text,
  p_context_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_message text := btrim(coalesce(p_message, ''));
  v_context_path text := nullif(btrim(coalesce(p_context_path, '')), '');
begin
  if v_user_id is null then
    raise exception 'Sign in to send feedback.' using errcode = '42501';
  end if;

  if p_category not in ('bug', 'idea', 'map_route', 'account', 'other') then
    raise exception 'Choose a valid feedback category.' using errcode = '22023';
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 5000 then
    raise exception 'Feedback must be between 10 and 5,000 characters.' using errcode = '22023';
  end if;

  if v_context_path is not null and char_length(v_context_path) > 500 then
    raise exception 'Feedback context is too long.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.feedback_submissions
    where user_id = v_user_id and created_at > now() - interval '60 seconds'
  ) then
    raise exception 'Please wait a minute before sending another note.' using errcode = '42901';
  end if;

  insert into public.feedback_submissions (user_id, category, message, context_path)
  values (v_user_id, p_category, v_message, v_context_path)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_focusflight_feedback(text, text, text) from public, anon;
grant execute on function public.submit_focusflight_feedback(text, text, text) to authenticated;
