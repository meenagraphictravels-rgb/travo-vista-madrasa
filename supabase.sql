-- Travo Vista Madrasa - fresh Supabase foundation
-- Run this in the NEW Supabase project's SQL Editor.
-- Do not put a service/secret key in the browser.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists organizations_owner_uidx on public.organizations(owner_id);

create table if not exists public.app_data (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  plan_code text not null default 'trial',
  status text not null default 'trial',
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.public_admission_forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  title text not null default 'Online Admission Form',
  enabled boolean not null default true,
  fee_required boolean not null default true,
  application_fee numeric(12,2) not null default 0,
  form_schema jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id,slug)
);

create table if not exists public.admission_applications (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.public_admission_forms(id) on delete cascade,
  application_no text not null unique,
  status text not null default 'payment_pending',
  applicant_data jsonb not null default '{}'::jsonb,
  payment_status text not null default 'pending',
  payment_order_id text,
  paid_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  application_id uuid references public.admission_applications(id) on delete set null,
  purpose text not null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  status text not null default 'created',
  provider text,
  provider_order_id text,
  provider_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.organizations(id) on delete cascade,
  provider text,
  phone_number_id text,
  business_account_id text,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organizations enable row level security;
alter table public.app_data enable row level security;
alter table public.subscriptions enable row level security;
alter table public.public_admission_forms enable row level security;
alter table public.admission_applications enable row level security;
alter table public.payment_orders enable row level security;
alter table public.whatsapp_settings enable row level security;

-- Owner policies for the private management app.
drop policy if exists "org owner can read own org" on public.organizations;
create policy "org owner can read own org" on public.organizations for select to authenticated using (owner_id = auth.uid());
drop policy if exists "user can create own org" on public.organizations;
create policy "user can create own org" on public.organizations for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "org owner can update own org" on public.organizations;
create policy "org owner can update own org" on public.organizations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "org owner can read data" on public.app_data;
create policy "org owner can read data" on public.app_data for select to authenticated using (exists(select 1 from public.organizations o where o.id=app_data.org_id and o.owner_id=auth.uid()));
drop policy if exists "org owner can insert data" on public.app_data;
create policy "org owner can insert data" on public.app_data for insert to authenticated with check (exists(select 1 from public.organizations o where o.id=app_data.org_id and o.owner_id=auth.uid()));
drop policy if exists "org owner can update data" on public.app_data;
create policy "org owner can update data" on public.app_data for update to authenticated using (exists(select 1 from public.organizations o where o.id=app_data.org_id and o.owner_id=auth.uid())) with check (exists(select 1 from public.organizations o where o.id=app_data.org_id and o.owner_id=auth.uid()));

drop policy if exists "org owner can manage subscription" on public.subscriptions;
create policy "org owner can manage subscription" on public.subscriptions for all to authenticated using (exists(select 1 from public.organizations o where o.id=subscriptions.org_id and o.owner_id=auth.uid())) with check (exists(select 1 from public.organizations o where o.id=subscriptions.org_id and o.owner_id=auth.uid()));

drop policy if exists "org owner can manage admission forms" on public.public_admission_forms;
create policy "org owner can manage admission forms" on public.public_admission_forms for all to authenticated using (exists(select 1 from public.organizations o where o.id=public_admission_forms.org_id and o.owner_id=auth.uid())) with check (exists(select 1 from public.organizations o where o.id=public_admission_forms.org_id and o.owner_id=auth.uid()));

-- Public admission/payment tables intentionally do NOT receive broad anon write policies here.
-- Public submissions and payment verification must go through secure server-side/Edge Functions
-- after the payment provider is selected. This prevents a client from bypassing payment status.

-- Useful grants for the browser client. RLS remains the security boundary.
grant select, insert, update on public.organizations to authenticated;
grant select, insert, update on public.app_data to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, insert, update on public.public_admission_forms to authenticated;
