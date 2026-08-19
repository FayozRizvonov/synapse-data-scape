-- Make mmm_runs.project_id a real uuid referencing brands(id).
--
-- project_id was text here while mmm_models.project_id and
-- mmm_model_outputs.project_id are uuid.  That inconsistency is what let a
-- non-UUID id ("1") pass job creation and fail only after a full training run,
-- and it is why the original RLS policy had to compare strings.  Typing the
-- column and adding the foreign key makes both classes of bug impossible:
-- an id that is not a real brand can no longer be inserted at all.
--
-- Removes 4 rows left over from testing whose project_id was the literal '1'.
-- They reference no model (model_id is null), nothing references mmm_runs
-- (no inbound foreign keys), and they were invisible under any correct RLS
-- policy since no brand has that id.

delete from public.mmm_runs
where project_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

-- Postgres refuses to alter a column a policy depends on, so the policy is
-- dropped first and recreated below against the new uuid column.
drop policy if exists mmm_runs_select_member on public.mmm_runs;

alter table public.mmm_runs
  alter column project_id type uuid using project_id::uuid;

-- on delete restrict: run history is an audit trail, so removing a brand that
-- still has runs must be a deliberate act rather than a silent cascade.
alter table public.mmm_runs
  add constraint mmm_runs_project_id_fkey
  foreign key (project_id) references public.brands(id)
  on delete restrict;

create index if not exists idx_mmm_runs_project_id on public.mmm_runs(project_id);

-- Recreated against the uuid column: no text cast, so it can use brands'
-- primary key index directly.
create policy mmm_runs_select_member
on public.mmm_runs for select
to authenticated
using (
  exists (
    select 1
    from public.brands b
    join public.company_members cm on cm.company_id = b.company_id
    where b.id = mmm_runs.project_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
  )
);
