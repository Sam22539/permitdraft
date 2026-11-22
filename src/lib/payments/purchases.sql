create schema if not exists foundable_internal;
create table if not exists foundable_internal.preview_sessions (
  session_id uuid primary key references auth.sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz
);
alter table foundable_internal.preview_sessions enable row level security;
drop policy if exists preview_sessions_own on foundable_internal.preview_sessions;
create policy preview_sessions_own on foundable_internal.preview_sessions for select to authenticated
  using (user_id = (select auth.uid()) and session_id::text = (select auth.jwt()->>'session_id'));
revoke all on foundable_internal.preview_sessions from public, anon, authenticated, service_role;
grant usage on schema foundable_internal to authenticated, service_role;
grant select on foundable_internal.preview_sessions to authenticated, service_role;
create or replace function public.foundable_is_preview_session() returns boolean
  language sql stable security invoker set search_path = '' as
  $$ select exists (select 1 from foundable_internal.preview_sessions
    where user_id = auth.uid() and session_id::text = auth.jwt()->>'session_id'
      and (expires_at is null or expires_at > now())) $$;
revoke all on function public.foundable_is_preview_session() from public, anon;
grant execute on function public.foundable_is_preview_session() to authenticated, service_role;

create table if not exists public.foundable_purchases (
  checkout_id uuid primary key,                                        -- Payments' checkout id
  user_id uuid not null references auth.users (id) on delete cascade,
  product_handle text not null,
  -- Open on purpose: a new pricing kind needs no app-database migration; Payments, the only writer, decides what it writes.
  kind text not null check (kind ~ '^[a-z][a-z_]{0,31}$'),
  active boolean not null,                                             -- false for a held dispute or a revoked sale
  paid_at timestamptz,
  paid_through timestamptz,                                            -- the paid period's end; null for one-time
  version bigint not null,                                             -- the projection's version
  updated_at timestamptz not null default now()
);
create index if not exists foundable_purchases_user on public.foundable_purchases (user_id, product_handle);
alter table public.foundable_purchases enable row level security;
drop policy if exists foundable_purchases_own on public.foundable_purchases;
create policy foundable_purchases_own on public.foundable_purchases for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.foundable_purchases from anon, authenticated;
grant select on public.foundable_purchases to authenticated;
grant select, insert, update, delete on public.foundable_purchases to service_role;
-- Test grants stay out of the live table, including application triggers attached to that table.
create table if not exists public.foundable_test_purchases (
  checkout_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_handle text not null,
  kind text not null check (kind ~ '^[a-z][a-z_]{0,31}$'),
  active boolean not null,
  paid_at timestamptz,
  paid_through timestamptz,
  version bigint not null,
  updated_at timestamptz not null default now()
);
create index if not exists foundable_test_purchases_user on public.foundable_test_purchases (user_id, product_handle);
alter table public.foundable_test_purchases enable row level security;
drop policy if exists foundable_test_purchases_own on public.foundable_test_purchases;
create policy foundable_test_purchases_own on public.foundable_test_purchases for select to authenticated
  using (user_id = (select auth.uid()) and (select public.foundable_is_preview_session()));
revoke all on public.foundable_test_purchases from anon, authenticated;
grant select on public.foundable_test_purchases to authenticated;
grant select, insert, update, delete on public.foundable_test_purchases to service_role;
create or replace view public.foundable_access with (security_invoker = true) as
  with context as (select public.foundable_is_preview_session() as preview), purchases as (
    select p.user_id, p.product_handle, p.kind, p.active, p.paid_through from public.foundable_purchases p, context where not context.preview
    union all
    select p.user_id, p.product_handle, p.kind, p.active, p.paid_through from public.foundable_test_purchases p, context where context.preview
  )
  select user_id, product_handle, kind, max(paid_through) as paid_through from purchases
  where active and (paid_through is null or paid_through > now()) group by user_id, product_handle, kind;
revoke all on public.foundable_access from anon;
grant select on public.foundable_access to authenticated, service_role;
-- Security invoker on purpose: a definer in public is refused by Foundable's check, and as the visitor it reads their own rows alone.
create or replace function public.foundable_has_access(handle text) returns boolean
  language sql stable security invoker set search_path = '' as
  $$ select exists (select 1 from public.foundable_access where user_id = auth.uid() and product_handle = handle) $$;
-- Signed out, a call is refused (42501), never answered false: a rule that calls it names authenticated alone.
revoke all on function public.foundable_has_access(text) from public, anon;
grant execute on function public.foundable_has_access(text) to authenticated, service_role;
