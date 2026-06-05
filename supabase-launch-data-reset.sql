-- Launch data reset for Engineering Trade Links.
-- Run this once in the Supabase SQL Editor before production use.
-- Login accounts and roles are preserved: auth.users and public.profiles are not changed.

begin;

-- Delete dependent records before their parent records.
delete from public.invoice_payments;
delete from public.invoices;

delete from public.site_consumption;
delete from public.site_stock;
delete from public.stock_movements;
delete from public.inventory_items;
delete from public.project_sites;

delete from public.quotations_generated;
delete from public.quotations;
delete from public.lpos;

-- Remove audit entries created by example records and by this reset.
delete from public.audit_log;

commit;

-- Every count below should be zero. Profiles should still contain login roles.
select 'invoice_payments' as table_name, count(*) as remaining_rows from public.invoice_payments
union all select 'invoices', count(*) from public.invoices
union all select 'site_consumption', count(*) from public.site_consumption
union all select 'site_stock', count(*) from public.site_stock
union all select 'stock_movements', count(*) from public.stock_movements
union all select 'inventory_items', count(*) from public.inventory_items
union all select 'project_sites', count(*) from public.project_sites
union all select 'quotations_generated', count(*) from public.quotations_generated
union all select 'quotations', count(*) from public.quotations
union all select 'lpos', count(*) from public.lpos
union all select 'audit_log', count(*) from public.audit_log
union all select 'profiles (preserved)', count(*) from public.profiles;
