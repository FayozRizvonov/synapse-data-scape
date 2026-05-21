-- Milestone 6: Feature flags for controlled rollout of the new orchestrator.
--
-- Usage:
--   rollout_pct = 0    → disabled for everyone
--   rollout_pct = 100  → enabled for everyone
--   rollout_pct = 50   → enabled for ~50% of users (deterministic by user_id hash)
--   company_ids set    → only those companies are eligible (regardless of pct)

create table if not exists public.feature_flags (
  key           text        primary key,
  enabled       boolean     not null default false,
  rollout_pct   integer     not null default 0 check (rollout_pct between 0 and 100),
  company_ids   uuid[],                     -- null = all companies
  description   text,
  updated_at    timestamptz not null default now(),
  updated_by    uuid        references auth.users(id) on delete set null
);

alter table public.feature_flags enable row level security;

-- Anyone authenticated can read flags (needed client-side)
create policy if not exists feature_flags_select_authenticated
  on public.feature_flags for select to authenticated
  using (true);

-- Only admins (service role or explicit grant) may write flags
create policy if not exists feature_flags_write_service
  on public.feature_flags for all to service_role
  using (true) with check (true);

-- Seed the orchestrator streaming flag (off by default for safe rollout)
insert into public.feature_flags (key, enabled, rollout_pct, description)
values
  ('streaming_orchestrator', false, 0,  'Route chat + voice through orchestrator-stream (SSE). Increment rollout_pct to gradually enable.'),
  ('orchestrator_v2',        true,  100, 'Route chat + voice through the non-streaming orchestrator (M2-M4). Replaces legacy ai-assistant / voice-assistant.')
on conflict (key) do nothing;
