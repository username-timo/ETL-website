-- ETL internal controls hardening (phase 1)
-- Safe-to-run goal:
-- 1) Add an audit trail for critical financial/stock tables.
-- 2) Add validation triggers that reduce bad writes without blocking staff roles.
--
-- Run this in Supabase SQL editor after taking a backup/snapshot.
-- This script is idempotent where practical.

begin;

create extension if not exists pgcrypto;

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid null references auth.users(id) on delete set null,
  actor_role text null,
  request_sub text null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  table_name text not null,
  row_id text null,
  before_data jsonb,
  after_data jsonb,
  changed_fields text[] not null default '{}'
);

create index if not exists audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
create index if not exists audit_log_table_name_idx on public.audit_log (table_name);
create index if not exists audit_log_actor_id_idx on public.audit_log (actor_id);

alter table public.audit_log enable row level security;

revoke all on table public.audit_log from anon;
revoke all on table public.audit_log from authenticated;
grant select on table public.audit_log to authenticated;

drop policy if exists audit_log_management_read on public.audit_log;
create policy audit_log_management_read
on public.audit_log
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'management'
  )
);

create or replace function public.etl_safe_jwt_claim(claim_key text)
returns text
language plpgsql
stable
as $$
declare
  claims_text text;
  claims_json jsonb;
begin
  claims_text := nullif(current_setting('request.jwt.claims', true), '');
  if claims_text is null then
    return null;
  end if;

  begin
    claims_json := claims_text::jsonb;
  exception
    when others then
      return null;
  end;

  return claims_json ->> claim_key;
end;
$$;

create or replace function public.etl_write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  v_changed text[] := '{}';
  v_row_id text;
