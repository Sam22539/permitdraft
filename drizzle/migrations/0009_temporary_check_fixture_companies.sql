insert into public.companies (id, name, office_email, office_email_verified_at, office_email_set_by) values
 ('3a0c1e52-7f11-4c1e-9a55-0000000000a1', 'Site check fixture A', 'office-inbox@example.com', now(), 'site-check@example.com'),
 ('3a0c1e52-7f11-4c1e-9a55-0000000000b1', 'Site check fixture B', null, null, null)
on conflict (id) do nothing;
