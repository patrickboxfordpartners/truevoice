-- Add subscription/billing fields to companies table
alter table public.companies
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'starter', 'pro', 'scale')),
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Index for Stripe customer lookups from webhooks
create index if not exists companies_stripe_customer_id_idx
  on public.companies (stripe_customer_id)
  where stripe_customer_id is not null;
