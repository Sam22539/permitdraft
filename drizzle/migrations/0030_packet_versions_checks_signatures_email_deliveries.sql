-- Redesign back end (docs/MASTER_PROMPT.md §5): sealed packet versions, per-version checks (conflict vs missing),
-- version-locked signatures, and confirmed email delivery. All company-scoped with row-level security.
-- Writes go only through the security-definer functions below, which enforce the guards.

create extension if not exists pgcrypto with schema extensions;   -- already present on Supabase

-- 1. Sealed versions (insert-only) -------------------------------------------------------------------------------
create table public.packet_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  packet_id uuid not null references public.office_packets(id) on delete cascade,
  version integer not null check (version >= 1),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  fields jsonb not null,
  photo_ids uuid[] not null default '{}',
  photo_hashes text[] not null default '{}',   -- sha-256 of each photo's content at sealing, in photo_ids order
  reason text not null check (reason in ('sent','office_decision','tech_correction')),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (packet_id, version)
);
create index on public.packet_versions (company_id, created_at);
alter table public.packet_versions enable row level security;
revoke all on public.packet_versions from anon, authenticated;
grant select on public.packet_versions to authenticated;
grant select, insert on public.packet_versions to service_role;
create policy "office reads its packet versions" on public.packet_versions for select to authenticated
  using (public.is_office_of(company_id));
create policy "tech reads versions of own packets" on public.packet_versions for select to authenticated
  using (exists (select 1 from public.office_packets p where p.id = packet_id and p.user_id = auth.uid()));

create function public.packet_versions_readonly() returns trigger language plpgsql set search_path = public as $$
begin raise exception 'packet versions are sealed and cannot be changed' using errcode = '42501'; end $$;
create trigger packet_versions_sealed before update or delete on public.packet_versions
  for each row execute function public.packet_versions_readonly();

-- 2. Checks per version ----------------------------------------------------------------------------------------------
create table public.packet_checks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  packet_version_id uuid not null references public.packet_versions(id) on delete cascade,
  field_key text not null check (char_length(field_key) between 1 and 80),
  kind text not null check (kind in ('conflict','missing','matched')),
  captured_value text,
  evidence_value text,
  evidence_photo_id uuid,
  decision text check (decision in ('use_evidence','keep_with_note','asked_tech')),
  decided_by text,
  decided_at timestamptz,
  note text check (note is null or char_length(note) <= 1000),
  unique (packet_version_id, field_key)
);
create index on public.packet_checks (company_id);
alter table public.packet_checks enable row level security;
revoke all on public.packet_checks from anon, authenticated;
grant select on public.packet_checks to authenticated;
grant select, insert, update on public.packet_checks to service_role;
create policy "office reads its packet checks" on public.packet_checks for select to authenticated
  using (public.is_office_of(company_id));

-- 3. Version-locked signatures -------------------------------------------------------------------------------------
create table public.signatures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  packet_version_id uuid not null unique references public.packet_versions(id) on delete restrict,
  fingerprint text not null,
  signer_name text not null check (char_length(btrim(signer_name)) between 1 and 200),
  signer_email text not null check (signer_email = lower(signer_email)),
  signed_at timestamptz not null default now(),
  ip text,
  user_agent text check (user_agent is null or char_length(user_agent) <= 500)
);
alter table public.signatures enable row level security;
revoke all on public.signatures from anon, authenticated;
grant select on public.signatures to authenticated;
grant select, insert on public.signatures to service_role;
create policy "office reads its signatures" on public.signatures for select to authenticated
  using (public.is_office_of(company_id));
create trigger signatures_sealed before update or delete on public.signatures
  for each row execute function public.packet_versions_readonly();

-- 4. Confirmed email delivery ----------------------------------------------------------------------------------------
create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind text not null check (kind in ('office_new_packet','signature_request','correction_request','other')),
  to_email text not null check (to_email = lower(to_email)),
  packet_id uuid references public.office_packets(id) on delete set null,
  packet_version_id uuid references public.packet_versions(id) on delete set null,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued','delivered','bounced','failed')),
  status_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on public.email_deliveries (company_id, created_at);
create index on public.email_deliveries (provider_message_id);
alter table public.email_deliveries enable row level security;
revoke all on public.email_deliveries from anon, authenticated;
grant select on public.email_deliveries to authenticated;
grant select, insert, update on public.email_deliveries to service_role;   -- the provider webhook updates status
create policy "office reads its email deliveries" on public.email_deliveries for select to authenticated
  using (public.is_office_of(company_id));

