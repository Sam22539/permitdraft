alter table public.pilot_signups drop constraint pilot_signups_county_check;
alter table public.pilot_signups add column state text;
update public.pilot_signups set state = 'California' where state is null;
grant insert (state) on public.pilot_signups to anon, authenticated;
