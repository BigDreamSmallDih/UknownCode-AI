-- UknownCode AI: initial schema (Phase 1 design, applied in Phase 2 together with auth).
--
-- Ownership model: every row belongs to one user (user_id). Child tables use composite
-- foreign keys (parent_id, user_id) so a row can never point to another user's parent.
-- Secrets (AI provider API keys) are NEVER stored in these tables; only a reference to a
-- Supabase Vault secret is kept. GitHub App installation tokens are short-lived and are minted
-- by the backend on demand, so no GitHub token is stored at all.

create extension if not exists pgcrypto;

-- Shared trigger function: keep updated_at current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles --------------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- github_connections ----------------------------------------------------------------------
-- One row per GitHub App installation linked to a user. No tokens are stored.
create table public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  installation_id bigint not null,
  github_login text not null,
  account_type text not null check (account_type in ('User', 'Organization')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, installation_id)
);

create index github_connections_user_id_idx on public.github_connections (user_id);

create trigger github_connections_set_updated_at
  before update on public.github_connections
  for each row execute function public.set_updated_at();

-- projects --------------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  github_repo_full_name text check (github_repo_full_name ~ '^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$'),
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index projects_user_id_idx on public.projects (user_id);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ai_providers ----------------------------------------------------------------------------
-- Per-user provider configuration. The API key itself lives in Supabase Vault;
-- vault_secret_id only references it and is writable by the backend (service role) only.
create table public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('gemini', 'claude', 'openai')),
  label text not null check (char_length(label) between 1 and 80),
  default_model text,
  enabled boolean not null default true,
  vault_secret_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, label)
);

create index ai_providers_user_id_idx on public.ai_providers (user_id);

create trigger ai_providers_set_updated_at
  before update on public.ai_providers
  for each row execute function public.set_updated_at();

-- agent_sessions --------------------------------------------------------------------------
create table public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null,
  title text not null default 'Sesi baru',
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  provider text check (provider in ('gemini', 'claude', 'openai')),
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade
);

create index agent_sessions_user_id_idx on public.agent_sessions (user_id);
create index agent_sessions_project_id_idx on public.agent_sessions (project_id);

create trigger agent_sessions_set_updated_at
  before update on public.agent_sessions
  for each row execute function public.set_updated_at();

-- agent_tasks -----------------------------------------------------------------------------
create table public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid not null,
  stage text not null check (
    stage in ('analysis', 'planning', 'execution', 'review', 'testing', 'fixing', 'final_review', 'commit')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'awaiting_approval', 'approved', 'running', 'done', 'failed', 'rejected')
  ),
  description text not null,
  plan jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (session_id, user_id) references public.agent_sessions (id, user_id) on delete cascade
);

create index agent_tasks_user_id_idx on public.agent_tasks (user_id);
create index agent_tasks_session_id_idx on public.agent_tasks (session_id);

create trigger agent_tasks_set_updated_at
  before update on public.agent_tasks
  for each row execute function public.set_updated_at();

-- file_changes ----------------------------------------------------------------------------
-- Proposed changes. Nothing is committed to GitHub until approved is true.
create table public.file_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null,
  path text not null,
  old_path text,
  change_type text not null check (change_type in ('create', 'modify', 'delete', 'rename')),
  diff text,
  new_content text,
  approved boolean,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (task_id, user_id) references public.agent_tasks (id, user_id) on delete cascade
);

create index file_changes_user_id_idx on public.file_changes (user_id);
create index file_changes_task_id_idx on public.file_changes (task_id);

-- executions ------------------------------------------------------------------------------
-- Audit trail of sandboxed command runs (Phase 7).
create table public.executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null,
  task_id uuid,
  command text not null,
  status text not null default 'queued' check (
    status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'timed_out')
  ),
  exit_code integer,
  log text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete cascade,
  foreign key (task_id, user_id) references public.agent_tasks (id, user_id) on delete set null (task_id)
);

create index executions_user_id_idx on public.executions (user_id);
create index executions_project_id_idx on public.executions (project_id);
create index executions_task_id_idx on public.executions (task_id);

-- usage_logs ------------------------------------------------------------------------------
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid,
  provider text not null check (provider in ('gemini', 'claude', 'openai')),
  model text not null,
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  latency_ms integer check (latency_ms >= 0),
  status text not null check (status in ('success', 'error', 'timeout')),
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id) references public.agent_sessions (id, user_id) on delete set null (session_id)
);

create index usage_logs_user_id_created_at_idx on public.usage_logs (user_id, created_at desc);
create index usage_logs_session_id_idx on public.usage_logs (session_id);
