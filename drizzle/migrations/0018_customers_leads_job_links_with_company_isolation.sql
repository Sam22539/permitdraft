
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  company_name text check (company_name is null or char_length(company_name) <= 120),
  contact_name text check (contact_name is null or char_length(contact_name) <= 120),
  email text check (email is null or char_length(email) <= 200),
  phone text check (phone is null or char_length(phone) <= 40),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_by text, created_at timestamptz not null default now(),
  updated_by text, updated_at timestamptz not null default now(),
  unique (id, company_id)
);
create table public.customer_packets (
  packet_id uuid primary key references public.office_packets(id) on delete restrict,
  customer_id uuid not null,
  company_id uuid not null,
  linked_by text, linked_at timestamptz not null default now(),
  foreign key (customer_id, company_id) references public.customers(id, company_id) on delete restrict
);
create index on public.customer_packets (customer_id);
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  company_name text check (company_name is null or char_length(company_name) <= 120),
  contact text check (contact is null or char_length(contact) <= 200),
  stage text not null default 'new' check (stage in ('new','contacted','quoted','won','lost')),
  next_action text check (next_action is null or char_length(next_action) <= 300),
  next_action_date date,
  customer_id uuid,
  converted_by text, converted_at timestamptz,
  created_by text, created_at timestamptz not null default now(),
  updated_by text, updated_at timestamptz not null default now(),
  foreign key (customer_id, company_id) references public.customers(id, company_id) on delete restrict
);

create function public.crm_stamp() returns trigger language plpgsql as $$
declare who text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if tg_op = 'INSERT' then new.created_by := who; new.created_at := now(); end if;
  if tg_table_name = 'customer_packets' then
    new.linked_by := who; new.linked_at := now();
  else
    if tg_op = 'UPDATE' then new.created_by := old.created_by; new.created_at := old.created_at; new.company_id := old.company_id; end if;
    new.updated_by := who; new.updated_at := now();
  end if;
  return new;
end $$;
create trigger customers_stamp before insert or update on public.customers for each row execute function public.crm_stamp();
create trigger leads_stamp before insert or update on public.leads for each row execute function public.crm_stamp();
create trigger cp_stamp before insert on public.customer_packets for each row execute function public.crm_stamp();

alter table public.customers enable row level security;
alter table public.customer_packets enable row level security;
alter table public.leads enable row level security;

create function public.is_office_of(c uuid) returns boolean language sql stable as $$
  select exists (select 1 from public.company_members m where m.company_id = c and m.role in ('admin','office') and m.email = lower(coalesce(auth.jwt() ->> 'email','')))
$$;
revoke all on function public.is_office_of(uuid) from public, anon;
grant execute on function public.is_office_of(uuid) to authenticated;

create policy "office reads customers" on public.customers for select to authenticated using (public.is_office_of(company_id));
create policy "office adds customers" on public.customers for insert to authenticated with check (public.is_office_of(company_id));
create policy "office edits customers" on public.customers for update to authenticated using (public.is_office_of(company_id)) with check (public.is_office_of(company_id));
create policy "office reads leads" on public.leads for select to authenticated using (public.is_office_of(company_id));
create policy "office adds leads" on public.leads for insert to authenticated with check (public.is_office_of(company_id));
create policy "office edits leads" on public.leads for update to authenticated using (public.is_office_of(company_id)) with check (public.is_office_of(company_id));
create policy "office reads links" on public.customer_packets for select to authenticated using (public.is_office_of(company_id));
create policy "office links packets" on public.customer_packets for insert to authenticated with check (
  public.is_office_of(company_id) and exists (select 1 from public.office_packets p where p.id = packet_id and p.company_id = customer_packets.company_id));
create policy "office unlinks packets" on public.customer_packets for delete to authenticated using (public.is_office_of(company_id));

revoke all on public.customers, public.leads, public.customer_packets from anon, authenticated;
grant select, insert, update, delete on public.customers, public.leads, public.customer_packets to service_role;
grant select on public.customers, public.leads, public.customer_packets to authenticated;
grant insert (company_id, name, company_name, contact_name, email, phone, notes) on public.customers to authenticated;
grant update (name, company_name, contact_name, email, phone, notes) on public.customers to authenticated;
grant insert (company_id, name, company_name, contact, stage, next_action, next_action_date) on public.leads to authenticated;
grant update (name, company_name, contact, stage, next_action, next_action_date) on public.leads to authenticated;
grant insert (packet_id, customer_id, company_id) on public.customer_packets to authenticated;
grant delete on public.customer_packets to authenticated;

create function public.convert_lead(p_lead uuid, p_customer uuid default null) returns uuid language plpgsql as $$
declare l public.leads; cid uuid;
begin
  select * into l from public.leads where id = p_lead for update;
  if not found then raise exception 'lead not found'; end if;
  if l.customer_id is not null then raise exception 'already converted'; end if;
  if p_customer is not null then
    select id into cid from public.customers where id = p_customer and company_id = l.company_id;
    if cid is null then raise exception 'customer not found'; end if;
  else
    insert into public.customers (company_id, name, company_name, email)
      values (l.company_id, l.name, l.company_name, l.contact) returning id into cid;
  end if;
  update public.leads set customer_id = cid, stage = 'won', converted_by = lower(coalesce(auth.jwt() ->> 'email','')), converted_at = now() where id = p_lead;
  return cid;
end $$;
revoke all on function public.convert_lead(uuid, uuid) from public, anon;
grant execute on function public.convert_lead(uuid, uuid) to authenticated;
