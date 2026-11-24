create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  packet_id uuid not null references public.office_packets(id) on delete restrict,
  number text not null default '',
  status text not null default 'draft' check (status in ('draft','paid')),
  tax_bps integer not null default 0 check (tax_bps between 0 and 3000),
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  tax_cents bigint not null default 0 check (tax_cents >= 0),
  total_cents bigint not null default 0 check (total_cents >= 0),
  paid_on date,
  paid_by text,
  created_by text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, number),
  check ((status = 'paid') = (paid_on is not null))
);
create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  position integer not null default 0,
  description text not null check (length(btrim(description)) between 1 and 200),
  quantity numeric(10,2) not null check (quantity > 0 and quantity <= 100000),
  unit_cents bigint not null check (unit_cents >= 0 and unit_cents <= 100000000),
  amount_cents bigint not null default 0 check (amount_cents >= 0)
);
create index on public.invoices (company_id, paid_on);
create index on public.invoices (packet_id);
create index on public.invoice_lines (invoice_id);
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
grant select, insert, update, delete on public.invoices, public.invoice_lines to service_role;
grant select on public.invoices, public.invoice_lines to authenticated;
grant insert (company_id, packet_id, tax_bps) on public.invoices to authenticated;
grant update (tax_bps, status, paid_on) on public.invoices to authenticated;
grant delete on public.invoices to authenticated;
grant insert (invoice_id, company_id, position, description, quantity, unit_cents) on public.invoice_lines to authenticated;
grant update (position, description, quantity, unit_cents) on public.invoice_lines to authenticated;
grant delete on public.invoice_lines to authenticated;

create policy "office reads invoices" on public.invoices for select to authenticated using (public.is_office_of(company_id));
create policy "office adds invoices" on public.invoices for insert to authenticated with check (public.is_office_of(company_id)
  and exists (select 1 from public.office_packets p where p.id = packet_id and p.company_id = invoices.company_id));
create policy "office changes draft invoices" on public.invoices for update to authenticated using (public.is_office_of(company_id) and status = 'draft') with check (public.is_office_of(company_id));
create policy "office deletes draft invoices" on public.invoices for delete to authenticated using (public.is_office_of(company_id) and status = 'draft');
create policy "office reads invoice lines" on public.invoice_lines for select to authenticated using (public.is_office_of(company_id));
create policy "office adds lines to draft invoices" on public.invoice_lines for insert to authenticated with check (public.is_office_of(company_id)
  and exists (select 1 from public.invoices i where i.id = invoice_id and i.company_id = invoice_lines.company_id and i.status = 'draft'));
create policy "office changes lines of draft invoices" on public.invoice_lines for update to authenticated using (public.is_office_of(company_id)
  and exists (select 1 from public.invoices i where i.id = invoice_id and i.status = 'draft')) with check (public.is_office_of(company_id));
create policy "office deletes lines of draft invoices" on public.invoice_lines for delete to authenticated using (public.is_office_of(company_id)
  and exists (select 1 from public.invoices i where i.id = invoice_id and i.status = 'draft'));

create function private.invoice_before() returns trigger language plpgsql security definer set search_path = '' as $$
declare me text := lower(coalesce(auth.jwt() ->> 'email','')); sub bigint;
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext(new.company_id::text));
    new.number := 'INV-' || lpad(((select count(*) from public.invoices where company_id = new.company_id) + 1)::text, 4, '0');
    new.status := 'draft'; new.paid_on := null; new.paid_by := null;
    new.subtotal_cents := 0; new.tax_cents := 0; new.total_cents := 0;
    new.created_by := me; new.updated_by := me; new.created_at := now(); new.updated_at := now();
    return new;
  end if;
  select coalesce(sum(amount_cents), 0) into sub from public.invoice_lines where invoice_id = new.id;
  new.subtotal_cents := sub;
  new.tax_cents := round(sub * new.tax_bps / 10000.0);
  new.total_cents := sub + new.tax_cents;
  new.updated_by := coalesce(nullif(me, ''), old.updated_by); new.updated_at := now();
  if new.status = 'paid' and old.status = 'draft' then
    if new.paid_on is null or new.paid_on > current_date or new.paid_on < date '2000-01-01' then raise exception 'choose a payment date that is not in the future' using errcode = 'P0001'; end if;
    if new.total_cents <= 0 then raise exception 'an invoice with no amount cannot be recorded as paid' using errcode = 'P0001'; end if;
    new.paid_by := me;
  elsif new.status = 'draft' then new.paid_on := null; new.paid_by := null;
  end if;
  if old.status = 'paid' and (new.status <> 'paid' or new.paid_on is distinct from old.paid_on) then raise exception 'a recorded payment cannot be changed' using errcode = 'P0001'; end if;
  return new;
end $$;
revoke execute on function private.invoice_before() from public, anon, authenticated;
create trigger invoice_before before insert or update on public.invoices for each row execute function private.invoice_before();

create function private.invoice_line_before() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.amount_cents := round(new.quantity * new.unit_cents);
  if tg_op = 'UPDATE' then new.invoice_id := old.invoice_id; new.company_id := old.company_id; end if;
  return new;
end $$;
revoke execute on function private.invoice_line_before() from public, anon, authenticated;
create trigger invoice_line_before before insert or update on public.invoice_lines for each row execute function private.invoice_line_before();

create function private.invoice_line_after() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.invoices set updated_at = now() where id = coalesce(new.invoice_id, old.invoice_id) and status = 'draft';
  return null;
end $$;
revoke execute on function private.invoice_line_after() from public, anon, authenticated;
create trigger invoice_line_after after insert or update or delete on public.invoice_lines for each row execute function private.invoice_line_after();
