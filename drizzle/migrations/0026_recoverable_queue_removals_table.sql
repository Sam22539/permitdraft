create table public.packet_removals (
  packet_id uuid primary key references public.office_packets(id) on delete cascade,
  company_id uuid not null,
  removed boolean not null default true,
  removed_by text not null,
  removed_at timestamptz not null default now(),
  restored_by text,
  restored_at timestamptz
);
alter table public.packet_removals enable row level security;
create policy "office reads removals" on public.packet_removals for select to authenticated using (is_office_of(company_id));
create policy "office removes own company packets" on public.packet_removals for insert to authenticated
 with check (is_office_of(company_id) and removed_by = lower(coalesce(auth.jwt() ->> 'email','')) and exists (select 1 from office_packets p where p.id = packet_id and p.company_id = packet_removals.company_id));
create policy "office restores own company packets" on public.packet_removals for update to authenticated
 using (is_office_of(company_id)) with check (is_office_of(company_id) and exists (select 1 from office_packets p where p.id = packet_id and p.company_id = packet_removals.company_id));
revoke all on public.packet_removals from anon, authenticated;
grant select, insert, update, delete on public.packet_removals to service_role;
grant select on public.packet_removals to authenticated;
grant insert (packet_id, company_id, removed_by) on public.packet_removals to authenticated;
grant update (removed, removed_by, removed_at, restored_by, restored_at) on public.packet_removals to authenticated;
