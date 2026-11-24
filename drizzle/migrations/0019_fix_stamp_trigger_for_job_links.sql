
create or replace function public.crm_stamp() returns trigger language plpgsql as $$
declare who text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if tg_table_name = 'customer_packets' then
    new.linked_by := who; new.linked_at := now();
    return new;
  end if;
  if tg_op = 'INSERT' then new.created_by := who; new.created_at := now();
  else new.created_by := old.created_by; new.created_at := old.created_at; new.company_id := old.company_id; end if;
  new.updated_by := who; new.updated_at := now();
  return new;
end $$;