-- 5. Functions (the only write paths for signed-in users) -----------------------------------------------------------

-- Content hash of each photo (main or extra table), in the given order; 'missing' where none exists. Photos can be
-- replaced under the same id, so a version seals what the photos contained, not only their ids.
create function private.photo_hashes(p_photo_ids uuid[]) returns text[]
language sql stable set search_path = '' as $$
  select coalesce(array_agg(coalesce(
           (select encode(extensions.digest(convert_to(p.data_url, 'UTF8'), 'sha256'), 'hex') from public.job_photos p where p.id = x),
           (select encode(extensions.digest(convert_to(e.data_url, 'UTF8'), 'sha256'), 'hex') from public.job_extra_photos e where e.id = x),
           'missing') order by x::text), '{}')
  from unnest(coalesce(p_photo_ids, '{}')) x
$$;

-- Canonical fingerprint: sha-256 of the fields (jsonb text is key-sorted), the sorted photo ids and their content hashes.
create function private.packet_fingerprint(p_fields jsonb, p_photo_ids uuid[], p_hashes text[]) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(
    convert_to(p_fields::text || '|' || coalesce((select string_agg(x::text, ',' order by x::text) from unnest(p_photo_ids) x), '')
               || '|' || array_to_string(coalesce(p_hashes, '{}'), ','), 'UTF8'),
    'sha256'), 'hex')
$$;

