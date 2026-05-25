-- ToVi Model Efficiency Schema
-- Run this in the Supabase SQL editor after schema.sql

-- Per-request model usage log
create table if not exists public.model_usage (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  tool_name text not null check (tool_name in ('windsurf', 'anthropic', 'copilot')),
  model_name text not null,
  token_count integer not null default 0,
  request_type text, -- 'chat', 'completion', 'edit', etc.
  timestamp timestamptz default now(),
  org_id uuid references public.organizations(id) on delete cascade
);

alter table public.model_usage enable row level security;

create policy "Users can view own org model usage" on public.model_usage
  for select using (
    org_id in (select id from public.organizations where owner_email = auth.jwt() ->> 'email')
  );

-- Weekly efficiency scores (materialized per user per week)
create table if not exists public.model_efficiency_scores (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  org_id uuid references public.organizations(id) on delete cascade,
  week_start date not null,
  total_requests integer not null default 0,
  avg_tokens_per_request numeric not null default 0,
  premium_model_usage_pct numeric not null default 0,
  efficiency_score numeric not null default 50,
  calculated_at timestamptz default now(),
  unique(user_email, org_id, week_start)
);

alter table public.model_efficiency_scores enable row level security;

create policy "Users can view own org efficiency" on public.model_efficiency_scores
  for select using (
    org_id in (select id from public.organizations where owner_email = auth.jwt() ->> 'email')
  );

-- Indexes
create index if not exists idx_model_usage_org on public.model_usage(org_id);
create index if not exists idx_model_usage_user on public.model_usage(user_email);
create index if not exists idx_model_usage_ts on public.model_usage(timestamp);
create index if not exists idx_model_usage_model on public.model_usage(model_name);
create index if not exists idx_efficiency_org on public.model_efficiency_scores(org_id);
create index if not exists idx_efficiency_week on public.model_efficiency_scores(week_start);
