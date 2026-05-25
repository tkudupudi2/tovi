-- ToVi Database Schema
-- Run this in the Supabase SQL editor to set up the database

-- Organizations table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text not null,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

alter table public.organizations enable row level security;

create policy "Users can view own org" on public.organizations
  for select using (auth.jwt() ->> 'email' = owner_email);

create policy "Users can update own org" on public.organizations
  for update using (auth.jwt() ->> 'email' = owner_email);

create policy "Users can insert org" on public.organizations
  for insert with check (auth.jwt() ->> 'email' = owner_email);

-- API connections table (stores encrypted API keys)
create table if not exists public.api_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  tool_name text not null check (tool_name in ('windsurf', 'anthropic', 'copilot')),
  api_key_encrypted text not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(org_id, tool_name)
);

alter table public.api_connections enable row level security;

create policy "Users can manage own connections" on public.api_connections
  for all using (
    org_id in (select id from public.organizations where owner_email = auth.jwt() ->> 'email')
  );

-- Usage records table
create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  user_email text not null,
  tool_name text not null check (tool_name in ('windsurf', 'anthropic', 'copilot')),
  credits_used numeric not null default 0,
  credits_remaining numeric not null default 0,
  last_active timestamptz,
  synced_at timestamptz default now()
);

alter table public.usage_records enable row level security;

create policy "Users can view own org usage" on public.usage_records
  for all using (
    org_id in (select id from public.organizations where owner_email = auth.jwt() ->> 'email')
  );

-- Alert rules table
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  rule_type text not null check (rule_type in ('user_threshold', 'burn_rate')),
  threshold_value numeric not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.alert_rules enable row level security;

create policy "Users can manage own alerts" on public.alert_rules
  for all using (
    org_id in (select id from public.organizations where owner_email = auth.jwt() ->> 'email')
  );

-- Indexes for performance
create index if not exists idx_usage_org_id on public.usage_records(org_id);
create index if not exists idx_usage_tool on public.usage_records(tool_name);
create index if not exists idx_usage_synced on public.usage_records(synced_at);
create index if not exists idx_connections_org on public.api_connections(org_id);
create index if not exists idx_alerts_org on public.alert_rules(org_id);
