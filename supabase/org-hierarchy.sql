-- ToVi Org Hierarchy Schema
-- Run this in the Supabase SQL editor after schema.sql

-- Teams table (hierarchical)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  parent_team_id uuid references public.teams(id) on delete set null,
  name text not null,
  level text not null check (level in ('department', 'team')),
  budget_credits numeric default 0,
  created_at timestamptz default now()
);

alter table public.teams enable row level security;

-- Team members table
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  user_email text not null,
  role text not null default 'member' check (role in ('manager', 'member')),
  joined_at timestamptz default now(),
  unique(team_id, user_email)
);

alter table public.team_members enable row level security;

-- Roles table (org-level role assignments)
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  org_id uuid references public.organizations(id) on delete cascade,
  role_type text not null check (role_type in ('vp', 'director', 'manager', 'member')),
  scope_team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz default now(),
  unique(user_email, org_id) -- one role per org per user
);

alter table public.roles enable row level security;

-- Audit log for role-based drill-downs
create table if not exists public.access_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  org_id uuid references public.organizations(id) on delete cascade,
  action text not null, -- e.g. 'vp_drill_to_team', 'director_drill_to_team'
  target_team_id uuid references public.teams(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.access_audit_log enable row level security;

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Teams: users can see teams in their org
create policy "Users can view teams in own org" on public.teams
  for select using (
    org_id in (
      select org_id from public.roles where user_email = auth.jwt() ->> 'email'
    )
  );

-- Team members: scoped by role
-- VPs can see all team members in their org
-- Directors can see team members in their department's teams
-- Managers can see team members in their team only
create policy "Role-scoped team member access" on public.team_members
  for select using (
    exists (
      select 1 from public.roles r
      join public.teams t on t.id = team_members.team_id
      where r.user_email = auth.jwt() ->> 'email'
      and r.org_id = t.org_id
      and (
        r.role_type = 'vp'
        or (r.role_type = 'director' and (
          team_members.team_id = r.scope_team_id
          or team_members.team_id in (
            select id from public.teams where parent_team_id = r.scope_team_id
          )
        ))
        or (r.role_type = 'manager' and team_members.team_id = r.scope_team_id)
        or (r.role_type = 'member' and team_members.user_email = auth.jwt() ->> 'email')
      )
    )
  );

-- Roles: users can see their own role
create policy "Users can view own role" on public.roles
  for select using (user_email = auth.jwt() ->> 'email');

-- Audit log: only the user's own entries
create policy "Users can view own audit log" on public.access_audit_log
  for select using (user_email = auth.jwt() ->> 'email');

create policy "Users can insert audit log" on public.access_audit_log
  for insert with check (user_email = auth.jwt() ->> 'email');

-- ============================================
-- Indexes
-- ============================================
create index if not exists idx_teams_org on public.teams(org_id);
create index if not exists idx_teams_parent on public.teams(parent_team_id);
create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_email on public.team_members(user_email);
create index if not exists idx_roles_email on public.roles(user_email);
create index if not exists idx_roles_org on public.roles(org_id);
create index if not exists idx_audit_log_org on public.access_audit_log(org_id);
