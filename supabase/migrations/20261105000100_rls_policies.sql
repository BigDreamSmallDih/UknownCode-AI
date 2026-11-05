-- Row Level Security and privileges.
--
-- Write model:
--   * Users may directly manage only: their profile, their projects, and the NON-secret
--     columns of their ai_providers rows.
--   * Everything else is read-only for users. The backend writes it with the service role
--     (which bypasses RLS) after validating the request, e.g. agent tasks, file changes,
--     executions and usage logs. This keeps users from forging audit data.

alter table public.profiles enable row level security;
alter table public.github_connections enable row level security;
alter table public.projects enable row level security;
alter table public.ai_providers enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.file_changes enable row level security;
alter table public.executions enable row level security;
alter table public.usage_logs enable row level security;

-- Start from zero privileges, then grant exactly what is needed.
revoke all on all tables in schema public from anon, authenticated;

-- profiles
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- projects (full CRUD for the owner)
grant select, insert, update, delete on public.projects to authenticated;

create policy projects_select_own on public.projects
  for select to authenticated using (user_id = (select auth.uid()));
create policy projects_insert_own on public.projects
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy projects_update_own on public.projects
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy projects_delete_own on public.projects
  for delete to authenticated using (user_id = (select auth.uid()));

-- ai_providers: no privilege on vault_secret_id, so the client can never read or set it.
grant select (id, user_id, provider, label, default_model, enabled, created_at, updated_at)
  on public.ai_providers to authenticated;
grant insert (user_id, provider, label, default_model, enabled)
  on public.ai_providers to authenticated;
grant update (label, default_model, enabled) on public.ai_providers to authenticated;
grant delete on public.ai_providers to authenticated;

create policy ai_providers_select_own on public.ai_providers
  for select to authenticated using (user_id = (select auth.uid()));
create policy ai_providers_insert_own on public.ai_providers
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy ai_providers_update_own on public.ai_providers
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy ai_providers_delete_own on public.ai_providers
  for delete to authenticated using (user_id = (select auth.uid()));

-- Read-only for the owner; written by the backend (service role).
grant select on public.github_connections to authenticated;
grant select on public.agent_sessions to authenticated;
grant select on public.agent_tasks to authenticated;
grant select on public.file_changes to authenticated;
grant select on public.executions to authenticated;
grant select on public.usage_logs to authenticated;

create policy github_connections_select_own on public.github_connections
  for select to authenticated using (user_id = (select auth.uid()));
create policy agent_sessions_select_own on public.agent_sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy agent_tasks_select_own on public.agent_tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy file_changes_select_own on public.file_changes
  for select to authenticated using (user_id = (select auth.uid()));
create policy executions_select_own on public.executions
  for select to authenticated using (user_id = (select auth.uid()));
create policy usage_logs_select_own on public.usage_logs
  for select to authenticated using (user_id = (select auth.uid()));
