create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  office_email text check (office_email is null or office_email = lower(office_email)),
  office_email_verified_at timestamptz,
  office_email_set_by text,
  pending_email text check (pending_email is null or pending_email = lower(pending_email)),
  pending_code_hash text,
  pending_sent_at timestamptz,
  pending_expires_at timestamptz,
  pending_attempts int not null default 0,
  check ((office_email is null) = (office_email_verified_at is null))
);
create table public.company_members (
  email text primary key check (email = lower(email) and char_length(email) <= 254),
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null check (role in ('admin', 'office', 'technician')),
  added_at timestamptz not null default now()
);
create index on public.company_members (company_id);

select private.service_rows('public.company_members');
grant select on public.company_members to authenticated;
create policy "each reads their own membership" on public.company_members for select to authenticated
  using (email = lower((select auth.jwt()) ->> 'email'));

select private.service_rows('public.companies');
grant select (id, name, created_at, office_email, office_email_verified_at, pending_email, pending_expires_at) on public.companies to authenticated;
create policy "members read their company" on public.companies for select to authenticated using (exists (
  select 1 from public.company_members m where m.email = lower((select auth.jwt()) ->> 'email') and m.company_id = companies.id));

alter table public.office_packets
  add column company_id uuid references public.companies(id) on delete restrict,
  add column notify_status text,
  add column notify_to text,
  add column notify_attempts int not null default 0,
  add column notify_claimed_at timestamptz,
  add column notify_accepted_at timestamptz,
  add column notify_error text,
  add column notify_receipt text;

create policy "company office reads its packets" on public.office_packets for select to authenticated using (
  company_id is not null and exists (select 1 from public.company_members m where m.email = lower((select auth.jwt()) ->> 'email')
    and m.company_id = office_packets.company_id and m.role in ('admin', 'office')));

create policy "company office reads its packets' photos" on public.job_photos for select to authenticated using (exists (
  select 1 from public.office_packets p join public.company_members m on m.company_id = p.company_id
  where p.user_id = job_photos.user_id and p.job_id = job_photos.job_id and m.role in ('admin', 'office')
    and m.email = lower((select auth.jwt()) ->> 'email')));

-- One notice per packet: claims the send atomically, or answers why none goes. Server key only.
create or replace function public.office_notice_claim(p_packet uuid) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare pk public.office_packets; co public.companies; dest text;
begin
  select * into pk from public.office_packets where id = p_packet for update;
  if not found then return jsonb_build_object('action', 'none', 'status', 'missing'); end if;
  if pk.notify_status is null then return jsonb_build_object('action', 'none', 'status', 'legacy'); end if;
  if pk.notify_status = 'accepted' then return jsonb_build_object('action', 'none', 'status', 'accepted'); end if;
  if pk.notify_status = 'sending' and pk.notify_claimed_at > now() - interval '2 minutes' then
    return jsonb_build_object('action', 'none', 'status', 'sending');
  end if;
  select * into co from public.companies where id = pk.company_id;
  dest := coalesce(pk.notify_to, case when co.office_email_verified_at is not null then co.office_email end);
  if dest is null then
    update public.office_packets set notify_status = 'not_configured', notify_error = null where id = p_packet;
    return jsonb_build_object('action', 'none', 'status', 'not_configured');
  end if;
  update public.office_packets set notify_status = 'sending', notify_to = dest, notify_claimed_at = now(),
    notify_attempts = notify_attempts + 1, notify_error = null where id = p_packet;
  return jsonb_build_object('action', 'send', 'status', 'sending', 'to', dest, 'key', 'office-handoff-' || pk.id);
end $$;
create or replace function public.office_notice_done(p_packet uuid, p_status text, p_error text, p_receipt text) returns text
language plpgsql security invoker set search_path = '' as $$
declare s text;
begin
  if p_status not in ('accepted', 'failed') then raise exception 'status'; end if;
  update public.office_packets set notify_status = p_status, notify_error = left(p_error, 300), notify_receipt = p_receipt,
    notify_accepted_at = case when p_status = 'accepted' then now() else notify_accepted_at end
    where id = p_packet and notify_status = 'sending' returning notify_status into s;
  return s;
end $$;
revoke execute on function public.office_notice_claim(uuid), public.office_notice_done(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.office_notice_claim(uuid), public.office_notice_done(uuid, text, text, text) to service_role;
