create table public.job_extra_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  job_id text not null check (char_length(job_id) between 1 and 80),
  slot text not null check (slot in ('panel')),
  unit text check (unit in ('indoor','outdoor')),
  name text not null check (char_length(name) <= 200),
  mime text not null check (char_length(mime) <= 100),
  data_url text not null check (char_length(data_url) <= 3000000),
  taken_at bigint not null,
  created_at timestamptz not null default now(),
  unique (user_id, job_id, slot)
);
select private.own_rows('public.job_extra_photos', 'user_id', '{select,insert,update,delete}');
select private.admins_change('public.job_extra_photos', '{select}');
create policy "company office reads its packets' extra photos" on public.job_extra_photos for select to authenticated
  using (exists (select 1 from public.office_packets p join public.company_members m on m.company_id = p.company_id
    where p.user_id = job_extra_photos.user_id and p.job_id = job_extra_photos.job_id and m.role in ('admin','office')
      and m.email = lower((select auth.jwt()) ->> 'email')));
