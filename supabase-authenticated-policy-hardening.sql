-- ETL authenticated-policy hardening
-- Review, then run in Supabase SQL Editor after confirming the staff workflow.
--
-- Goal:
-- Keep authenticated staff able to do normal operational work, but stop broad
-- browser-side UPDATE policies from allowing any logged-in user to change any
-- sensitive field on finance/inventory records.
--
-- Important:
-- This SQL intentionally does not remove SELECT or INSERT access. It focuses on
-- UPDATE policies that were previously `using true with check true`.

-- Generated quotations:
-- Staff can create generated quotes. Only management should edit generated
-- quotation records after creation.
drop policy if exists quotations_generated_authenticated_update on public.quotations_generated;
create policy quotations_generated_management_update
on public.quotations_generated
for update
to authenticated
using (public.is_management())
with check (public.is_management());

-- Invoices:
-- Staff can create invoices. Editing saved invoices should be management-only
-- until invoice edits are moved through a controlled server route.
drop policy if exists auth_update_invoices on public.invoices;
create policy invoices_management_update
on public.invoices
for update
to authenticated
using (public.is_management())
with check (public.is_management());

-- Invoice payments:
-- Staff can record payments. Editing existing payment rows should be
-- management-only because payment history is financial evidence.
drop policy if exists "authenticated update invoice_payments" on public.invoice_payments;
create policy invoice_payments_management_update
on public.invoice_payments
for update
to authenticated
using (public.is_management())
with check (public.is_management());

-- Project site metadata:
-- Project site creation/update should be management-only until a warehouse or
-- project-manager role exists.
drop policy if exists "Authenticated users can insert project sites" on public.project_sites;
drop policy if exists "Authenticated users can update project sites" on public.project_sites;
create policy project_sites_management_insert
on public.project_sites
for insert
to authenticated
with check (public.is_management());
create policy project_sites_management_update
on public.project_sites
for update
to authenticated
using (public.is_management())
with check (public.is_management());

-- Inventory item master data:
-- Staff can read inventory. Changes to item names, units, min levels, and costs
-- are sensitive and should be management-only until a warehouse_manager role is
-- created and added to public.is_inventory_manager().
drop policy if exists auth_insert_inventory on public.inventory_items;
drop policy if exists auth_update_inventory on public.inventory_items;
create policy inventory_items_management_insert
on public.inventory_items
for insert
to authenticated
with check (public.is_management());
create policy inventory_items_management_update
on public.inventory_items
for update
to authenticated
using (public.is_management())
with check (public.is_management());

-- Site stock:
-- Keep staff insert/update for now because the current site stock workflow
-- updates quantities directly from the browser. This should move to server-side
-- RPC/API later so stock cannot be arbitrarily overwritten.

-- Site consumption:
-- Keep authenticated insert/update for now because site users log usage/returns
-- directly. Later, change updates to management-only and make corrections via
-- adjustment rows instead of editing history.

-- Stock movements:
-- Keep authenticated insert/update for now because current stock in/out creates
-- movement rows directly. Later, make updates management-only and use correction
-- movements for auditability.

-- Quotations intake:
-- Keep authenticated update for now because staff update status from the
-- dashboard. Management approval still depends on app UI and should later move
-- to a server/RPC action that enforces role and allowed status transitions.

-- LPOs:
-- Current policy already blocks non-management users from changing approved LPOs.
-- Keep it for now so normal workflow stays working.

-- Verification query for the policies this file changes.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as insert_update_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'quotations_generated',
    'invoices',
    'invoice_payments',
    'project_sites',
    'inventory_items'
  )
order by tablename, cmd, policyname;
