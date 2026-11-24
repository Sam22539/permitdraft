delete from public.companies where name = 'ZZ Fictional Test HVAC' and id not in (select company_id from public.company_members);