-- Validation finished for a version: the office confirmed its checks are complete (or a decision carried them forward).
-- Without it, a version with zero recorded checks is not signable.
create table public.packet_validations (
  packet_version_id uuid primary key references public.packet_versions(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  completed_by text not null,
  completed_at timestamptz not null default now()
);
alter table public.packet_validations enable row level security;
revoke all on public.packet_validations from anon, authenticated;
grant select on public.packet_validations to authenticated;
grant select, insert on public.packet_validations to service_role;
create policy "office reads its validations" on public.packet_validations for select to authenticated
  using (public.is_office_of(company_id));

-- Latest version of a packet, or null.
create function public.latest_packet_version(p_packet_id uuid) returns uuid language sql stable set search_path = '' as $$
  select v.id from public.packet_versions v where v.packet_id = p_packet_id order by v.version desc limit 1
$$;
grant execute on function public.latest_packet_version(uuid) to authenticated;

-- Seal the next version. Called by the tech's send (reason 'sent'/'tech_correction') or by an office decision.
create function public.seal_packet_version(p_packet_id uuid, p_reason text, p_fields jsonb, p_photo_ids uuid[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare pk public.office_packets; me text := lower(coalesce(auth.jwt() ->> 'email','')); n int; vid uuid; h text[];
begin
  select * into pk from public.office_packets where id = p_packet_id for update;
  if pk.id is null or pk.company_id is null then raise exception 'packet not found' using errcode = 'P0002'; end if;
  if not (pk.user_id = auth.uid() or public.is_office_of(pk.company_id)) then
    raise exception 'not allowed' using errcode = '42501'; end if;
  if p_reason = 'office_decision' and not public.is_office_of(pk.company_id) then
    raise exception 'only the office can make office decisions' using errcode = '42501'; end if;
  if p_reason is null or p_reason not in ('sent','office_decision','tech_correction') then
    raise exception 'unknown reason' using errcode = '22023'; end if;
  select coalesce(max(version), 0) + 1 into n from public.packet_versions where packet_id = p_packet_id;
  select array_agg(x order by x::text) into p_photo_ids from unnest(coalesce(p_photo_ids, '{}')) x;
  p_photo_ids := coalesce(p_photo_ids, '{}');
  h := private.photo_hashes(p_photo_ids);
  insert into public.packet_versions (company_id, packet_id, version, fingerprint, fields, photo_ids, photo_hashes, reason, created_by)
  values (pk.company_id, p_packet_id, n, private.packet_fingerprint(p_fields, p_photo_ids, h),
          p_fields, p_photo_ids, h, p_reason, me)
  returning id into vid;
  return vid;
end $$;
revoke all on function public.seal_packet_version(uuid, text, jsonb, uuid[]) from public, anon;
grant execute on function public.seal_packet_version(uuid, text, jsonb, uuid[]) to authenticated;

-- Record the checks for a version (office or the rules engine, after sealing).
create function public.add_packet_check(p_version_id uuid, p_field_key text, p_kind text, p_captured text,
  p_evidence text default null, p_evidence_photo_id uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.packet_versions; cid uuid;
begin
  select * into v from public.packet_versions where id = p_version_id;
  if v.id is null or not public.is_office_of(v.company_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  insert into public.packet_checks (company_id, packet_version_id, field_key, kind, captured_value, evidence_value, evidence_photo_id)
  values (v.company_id, v.id, p_field_key, p_kind, p_captured, p_evidence, p_evidence_photo_id) returning id into cid;
  return cid;
end $$;
revoke all on function public.add_packet_check(uuid, text, text, text, text, uuid) from public, anon;
grant execute on function public.add_packet_check(uuid, text, text, text, text, uuid) to authenticated;

-- Office decision on a conflict. 'use_evidence' and 'keep_with_note' seal a new version (the old one stays read-only)
-- and carry the checks forward with this one resolved; 'asked_tech' only records the question.
create function public.decide_packet_check(p_check_id uuid, p_decision text, p_note text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare c public.packet_checks; v public.packet_versions; me text := lower(coalesce(auth.jwt() ->> 'email','')); newv uuid; f jsonb;
begin
  if p_decision is null or p_decision not in ('use_evidence','keep_with_note','asked_tech') then
    raise exception 'choose use_evidence, keep_with_note or asked_tech' using errcode = '22023'; end if;
  -- Lock the packet before reading the base version, so two reviewers cannot both decide on the same stale version.
  perform 1 from public.office_packets p
    where p.id = (select pv.packet_id from public.packet_versions pv join public.packet_checks k on k.packet_version_id = pv.id where k.id = p_check_id)
    for update;
  select * into c from public.packet_checks where id = p_check_id for update;
  if c.id is null or not public.is_office_of(c.company_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  if c.kind <> 'conflict' or (c.decision is not null and c.decision <> 'asked_tech') then raise exception 'this check has no open conflict' using errcode = '22023'; end if;
  select * into v from public.packet_versions where id = c.packet_version_id;
  if v.id <> public.latest_packet_version(v.packet_id) then raise exception 'decide on the latest version' using errcode = '22023'; end if;
  if p_decision = 'keep_with_note' and coalesce(btrim(p_note), '') = '' then raise exception 'a note is required' using errcode = '22023'; end if;
  if p_decision = 'use_evidence' and coalesce(btrim(c.evidence_value), '') = '' then
    raise exception 'this conflict has no evidence value to use' using errcode = '22023'; end if;

  update public.packet_checks set decision = p_decision, decided_by = me, decided_at = now(), note = p_note where id = c.id;
  if p_decision = 'asked_tech' then return v.id; end if;

  f := case when p_decision = 'use_evidence' then v.fields || jsonb_build_object(c.field_key, c.evidence_value) else v.fields end;
  newv := public.seal_packet_version(v.packet_id, 'office_decision', f, v.photo_ids);
  insert into public.packet_checks (company_id, packet_version_id, field_key, kind, captured_value, evidence_value, evidence_photo_id,
                                    decision, decided_by, decided_at, note)
  select company_id, newv, field_key,
         case when id = c.id then 'matched' else kind end,
         case when id = c.id then f ->> field_key else captured_value end,
         evidence_value, evidence_photo_id,
         case when id = c.id then p_decision else decision end,
         case when id = c.id then me else decided_by end,
         case when id = c.id then now() else decided_at end,
         case when id = c.id then p_note else note end
  from public.packet_checks where packet_version_id = v.id;
  -- The checks were carried forward, so the new version is as fully checked as its base: complete only if the base was.
  if exists (select 1 from public.packet_validations pv where pv.packet_version_id = v.id) then
    insert into public.packet_validations (packet_version_id, company_id, completed_by) values (newv, v.company_id, me);
  end if;
  return newv;
end $$;
revoke all on function public.decide_packet_check(uuid, text, text) from public, anon;
grant execute on function public.decide_packet_check(uuid, text, text) to authenticated;

-- Open items on a version: conflicts without a final decision, plus anything missing.
create function public.open_packet_checks(p_version_id uuid) returns integer language sql stable set search_path = '' as $$
  select count(*)::int from public.packet_checks
  where packet_version_id = p_version_id
    and (kind = 'missing' or (kind = 'conflict' and (decision is null or decision = 'asked_tech')))
$$;
grant execute on function public.open_packet_checks(uuid) to authenticated;

-- The office confirms it finished checking the latest version (every conflict or missing item has been recorded).
create function public.complete_packet_checks(p_version_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.packet_versions; me text := lower(coalesce(auth.jwt() ->> 'email',''));
begin
  select * into v from public.packet_versions where id = p_version_id;
  if v.id is null or not public.is_office_of(v.company_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  perform 1 from public.office_packets where id = v.packet_id for update;
  if v.id <> public.latest_packet_version(v.packet_id) then raise exception 'check the latest version' using errcode = '22023'; end if;
  insert into public.packet_validations (packet_version_id, company_id, completed_by) values (v.id, v.company_id, me)
  on conflict (packet_version_id) do nothing;
end $$;
revoke all on function public.complete_packet_checks(uuid) from public, anon;
grant execute on function public.complete_packet_checks(uuid) to authenticated;

-- Signable: validation complete, nothing open, and the photos still hold what was sealed.
create function private.signable_problem(v public.packet_versions) returns text
language sql stable set search_path = '' as $$
  select case
    when not exists (select 1 from public.packet_validations pv where pv.packet_version_id = v.id) then 'the office has not finished checking this version'
    when public.open_packet_checks(v.id) > 0 then 'resolve every conflict and missing item first'
    when private.photo_hashes(v.photo_ids) is distinct from v.photo_hashes then 'a photo changed after this version was sealed; seal a new version'
    else null end
$$;

-- Guard: send for signature only the latest version with nothing open. Queues the signature-request email.
create function public.request_signature(p_version_id uuid, p_to_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.packet_versions; did uuid; why text;
begin
  select * into v from public.packet_versions where id = p_version_id;
  perform 1 from public.office_packets where id = v.packet_id for update;   -- no new version can land mid-check
  if v.id is null or not public.is_office_of(v.company_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  if v.id <> public.latest_packet_version(v.packet_id) then raise exception 'only the latest version can be sent for signature' using errcode = '22023'; end if;
  why := private.signable_problem(v);
  if why is not null then raise exception '%', why using errcode = '22023'; end if;
  insert into public.email_deliveries (company_id, kind, to_email, packet_id, packet_version_id)
  values (v.company_id, 'signature_request', lower(btrim(p_to_email)), v.packet_id, v.id) returning id into did;
  return did;
end $$;
revoke all on function public.request_signature(uuid, text) from public, anon;
grant execute on function public.request_signature(uuid, text) to authenticated;

-- Guard: sign only the latest version, with the matching fingerprint and nothing open. Company admins sign.
create function public.sign_packet_version(p_version_id uuid, p_fingerprint text, p_signer_name text,
  p_ip text default null, p_user_agent text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v public.packet_versions; me text := lower(coalesce(auth.jwt() ->> 'email','')); sid uuid; why text;
begin
  select * into v from public.packet_versions where id = p_version_id;
  perform 1 from public.office_packets where id = v.packet_id for update;   -- no new version can land mid-signing
  if v.id is null or not exists (select 1 from public.company_members m where m.company_id = v.company_id and m.email = me and m.role = 'admin') then
    raise exception 'only a company admin can sign' using errcode = '42501'; end if;
  if v.id <> public.latest_packet_version(v.packet_id) then raise exception 'this version is no longer the latest; review the new version' using errcode = '22023'; end if;
  if p_fingerprint is null or v.fingerprint is distinct from p_fingerprint then raise exception 'fingerprint does not match this version' using errcode = '22023'; end if;
  why := private.signable_problem(v);
  if why is not null then raise exception '%', why using errcode = '22023'; end if;
  insert into public.signatures (company_id, packet_version_id, fingerprint, signer_name, signer_email, ip, user_agent)
  values (v.company_id, v.id, v.fingerprint, btrim(p_signer_name), me, p_ip, left(p_user_agent, 500)) returning id into sid;
  return sid;
end $$;
revoke all on function public.sign_packet_version(uuid, text, text, text, text) from public, anon;
grant execute on function public.sign_packet_version(uuid, text, text, text, text) to authenticated;
