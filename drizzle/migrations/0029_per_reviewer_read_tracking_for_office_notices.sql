create table public.office_notice_reads (
  company_id uuid not null references public.companies(id) on delete cascade,
  reviewer text not null check (reviewer = lower(reviewer)),
  kind text not null check (kind in ('packet','email_failed','correction')),
  ref_id uuid not null,
  read_at timestamptz not null default now(),
  primary key (company_id, reviewer, kind, ref_id)
);
alter table public.office_notice_reads enable row level security;
create policy "reviewers read their own notice reads" on public.office_notice_reads for select to authenticated
  using (is_office_of(company_id) and reviewer = lower(coalesce(auth.jwt() ->> 'email','')));
create policy "reviewers mark their own notices read" on public.office_notice_reads for insert to authenticated
  with check (is_office_of(company_id) and reviewer = lower(coalesce(auth.jwt() ->> 'email','')));
revoke all on public.office_notice_reads from anon, authenticated;
grant select, insert, update, delete on public.office_notice_reads to service_role;
grant select on public.office_notice_reads to authenticated;
grant insert (company_id, reviewer, kind, ref_id) on public.office_notice_reads to authenticated;
