-- ETL production RLS audit
-- Run this in Supabase SQL Editor before launch.
-- It is read-only: it does not create, update, or delete anything.

-- Expected production rule of thumb:
-- 1. Public forms may INSERT only into their public intake table.
-- 2. Public view links may SELECT only the one row matching an unguessable unique_link.
-- 3. Internal operational tables should require authenticated users.
-- 4. DELETE should be management-only or avoided.
-- 5. Inventory, payments, profiles, and movement history should not be readable by anon.

with target_tables(table_name) as (
  values
    ('quotations'),
    ('quotations_generated'),
    ('lpos'),
    ('invoices'),
    ('invoice_payments'),
    ('inventory_items'),
    ('stock_movements'),
    ('project_sites'),
    ('site_stock'),
    ('site_consumption'),
    ('profiles')
)
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join target_tables t on t.table_name = c.relname
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- Policies currently attached to ETL tables.
with target_tables(table_name) as (
  values
    ('quotations'),
    ('quotations_generated'),
    ('lpos'),
    ('invoices'),
    ('invoice_payments'),
    ('inventory_items'),
    ('stock_movements'),
    ('project_sites'),
    ('site_stock'),
    ('site_consumption'),
    ('profiles')
)
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as insert_update_check
from pg_policies
where schemaname = 'public'
  and tablename in (select table_name from target_tables)
order by tablename, cmd, policyname;

-- Direct table grants for browser roles.
with target_tables(table_name) as (
  values
    ('quotations'),
    ('quotations_generated'),
    ('lpos'),
    ('invoices'),
    ('invoice_payments'),
    ('inventory_items'),
    ('stock_movements'),
    ('project_sites'),
    ('site_stock'),
    ('site_consumption'),
    ('profiles')
)
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (select table_name from target_tables)
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Red flags: anon permissions. Review every row this returns.
-- Some anon INSERT may be intentional for public quotation/LPO intake.
-- Anon SELECT on document tables should normally be replaced with token RPC
-- functions instead of direct table reads.
with target_tables(table_name) as (
  values
    ('quotations'),
    ('quotations_generated'),
    ('lpos'),
    ('invoices'),
    ('invoice_payments'),
    ('inventory_items'),
    ('stock_movements'),
    ('project_sites'),
    ('site_stock'),
    ('site_consumption'),
    ('profiles')
)
select
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (select table_name from target_tables)
  and grantee = 'anon'
order by table_name, privilege_type;

-- Red flags: anon SELECT policies that are effectively broad table reads.
-- A browser query filter such as ?unique_link=eq.<token> is not part of RLS;
-- if the policy expression is true, anonymous users can list rows directly.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression
from pg_policies
where schemaname = 'public'
  and cmd = 'SELECT'
  and roles::text like '%anon%'
  and (qual is null or lower(qual) = 'true')
order by tablename, policyname;

-- Red flags: public tables with RLS disabled.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;

-- Review SECURITY DEFINER functions because they can bypass normal caller permissions.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
order by p.proname;

-- Review who can execute SECURITY DEFINER functions.
-- Red flag: PUBLIC or anon EXECUTE on SECURITY DEFINER functions.
select
  r.routine_schema,
  r.routine_name,
  r.grantee,
  r.privilege_type
from information_schema.routine_privileges r
join pg_proc p on p.proname = r.routine_name
join pg_namespace n on n.oid = p.pronamespace and n.nspname = r.routine_schema
where r.routine_schema = 'public'
  and p.prosecdef = true
order by r.routine_name, r.grantee;

-- Red flags only: SECURITY DEFINER functions executable by PUBLIC or anon.
select
  r.routine_schema,
  r.routine_name,
  r.grantee,
  r.privilege_type
from information_schema.routine_privileges r
join pg_proc p on p.proname = r.routine_name
join pg_namespace n on n.oid = p.pronamespace and n.nspname = r.routine_schema
where r.routine_schema = 'public'
  and p.prosecdef = true
  and r.grantee in ('PUBLIC', 'anon')
order by r.routine_name, r.grantee;
