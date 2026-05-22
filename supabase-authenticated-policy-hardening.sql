-- ETL authenticated-policy hardening plan
-- READ-ONLY / DO NOT RUN AS A LOCKDOWN MIGRATION YET.
--
-- Current workflow note:
-- Staff are involved in the editing workflows for generated quotations,
-- invoices, payments, project sites, and inventory item data. Because of that,
-- a simple "management-only" policy would be too blunt and would break normal
-- work.
--
-- Production direction:
-- Keep staff involved, but move sensitive edits away from broad direct browser
-- table UPDATEs and into controlled server/API/RPC actions that:
--   1. verify the logged-in user,
--   2. validate the requested change,
--   3. allow only safe field changes,
--   4. write an audit log row,
--   5. then update the target table.
--
-- Until those controlled actions exist, do not revoke staff UPDATE access for
-- these workflows unless the frontend is changed at the same time.

-- 1. Find broad authenticated UPDATE policies that still need controlled
-- server/RPC replacements.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as insert_update_check
from pg_policies
where schemaname = 'public'
  and cmd = 'UPDATE'
  and roles::text like '%authenticated%'
order by tablename, policyname;

-- 2. Find authenticated INSERT policies that may need validation through
-- server/RPC actions later.
select
  tablename,
  policyname,
  roles,
  cmd,
  with_check as insert_check
from pg_policies
where schemaname = 'public'
  and cmd = 'INSERT'
  and roles::text like '%authenticated%'
order by tablename, policyname;

-- 3. Suggested next controlled-action targets, in priority order:
--
-- High priority:
-- - invoice_payments: staff can record payments, but payment edits/corrections
--   should become append-only adjustment rows or audited RPC actions.
-- - invoices: staff can create/edit, but saved invoice edits should be
--   validated and audited.
-- - inventory_items: staff can maintain stock data, but item cost/unit/min
--   changes should be audited.
--
-- Medium priority:
-- - stock_movements: keep append-only where possible; corrections should be new
--   adjustment movements instead of editing history.
-- - site_stock: move quantity changes into RPC so stock cannot be overwritten
--   without a matching movement record.
-- - project_sites: staff can maintain sites, but status/location edits should
--   be audited.
--
-- Existing acceptable-for-now:
-- - quotations: staff update request status from dashboard.
-- - lpos: current policy already prevents non-management users from changing
--   approved LPOs.

-- 4. Future audit table sketch. Do not run until the app writes to it.
--
-- create table public.audit_log (
--   id uuid primary key default gen_random_uuid(),
--   actor_id uuid references auth.users(id),
--   action text not null,
--   table_name text not null,
--   row_id uuid,
--   before_data jsonb,
--   after_data jsonb,
--   created_at timestamptz not null default now()
-- );
--
-- alter table public.audit_log enable row level security;
--
-- create policy audit_log_management_read
-- on public.audit_log
-- for select
-- to authenticated
-- using (public.is_management());
