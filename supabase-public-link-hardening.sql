-- ETL public-link hardening
-- Use this in two phases so public links do not break during deployment.
--
-- Why:
-- Direct anon SELECT on public tables lets anonymous users query/list rows.
-- These RPC functions keep public document links working, but only return the
-- row matching the unguessable unique_link token supplied by the link.

-- PHASE 1: safe to run before deployment.
-- This creates the RPC functions used by the new frontend code.

create or replace function public.get_public_quotation(p_unique_link text)
returns setof public.quotations_generated
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.quotations_generated
  where unique_link = p_unique_link
    and status = any (array['sent'::text, 'approved'::text])
  limit 1;
$$;

create or replace function public.get_public_lpo(p_unique_link text)
returns setof public.lpos
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.lpos
  where unique_link = p_unique_link
  limit 1;
$$;

create or replace function public.get_public_invoice(p_unique_link text)
returns setof public.invoices
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.invoices
  where unique_link = p_unique_link
  limit 1;
$$;

revoke all on function public.get_public_quotation(text) from public, anon, authenticated;
revoke all on function public.get_public_lpo(text) from public, anon, authenticated;
revoke all on function public.get_public_invoice(text) from public, anon, authenticated;

grant execute on function public.get_public_quotation(text) to anon, authenticated;
grant execute on function public.get_public_lpo(text) to anon, authenticated;
grant execute on function public.get_public_invoice(text) to anon, authenticated;

-- PHASE 2: run only after the matching frontend code is deployed.
-- This removes direct anonymous table reads that the old frontend used.

-- Remove direct anonymous table reads. Public document views should use the
-- RPC functions above instead of /rest/v1/<table>?unique_link=eq.<token>.
revoke select on public.quotations from anon;
revoke select on public.quotations_generated from anon;
revoke select on public.lpos from anon;
revoke select on public.invoices from anon;

drop policy if exists "Public read via unique_link" on public.lpos;
drop policy if exists "Public read via unique_link" on public.invoices;
drop policy if exists quotations_generated_public_select on public.quotations_generated;

-- Verification query: should return no anon table SELECT rows for these tables.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('quotations', 'quotations_generated', 'lpos', 'invoices')
  and grantee = 'anon'
  and privilege_type = 'SELECT'
order by table_name, privilege_type;
