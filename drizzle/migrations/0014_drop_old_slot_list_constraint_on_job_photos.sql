do $$ declare c text; begin
select conname into c from pg_constraint where conrelid='public.job_photos'::regclass and contype='c' and pg_get_constraintdef(oid) like '%slot%';
if c is not null then execute format('alter table public.job_photos drop constraint %I', c); end if;
end $$;
