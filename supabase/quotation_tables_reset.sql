create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop table if exists public.quotations_generated;
drop table if exists public.quotation_requests;
drop table if exists public.quotations;

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  client_name text not null,
  contact_person text not null,
  client_email text not null,
  client_phone text not null,
  client_address text,
  project_title text not null,
  project_location text,
  services_category text,
  project_duration text,
  project_description text not null,
  estimated_budget text,
  status text not null default 'pending_approval',
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  quotation_link text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_status_check check (
    status in ('pending_approval', 'pending', 'approved', 'rejected', 'responded')
  )
);

create table public.quotations_generated (
  id uuid primary key default gen_random_uuid(),
  ref_id uuid references public.quotations(id) on delete set null,
  reference text not null unique,
  unique_link text not null unique,
  client_name text not null,
  contact_person text,
  client_email text,
  client_phone text,
  client_address text,
  project_title text not null,
  project_location text,
  services_category text,
  project_duration text,
  project_description text,
  quote_date date,
  valid_until date,
  payment_terms text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(18,2) not null default 0,
  vat numeric(18,2) not null default 0,
  total numeric(18,2) not null default 0,
  notes text,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotations_generated_status_check check (
    status in ('draft', 'sent', 'approved', 'expired', 'cancelled')
  )
);

create index quotations_status_idx on public.quotations(status);
create index quotations_created_at_idx on public.quotations(created_at desc);
create index quotations_client_email_idx on public.quotations(client_email);

create index quotations_generated_ref_id_idx on public.quotations_generated(ref_id);
create index quotations_generated_created_at_idx on public.quotations_generated(created_at desc);
create index quotations_generated_valid_until_idx on public.quotations_generated(valid_until);
create index quotations_generated_client_email_idx on public.quotations_generated(client_email);

drop trigger if exists quotations_set_updated_at on public.quotations;
create trigger quotations_set_updated_at
before update on public.quotations
for each row
execute function public.set_updated_at();

drop trigger if exists quotations_generated_set_updated_at on public.quotations_generated;
create trigger quotations_generated_set_updated_at
before update on public.quotations_generated
for each row
execute function public.set_updated_at();
