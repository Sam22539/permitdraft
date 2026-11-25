-- Tests for migration 0030: sealed versions, conflict decisions, signature guards, company isolation.
-- Runs in a transaction and rolls back. Expected: every line prints PASS.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000a1', 'luis@acme-hvac.test'),
                                         ('00000000-0000-4000-8000-0000000000b1', 'tech@other-hvac.test');
insert into public.companies (id, name) values ('00000000-0000-4000-8000-00000000aaaa', 'Acme HVAC (sample)'),
                                              ('00000000-0000-4000-8000-00000000bbbb', 'Other HVAC (sample)');
insert into public.company_members (email, company_id, role) values
  ('luis@acme-hvac.test', '00000000-0000-4000-8000-00000000aaaa', 'technician'),
  ('maria@acme-hvac.test', '00000000-0000-4000-8000-00000000aaaa', 'office'),
  ('dana@acme-hvac.test', '00000000-0000-4000-8000-00000000aaaa', 'admin'),
  ('dana@other-hvac.test', '00000000-0000-4000-8000-00000000bbbb', 'admin');
insert into public.office_packets (id, user_id, job_id, captured_fields, photo_links, sent_by_name, company_id) values
  ('00000000-0000-4000-8000-000000001187', '00000000-0000-4000-8000-0000000000a1', 'PD-1187', '{"panel":"100 A"}', '[]', 'Luis M.', '00000000-0000-4000-8000-00000000aaaa');

