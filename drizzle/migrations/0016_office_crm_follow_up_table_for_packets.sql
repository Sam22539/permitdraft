create table public.packet_crm (
  packet_id uuid primary key references public.office_packets(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  stage text not null default 'new' check (stage in ('new','preparing','submitted','approved','inspection','closed')),
  next_follow_up date,
  note text check (note is null or char_length(note) <= 2000),
  permit_ref text check (permit_ref is null or char_length(permit_ref) <= 80),
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.packet_crm enable row level security;
grant select on public.packet_crm to authenticated;
grant insert (packet_id, company_id, stage, next_follow_up, note, permit_ref, updated_by, updated_at) on public.packet_crm to authenticated;
grant update (stage, next_follow_up, note, permit_ref, updated_by, updated_at) on public.packet_crm to authenticated;
grant all on public.packet_crm to service_role;
create policy "office reads own company crm" on public.packet_crm for select to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = packet_crm.company_id and m.role in ('admin','office') and m.email = lower((select auth.jwt() ->> 'email'))));
create policy "office adds own company crm" on public.packet_crm for insert to authenticated
  with check (exists (select 1 from public.company_members m where m.company_id = packet_crm.company_id and m.role in ('admin','office') and m.email = lower((select auth.jwt() ->> 'email')))
    and exists (select 1 from public.office_packets p where p.id = packet_crm.packet_id and p.company_id = packet_crm.company_id));
create policy "office changes own company crm" on public.packet_crm for update to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = packet_crm.company_id and m.role in ('admin','office') and m.email = lower((select auth.jwt() ->> 'email'))))
  with check (exists (select 1 from public.company_members m where m.company_id = packet_crm.company_id and m.role in ('admin','office') and m.email = lower((select auth.jwt() ->> 'email'))));
