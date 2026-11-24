create table public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  packet_id uuid references public.office_packets(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  category text not null check (category in ('permit','plans','invoice','warranty','correspondence','other')),
  notes text check (notes is null or char_length(notes) <= 1000),
  file_name text not null check (char_length(file_name) <= 200),
  mime text not null check (mime in ('application/pdf','image/jpeg','image/png','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  storage_path text not null unique,
  origin text not null default 'office_upload' check (origin = 'office_upload'),
  uploaded_by text not null,
  created_at timestamptz not null default now()
);
create index on public.company_documents (company_id, created_at desc);
create index on public.company_documents (packet_id);

create table public.equipment_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  packet_id uuid not null references public.office_packets(id) on delete restrict,
  unit_label text not null check (char_length(unit_label) between 1 and 120),
  note text not null check (char_length(note) between 1 and 1000),
  created_by text not null,
  created_at timestamptz not null default now()
);
create index on public.equipment_notes (company_id, created_at desc);

create table public.company_inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  packet_id uuid not null references public.office_packets(id) on delete restrict,
  tracking_no text not null,
  kind text not null check (char_length(kind) between 1 and 120),
  scheduled_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','passed','failed','cancelled')),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.company_inspections (company_id, scheduled_at);

create table public.inspection_audit (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  inspection_id uuid not null references public.company_inspections(id) on delete restrict,
  packet_id uuid not null,
  action text not null check (action in ('recorded','rescheduled','outcome','edited')),
  actor text not null,
  from_at timestamptz, to_at timestamptz,
  from_status text, to_status text,
  note text,
  at timestamptz not null default now()
);
create index on public.inspection_audit (company_id, at desc);

alter table public.company_documents enable row level security;
alter table public.equipment_notes enable row level security;
alter table public.company_inspections enable row level security;
alter table public.inspection_audit enable row level security;
revoke all on public.company_documents, public.equipment_notes, public.company_inspections, public.inspection_audit from anon, authenticated;
grant select on public.company_documents, public.equipment_notes, public.company_inspections, public.inspection_audit to authenticated;
grant select, insert, update, delete on public.company_documents, public.equipment_notes, public.company_inspections, public.inspection_audit to service_role;
create policy "office reads company documents" on public.company_documents for select to authenticated using (public.is_office_of(company_id));
create policy "office reads equipment notes" on public.equipment_notes for select to authenticated using (public.is_office_of(company_id));
create policy "office reads inspections" on public.company_inspections for select to authenticated using (public.is_office_of(company_id));
create policy "office reads inspection audit" on public.inspection_audit for select to authenticated using (public.is_office_of(company_id));
