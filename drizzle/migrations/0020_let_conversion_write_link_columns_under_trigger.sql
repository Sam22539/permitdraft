
grant update (customer_id, converted_by, converted_at) on public.leads to authenticated;
create function public.leads_convert_guard() returns trigger language plpgsql as $$
begin
  if old.customer_id is not null and new.customer_id is distinct from old.customer_id then raise exception 'lead already converted'; end if;
  if new.customer_id is distinct from old.customer_id then
    new.converted_by := lower(coalesce(auth.jwt() ->> 'email','')); new.converted_at := now();
  else
    new.converted_by := old.converted_by; new.converted_at := old.converted_at;
  end if;
  return new;
end $$;
create trigger leads_convert_guard before update on public.leads for each row execute function public.leads_convert_guard();