create temp table t (k text primary key, v text);
grant all on t to authenticated;
create function pg_temp.as_user(email text, sub text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', sub, 'email', email, 'role', 'authenticated')::text, true) $$;
create function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'PASS: % (refused: %)', label, sqlerrm; return; end;
  raise exception 'FAIL: % was allowed', label;
end $$;
set local role authenticated;

-- 1. Luis (tech) sends: v1 is sealed with a fingerprint.
select pg_temp.as_user('luis@acme-hvac.test', '00000000-0000-4000-8000-0000000000a1');
insert into t values ('v1', public.seal_packet_version('00000000-0000-4000-8000-000000001187', 'sent',
  '{"equipment":"Carrier 25VNA036","panel":"100 A","refrigerant":"R-454B"}'));
do $$ declare fp text; begin
  select fingerprint into fp from public.packet_versions where id = (select v::uuid from t where k='v1');
  if fp !~ '^[0-9a-f]{64}$' then raise exception 'FAIL: bad fingerprint'; end if;
  raise notice 'PASS: tech send sealed v1 (fingerprint %…)', left(fp, 8);
end $$;

-- 2. Maria (office) records a conflict; sending for signature is refused while it is open.
select pg_temp.as_user('maria@acme-hvac.test', '00000000-0000-4000-8000-0000000000c1');
insert into t values ('chk', public.add_packet_check((select v::uuid from t where k='v1'), 'panel', 'conflict', '100 A', '125 A'));
select pg_temp.expect_error($q$select public.request_signature((select v::uuid from t where k='v1'), 'dana@acme-hvac.test')$q$,
  'send for signature with an open conflict');

-- 3. Sealed versions cannot be edited, even directly.
select pg_temp.expect_error($q$update public.packet_versions set fields = '{}' where id = (select v::uuid from t where k='v1')$q$,
  'editing a sealed version');

-- 3a. Decisions must be real: no null decision, and "use evidence" needs an evidence value.
select pg_temp.expect_error($q$select public.decide_packet_check((select v::uuid from t where k='chk'), null)$q$, 'a null decision');
select pg_temp.expect_error($q$select public.decide_packet_check(public.add_packet_check((select v::uuid from t where k='v1'), 'duct', 'conflict', 'sealed', null), 'use_evidence')$q$,
  'using evidence that has no value');

-- 3b. Maria asks Luis to confirm first: the conflict stays open (no signature yet), and she can still decide after.
select public.decide_packet_check((select v::uuid from t where k='chk'), 'asked_tech');
select pg_temp.expect_error($q$select public.request_signature((select v::uuid from t where k='v1'), 'dana@acme-hvac.test')$q$,
  'send for signature while waiting on the tech');

-- 4. Maria uses the photo value: v2 is sealed with 125 A, and v1 stays as it was.
insert into t values ('v2', public.decide_packet_check((select v::uuid from t where k='chk'), 'use_evidence'));
do $$ declare p1 text; p2 text; n int; begin
  select fields->>'panel' into p1 from public.packet_versions where id = (select v::uuid from t where k='v1');
  select fields->>'panel', version into p2, n from public.packet_versions where id = (select v::uuid from t where k='v2');
  if p1 <> '100 A' or p2 <> '125 A' or n <> 2 then raise exception 'FAIL: decision versions wrong (v1=%, v2=%, n=%)', p1, p2, n; end if;
  if public.open_packet_checks((select v::uuid from t where k='v2')) <> 0 then raise exception 'FAIL: v2 still has open items'; end if;
  raise notice 'PASS: office decision sealed v2 (panel 100 A → 125 A); v1 unchanged';
end $$;

-- 5. Send for signature: refused for v1 (not latest), allowed for v2 and queued as an email delivery.
select pg_temp.expect_error($q$select public.request_signature((select v::uuid from t where k='v1'), 'dana@acme-hvac.test')$q$,
  'send an outdated version for signature');
select public.request_signature((select v::uuid from t where k='v2'), 'Dana@Acme-HVAC.test');
do $$ begin
  if not exists (select 1 from public.email_deliveries where kind = 'signature_request' and status = 'queued' and to_email = 'dana@acme-hvac.test')
  then raise exception 'FAIL: no queued signature email'; end if;
  raise notice 'PASS: v2 sent for signature; email queued (not yet "delivered")';
end $$;

-- 6. Signing: office staff cannot sign; the admin cannot sign v1 or a wrong fingerprint; the admin signs v2.
select pg_temp.expect_error($q$select public.sign_packet_version((select v::uuid from t where k='v2'),
  (select fingerprint from public.packet_versions where id = (select v::uuid from t where k='v2')), 'Maria R.')$q$, 'office staff signing');
select pg_temp.as_user('dana@acme-hvac.test', '00000000-0000-4000-8000-0000000000d1');
select pg_temp.expect_error($q$select public.sign_packet_version((select v::uuid from t where k='v1'),
  (select fingerprint from public.packet_versions where id = (select v::uuid from t where k='v1')), 'Dana K.')$q$, 'signing an old version');
select pg_temp.expect_error($q$select public.sign_packet_version((select v::uuid from t where k='v2'), repeat('0', 64), 'Dana K.')$q$,
  'signing with the wrong fingerprint');
select pg_temp.expect_error($q$select public.sign_packet_version((select v::uuid from t where k='v2'), null, 'Dana K.')$q$,
  'signing with no fingerprint');
select public.sign_packet_version((select v::uuid from t where k='v2'),
  (select fingerprint from public.packet_versions where id = (select v::uuid from t where k='v2')), 'Dana K.');
do $$ begin raise notice 'PASS: admin signed v2 with its fingerprint'; end $$;
select pg_temp.expect_error($q$select public.sign_packet_version((select v::uuid from t where k='v2'),
  (select fingerprint from public.packet_versions where id = (select v::uuid from t where k='v2')), 'Dana K.')$q$, 'signing the same version twice');

-- 6b. An unchanged re-send creates a version with no checks: not signable until the office finishes checking it.
select pg_temp.as_user('luis@acme-hvac.test', '00000000-0000-4000-8000-0000000000a1');
insert into public.job_photos (id, job_id, slot, name, mime, data_url, taken_at)
  values ('00000000-0000-4000-8000-00000000f001', 'PD-1187', 'plate', 'plate.jpg', 'image/jpeg', 'data:image/jpeg;base64,AAAA', 1);
insert into t values ('v3', public.seal_packet_version('00000000-0000-4000-8000-000000001187', 'tech_correction',
  (select fields from public.packet_versions where id = (select v::uuid from t where k='v2')), array['00000000-0000-4000-8000-00000000f001']::uuid[]));
select pg_temp.as_user('maria@acme-hvac.test', '00000000-0000-4000-8000-0000000000c1');
select pg_temp.expect_error($q$select public.request_signature((select v::uuid from t where k='v3'), 'dana@acme-hvac.test')$q$,
  'a re-sent version the office has not checked');
select public.complete_packet_checks((select v::uuid from t where k='v3'));
-- 6c. Luis replaces the photo under the same id: the sealed v3 no longer matches its evidence, so it cannot go out.
select pg_temp.as_user('luis@acme-hvac.test', '00000000-0000-4000-8000-0000000000a1');
update public.job_photos set data_url = 'data:image/jpeg;base64,BBBB' where id = '00000000-0000-4000-8000-00000000f001';
select pg_temp.as_user('maria@acme-hvac.test', '00000000-0000-4000-8000-0000000000c1');
select pg_temp.expect_error($q$select public.request_signature((select v::uuid from t where k='v3'), 'dana@acme-hvac.test')$q$,
  'a version whose photo changed after sealing');

-- 7. Isolation: another company's admin sees none of it and cannot act on it.
select pg_temp.as_user('dana@other-hvac.test', '00000000-0000-4000-8000-0000000000e1');
do $$ declare a int; b int; c int; d int; begin
  select count(*) into a from public.packet_versions; select count(*) into b from public.packet_checks;
  select count(*) into c from public.signatures; select count(*) into d from public.email_deliveries;
  if a + b + c + d <> 0 then raise exception 'FAIL: other company sees % rows', a + b + c + d; end if;
  raise notice 'PASS: another company sees no versions, checks, signatures or emails';
end $$;
select pg_temp.expect_error($q$select public.seal_packet_version('00000000-0000-4000-8000-000000001187', 'sent', '{}')$q$,
  'another company sealing a version of our packet');
rollback;
