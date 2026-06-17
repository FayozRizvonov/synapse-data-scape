-- Job tracking table for async MMM pipeline runs (Celery tasks).
-- One row per /model/train call; status transitions: queued → running → done | failed

create table if not exists public.mmm_runs (
  id               uuid        primary key default gen_random_uuid(),
  project_id       text        not null,
  status           text        not null default 'queued'
                               check (status in ('queued','running','done','failed')),
  created_at       timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz,
  error_message    text,
  stability_level  int,
  model_id         uuid references public.mmm_models(id),
  dataset_info     jsonb       -- {data_key, info_key, spend_key} in Supabase storage
);

create index if not exists idx_mmm_runs_project_id  on public.mmm_runs(project_id);
create index if not exists idx_mmm_runs_status      on public.mmm_runs(status);
create index if not exists idx_mmm_runs_created_at  on public.mmm_runs(created_at desc);

alter table public.mmm_runs enable row level security;

-- Members of the project company can read their own runs
create policy mmm_runs_select_member
on public.mmm_runs for select
to authenticated
using (
  exists (
    select 1 from public.company_members cm
    where cm.user_id  = auth.uid()
      and cm.company_id::text = mmm_runs.project_id
  )
  -- also allow if project_id is numeric (legacy int project IDs)
  or project_id = (select company_id::text from public.company_members where user_id = auth.uid() limit 1)
);

-- Service role can insert/update (Celery worker uses service role key)
create policy mmm_runs_service_role_all
on public.mmm_runs for all
to service_role
using (true)
with check (true);
