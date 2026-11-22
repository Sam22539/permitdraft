create table public.core_trials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  check (expires_at = started_at + interval '14 days')
);
select private.own_rows('public.core_trials', 'user_id', '{select}');
revoke insert, update, delete on public.core_trials from anon, authenticated;
create or replace function public.core_trial_status() returns table (started_at timestamptz, expires_at timestamptz, active boolean)
  language sql stable security invoker set search_path = '' as
  $$ select t.started_at, t.expires_at, t.expires_at > now() from public.core_trials t where t.user_id = auth.uid() $$;
revoke all on function public.core_trial_status() from public, anon;
grant execute on function public.core_trial_status() to authenticated, service_role;
