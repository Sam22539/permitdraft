create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "each reads their own profile" on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy "each adds their own profile" on public.profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy "each changes their own profile" on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.profiles from anon, authenticated;
grant select, insert, update, delete on public.profiles to service_role;
grant select on public.profiles to authenticated;
grant insert (user_id, display_name) on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
