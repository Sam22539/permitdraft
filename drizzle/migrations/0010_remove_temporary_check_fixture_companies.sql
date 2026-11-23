delete from public.company_members where company_id in ('3a0c1e52-7f11-4c1e-9a55-0000000000a1','3a0c1e52-7f11-4c1e-9a55-0000000000b1');
delete from public.companies where id in ('3a0c1e52-7f11-4c1e-9a55-0000000000a1','3a0c1e52-7f11-4c1e-9a55-0000000000b1')
  and not exists (select 1 from public.office_packets p where p.company_id = companies.id);
