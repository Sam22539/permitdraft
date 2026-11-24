create table public.job_locations (
  packet_id uuid primary key references public.office_packets(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  placed_by text not null,
  placed_at timestamptz not null default now()
);
alter table public.job_locations enable row level security;
revoke all on public.job_locations from anon, authenticated;
grant select, insert, update, delete on public.job_locations to service_role;
grant select on public.job_locations to authenticated;
grant insert (packet_id, company_id, lat, lng, placed_by) on public.job_locations to authenticated;
grant update (lat, lng, placed_by, placed_at) on public.job_locations to authenticated;
grant delete on public.job_locations to authenticated;
create policy "office reads company pins" on public.job_locations for select to authenticated using (public.is_office_of(company_id));
create policy "office places company pins" on public.job_locations for insert to authenticated with check (public.is_office_of(company_id) and placed_by = lower(coalesce(auth.jwt() ->> 'email','')) and exists (select 1 from public.office_packets p where p.id = packet_id and p.company_id = job_locations.company_id));
create policy "office moves company pins" on public.job_locations for update to authenticated using (public.is_office_of(company_id)) with check (public.is_office_of(company_id) and placed_by = lower(coalesce(auth.jwt() ->> 'email','')));
create policy "office removes company pins" on public.job_locations for delete to authenticated using (public.is_office_of(company_id));
