create table public.job_assignments (
  packet_id uuid primary key references public.office_packets(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  technician_email text not null check (technician_email = lower(technician_email)),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text check (note is null or char_length(note) <= 500),
  tracking_no text not null,
  address text,
  customer_name text,
  assigned_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at - starts_at <= interval '24 hours')
);
create index on public.job_assignments (company_id, starts_at);
create index on public.job_assignments (technician_email, starts_at);

create table public.job_assignment_audit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  packet_id uuid not null,
  tracking_no text not null,
  action text not null check (action in ('assigned','reassigned','rescheduled','reassigned_rescheduled','unassigned')),
  actor text not null,
  from_tech text, to_tech text,
  from_start timestamptz, to_start timestamptz,
  from_end timestamptz, to_end timestamptz,
  at timestamptz not null default now()
);
create index on public.job_assignment_audit (company_id, at desc);

alter table public.job_assignments enable row level security;
alter table public.job_assignment_audit enable row level security;
revoke all on public.job_assignments, public.job_assignment_audit from anon, authenticated;
grant select on public.job_assignments, public.job_assignment_audit to authenticated;
grant select, insert, update, delete on public.job_assignments, public.job_assignment_audit to service_role;

create policy "office reads company assignments" on public.job_assignments for select to authenticated using (public.is_office_of(company_id));
create policy "technician reads own assignments" on public.job_assignments for select to authenticated using (technician_email = lower(coalesce((select auth.jwt()) ->> 'email','')));
create policy "office reads company assignment audit" on public.job_assignment_audit for select to authenticated using (public.is_office_of(company_id));
