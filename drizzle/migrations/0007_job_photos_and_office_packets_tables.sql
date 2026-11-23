create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  job_id text not null check (char_length(job_id) between 1 and 80),
  slot text not null check (slot in ('plate','outdoor','gauge','wide')),
  unit text check (unit in ('indoor','outdoor')),
  name text not null check (char_length(name) <= 200),
  mime text not null check (char_length(mime) <= 100),
  data_url text not null check (char_length(data_url) <= 3000000),
  taken_at bigint not null,
  created_at timestamptz not null default now(),
  unique (user_id, job_id, slot)
);
select private.own_rows('public.job_photos', 'user_id', '{select,insert,update,delete}');
select private.admins_change('public.job_photos', '{select}');

create table public.office_packets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  job_id text not null check (char_length(job_id) between 1 and 80),
  captured_fields jsonb not null,
  photo_links jsonb not null,
  sent_by_name text not null check (char_length(sent_by_name) between 1 and 200),
  employee_id text check (employee_id is null or char_length(employee_id) <= 40),
  sent_at timestamptz not null default now(),
  unique (user_id, job_id)
);
select private.own_rows('public.office_packets', 'user_id', '{select}');
select private.admins_change('public.office_packets', '{select}');
