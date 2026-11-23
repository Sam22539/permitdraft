alter table public.profiles
  add column work_phone text,
  add column notify_correction boolean not null default true,
  add column notify_receipt boolean not null default true,
  add column language text;
select private.only_columns('public.profiles', '{user_id,display_name,work_phone,notify_correction,notify_receipt,language}', '{display_name,work_phone,notify_correction,notify_receipt,language}');

alter table public.company_members add column employee_id text;
create unique index company_members_employee_id_uniq on public.company_members (company_id, lower(employee_id)) where employee_id is not null;

alter table public.companies
  add column billing_line1 text, add column billing_line2 text, add column billing_city text,
  add column billing_state text, add column billing_zip text;

alter table public.office_packets
  add column office_received_at timestamptz,
  add column office_received_by text;

create table public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  packet_id uuid not null references public.office_packets on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  company_id uuid not null references public.companies on delete cascade,
  requested_by text not null,
  note text not null check (char_length(note) between 1 and 1000),
  notify_status text not null default 'saved',
  created_at timestamptz not null default now()
);
select private.own_rows('public.correction_requests', 'user_id', '{select}');
create policy "company office reads its correction requests" on public.correction_requests for select to authenticated
  using (exists (select 1 from public.company_members m where m.company_id = correction_requests.company_id and m.role in ('admin','office') and m.email = lower((select auth.jwt() ->> 'email'))));
