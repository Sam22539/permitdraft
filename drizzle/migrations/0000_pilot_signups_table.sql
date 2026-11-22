create table public.pilot_signups (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (char_length(company_name) between 1 and 150),
  contact_name text not null check (char_length(contact_name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200 and email like '%_@_%._%'),
  county text not null check (county in ('Sacramento','San Diego')),
  created_at timestamptz not null default now()
);
select private.anyone_adds('public.pilot_signups');
select private.admins_change('public.pilot_signups', '{select}');
select private.only_columns('public.pilot_signups', '{company_name,contact_name,email,county}', '{}', '{anon,authenticated}');
select private.email_owner('public.pilot_signups', 'New PermitDraft pilot signup');
insert into public.admins (email) select current_setting('foundable.owner_email', true) where current_setting('foundable.owner_email', true) <> '' on conflict do nothing;
