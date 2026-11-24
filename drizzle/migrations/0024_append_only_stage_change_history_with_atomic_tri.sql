create table public.packet_stage_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  packet_id uuid not null references public.office_packets(id),
  from_stage text not null,
  to_stage text not null,
  actor text not null,
  at timestamptz not null default now(),
  check (from_stage <> to_stage)
);
create index packet_stage_events_company_at on public.packet_stage_events (company_id, at);
create index packet_stage_events_packet on public.packet_stage_events (packet_id, at);
alter table public.packet_stage_events enable row level security;
create policy "office reads own company stage events" on public.packet_stage_events for select to authenticated using (public.is_office_of(company_id));
create policy "stage events written only by the stage trigger" on public.packet_stage_events for insert to authenticated with check (
  pg_trigger_depth() > 0 and public.is_office_of(company_id) and actor = lower(coalesce(auth.jwt() ->> 'email', ''))
  and exists (select 1 from public.packet_crm c where c.packet_id = packet_stage_events.packet_id and c.company_id = packet_stage_events.company_id and c.stage = packet_stage_events.to_stage));
revoke all on public.packet_stage_events from anon, authenticated;
grant select on public.packet_stage_events to authenticated;
grant insert (company_id, packet_id, from_stage, to_stage, actor) on public.packet_stage_events to authenticated;
grant select, insert, update, delete on public.packet_stage_events to service_role;

create function public.packet_stage_events_readonly() returns trigger language plpgsql set search_path = public as $$
begin raise exception 'stage history is append-only' using errcode = '42501'; end $$;
create trigger packet_stage_events_no_change before update or delete on public.packet_stage_events for each row execute function public.packet_stage_events_readonly();

create function public.packet_crm_log_stage() returns trigger language plpgsql set search_path = public as $$
declare prev text;
begin
  if tg_op = 'INSERT' then prev := 'new'; else prev := old.stage; end if;
  if new.stage is distinct from prev then
    insert into public.packet_stage_events (company_id, packet_id, from_stage, to_stage, actor)
    values (new.company_id, new.packet_id, prev, new.stage, lower(coalesce(auth.jwt() ->> 'email', '')));
  end if;
  return null;
end $$;
create trigger packet_crm_log_stage_ins after insert on public.packet_crm for each row execute function public.packet_crm_log_stage();
create trigger packet_crm_log_stage_upd after update of stage on public.packet_crm for each row execute function public.packet_crm_log_stage();
