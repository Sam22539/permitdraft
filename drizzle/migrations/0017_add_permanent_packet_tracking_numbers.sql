create sequence if not exists public.office_packet_tracking_seq start 10001;
alter table public.office_packets add column if not exists tracking_no text;
with o as (select id, sent_at, row_number() over (order by sent_at, id) rn from public.office_packets where tracking_no is null order by sent_at, id)
update public.office_packets p set tracking_no = 'PD-' || to_char(o.sent_at at time zone 'utc','YYYY') || '-' || nextval('public.office_packet_tracking_seq') from o where o.id = p.id;
alter table public.office_packets alter column tracking_no set default ('PD-' || to_char(now() at time zone 'utc','YYYY') || '-' || nextval('public.office_packet_tracking_seq'));
alter table public.office_packets alter column tracking_no set not null;
alter table public.office_packets add constraint office_packets_tracking_no_key unique (tracking_no);
create or replace function public.keep_packet_tracking_no() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.tracking_no is distinct from old.tracking_no then raise exception 'tracking number is permanent' using errcode = '42501'; end if;
  return new;
end $$;
create trigger office_packets_keep_tracking_no before update of tracking_no on public.office_packets for each row execute function public.keep_packet_tracking_no();
