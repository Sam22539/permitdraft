-- Company isolation smoke test: an office reviewer must see their own company's packets and never another company's.
-- Runs inside a transaction and rolls back, so it leaves the test database unchanged.
\set ON_ERROR_STOP 1
begin;
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'luis@acme-hvac.test'),
  ('00000000-0000-4000-8000-0000000000b1', 'tech@other-hvac.test');
insert into public.companies (id, name) values
  ('00000000-0000-4000-8000-00000000aaaa', 'Acme HVAC (sample)'),
  ('00000000-0000-4000-8000-00000000bbbb', 'Other HVAC (sample)');
insert into public.company_members (email, company_id, role) values
  ('maria@acme-hvac.test', '00000000-0000-4000-8000-00000000aaaa', 'office'),
  ('dana@other-hvac.test', '00000000-0000-4000-8000-00000000bbbb', 'office');
insert into public.office_packets (user_id, job_id, captured_fields, photo_links, sent_by_name, company_id) values
  ('00000000-0000-4000-8000-0000000000a1', 'PD-1187', '{"panel":"100"}', '[]', 'Luis M.', '00000000-0000-4000-8000-00000000aaaa'),
  ('00000000-0000-4000-8000-0000000000b1', 'OTHER-1', '{}', '[]', 'Other tech', '00000000-0000-4000-8000-00000000bbbb');

-- Act as Maria (office reviewer at Acme), the same way the API passes the signed-in user.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","email":"maria@acme-hvac.test","role":"authenticated"}', true);
do $$
declare mine int; theirs int; companies int;
begin
  select count(*) into mine from public.office_packets where job_id = 'PD-1187';
  select count(*) into theirs from public.office_packets where job_id = 'OTHER-1';
  select count(*) into companies from public.companies;
  if mine <> 1 then raise exception 'FAIL: Maria cannot see her own company packet (saw %)', mine; end if;
  if theirs <> 0 then raise exception 'FAIL: Maria can see another company''s packet'; end if;
  if companies <> 1 then raise exception 'FAIL: Maria sees % companies, expected 1', companies; end if;
  raise notice 'PASS: Maria sees her company''s packet (PD-1187) and nothing from the other company';
end $$;

-- Act as a stranger with no company.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","email":"stranger@example.test","role":"authenticated"}', true);
do $$
declare n int;
begin
  select count(*) into n from public.office_packets;
  if n <> 0 then raise exception 'FAIL: a stranger can see % packets', n; end if;
  raise notice 'PASS: a signed-in stranger sees no packets';
end $$;
rollback;