begin
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(coalesce(n.key, o.key) order by coalesce(n.key, o.key)), '{}')
    into v_changed
    from jsonb_each(coalesce(v_new, '{}'::jsonb)) n
    full outer join jsonb_each(coalesce(v_old, '{}'::jsonb)) o
      on o.key = n.key
    where n.value is distinct from o.value;
  elsif tg_op = 'INSERT' then
    select coalesce(array_agg(k.key order by k.key), '{}')
    into v_changed
    from jsonb_object_keys(coalesce(v_new, '{}'::jsonb)) as k(key);
  else
    select coalesce(array_agg(k.key order by k.key), '{}')
    into v_changed
    from jsonb_object_keys(coalesce(v_old, '{}'::jsonb)) as k(key);
  end if;

  v_row_id := coalesce(v_new ->> 'id', v_old ->> 'id');

  insert into public.audit_log (
    actor_id,
    actor_role,
    request_sub,
    action,
    table_name,
    row_id,
    before_data,
    after_data,
    changed_fields
  ) values (
    auth.uid(),
    public.etl_safe_jwt_claim('role'),
    public.etl_safe_jwt_claim('sub'),
    tg_op,
    tg_table_name,
    v_row_id,
    v_old,
    v_new,
    v_changed
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.etl_validate_invoice_write()
returns trigger
language plpgsql
as $$
declare
  expected_total numeric;
  actual_total numeric;
begin
  if coalesce(trim(new.client_name), '') = '' then
    raise exception 'Client name is required.'
      using errcode = '22023';
  end if;

  if coalesce(trim(new.invoice_number), '') = '' then
    raise exception 'Invoice number is required.'
      using errcode = '22023';
  end if;

  if new.invoice_date is null or new.due_date is null then
    raise exception 'Invoice date and due date are required.'
      using errcode = '22023';
  end if;

  if new.due_date < new.invoice_date then
    raise exception 'Due date cannot be earlier than invoice date.'
      using errcode = '22023';
  end if;

  if coalesce(new.subtotal, 0) < 0 or coalesce(new.vat, 0) < 0 or coalesce(new.total, 0) <= 0 then
    raise exception 'Invoice amounts are invalid. Subtotal/VAT must be >= 0 and total must be > 0.'
      using errcode = '22023';
  end if;

  expected_total := round((coalesce(new.subtotal, 0)::numeric + coalesce(new.vat, 0)::numeric), 2);
  actual_total := round(coalesce(new.total, 0)::numeric, 2);

  if abs(expected_total - actual_total) > 0.01 then
    raise exception 'Invoice total does not match subtotal + VAT.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.etl_validate_invoice_payment_write()
returns trigger
language plpgsql
as $$
declare
  invoice_total numeric;
  paid_before numeric;
begin
  if new.invoice_id is null then
    raise exception 'Invoice payment must reference an invoice.'
      using errcode = '22023';
  end if;

  if new.payment_date is null then
    raise exception 'Payment date is required.'
      using errcode = '22023';
  end if;

  if coalesce(new.amount, 0) <= 0 then
    raise exception 'Payment amount must be greater than zero.'
      using errcode = '22023';
  end if;

  select i.total
  into invoice_total
  from public.invoices i
  where i.id = new.invoice_id
  limit 1;

  if invoice_total is null then
    raise exception 'Invoice % was not found for this payment.', new.invoice_id
      using errcode = '22023';
  end if;

  select coalesce(sum(p.amount), 0)
  into paid_before
  from public.invoice_payments p
  where p.invoice_id = new.invoice_id;

  if tg_op = 'UPDATE' and old.invoice_id = new.invoice_id then
    paid_before := paid_before - coalesce(old.amount, 0);
  end if;

  if paid_before + coalesce(new.amount, 0) > invoice_total + 0.009 then
    raise exception 'Payment exceeds remaining balance for invoice %.', new.invoice_id
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.etl_validate_inventory_item_write()
returns trigger
language plpgsql
as $$
begin
  if coalesce(trim(new.name), '') = '' then
    raise exception 'Inventory item name is required.'
      using errcode = '22023';
  end if;

  if coalesce(trim(new.unit), '') = '' then
    raise exception 'Inventory item unit is required.'
      using errcode = '22023';
  end if;

  if coalesce(new.current_stock, 0) < 0 then
    raise exception 'Current stock cannot be negative.'
      using errcode = '22023';
  end if;

  if coalesce(new.min_stock, 0) < 0 then
    raise exception 'Minimum stock cannot be negative.'
      using errcode = '22023';
  end if;

  if coalesce(new.unit_cost, 0) < 0 then
    raise exception 'Unit cost cannot be negative.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.etl_validate_stock_movement_write()
returns trigger
language plpgsql
as $$
begin
  if coalesce(trim(new.movement_type), '') = '' then
    raise exception 'Stock movement type is required.'
      using errcode = '22023';
  end if;

  if new.movement_type not in ('in', 'out', 'adjust', 'transfer') then
    raise exception 'Invalid stock movement type: %', new.movement_type
      using errcode = '22023';
  end if;

  if coalesce(new.quantity, 0) <= 0 then
    raise exception 'Stock movement quantity must be greater than zero.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create or replace function public.etl_validate_site_stock_write()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.quantity, 0) < 0 then
    raise exception 'Site stock quantity cannot be negative.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_invoices_validate on public.invoices;
create trigger trg_invoices_validate
before insert or update on public.invoices
for each row execute function public.etl_validate_invoice_write();

drop trigger if exists trg_invoice_payments_validate on public.invoice_payments;
create trigger trg_invoice_payments_validate
before insert or update on public.invoice_payments
for each row execute function public.etl_validate_invoice_payment_write();

drop trigger if exists trg_inventory_items_validate on public.inventory_items;
create trigger trg_inventory_items_validate
before insert or update on public.inventory_items
for each row execute function public.etl_validate_inventory_item_write();

drop trigger if exists trg_stock_movements_validate on public.stock_movements;
create trigger trg_stock_movements_validate
before insert or update on public.stock_movements
for each row execute function public.etl_validate_stock_movement_write();

drop trigger if exists trg_site_stock_validate on public.site_stock;
create trigger trg_site_stock_validate
before insert or update on public.site_stock
for each row execute function public.etl_validate_site_stock_write();

drop trigger if exists trg_invoices_audit on public.invoices;
create trigger trg_invoices_audit
after insert or update or delete on public.invoices
for each row execute function public.etl_write_audit();

drop trigger if exists trg_invoice_payments_audit on public.invoice_payments;
create trigger trg_invoice_payments_audit
after insert or update or delete on public.invoice_payments
for each row execute function public.etl_write_audit();

drop trigger if exists trg_inventory_items_audit on public.inventory_items;
create trigger trg_inventory_items_audit
after insert or update or delete on public.inventory_items
for each row execute function public.etl_write_audit();

drop trigger if exists trg_stock_movements_audit on public.stock_movements;
create trigger trg_stock_movements_audit
after insert or update or delete on public.stock_movements
for each row execute function public.etl_write_audit();

drop trigger if exists trg_site_stock_audit on public.site_stock;
create trigger trg_site_stock_audit
after insert or update or delete on public.site_stock
for each row execute function public.etl_write_audit();

commit;

-- Verification queries (run after script):
-- 1) Ensure triggers exist.
-- select event_object_table as table_name, trigger_name
-- from information_schema.triggers
-- where event_object_schema = 'public'
--   and event_object_table in ('invoices', 'invoice_payments', 'inventory_items', 'stock_movements', 'site_stock')
-- order by table_name, trigger_name;
--
-- 2) Check audit log reads as management user.
-- select occurred_at, action, table_name, row_id, actor_id
-- from public.audit_log
-- order by occurred_at desc
-- limit 50;
