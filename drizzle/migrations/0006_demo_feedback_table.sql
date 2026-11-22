create table public.demo_feedback (
  id uuid primary key default gen_random_uuid(),
  slowed_me_down text not null check (char_length(btrim(slowed_me_down)) between 1 and 1000),
  language text not null default 'en' check (language in ('en','es')),
  created_at timestamptz not null default now()
);
select private.anyone_adds('public.demo_feedback');
select private.email_owner('public.demo_feedback', 'Heat-pump demo feedback');
select private.admins_change('public.demo_feedback', '{select}');
insert into public.admins (email) select current_setting('foundable.owner_email', true) where current_setting('foundable.owner_email', true) <> '' on conflict do nothing;
