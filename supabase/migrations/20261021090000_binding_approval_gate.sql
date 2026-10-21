-- Make the model approval gate work, and make it bind.
--
-- Two separate defects:
--
-- 1. APPROVAL WAS IMPOSSIBLE. approve_mmm_model joined
--        company_members.company_id = mmm_models.project_id
--    but project_id is a BRAND id, not a company id. The join could never match, so
--    the function raised 'Only admins can approve models' for everyone including
--    admins. Measured before this migration: 142 models, 0 approved, 0 approval
--    records, and the join found 0 rows. The correct chain is
--        mmm_models.project_id -> brands.id -> brands.company_id -> company_members
--    which finds 54 rows on the same data.
--
-- 2. THE GOVERNANCE VERDICT BOUND NOTHING. run_mmm_pipeline computes R-hat / ESS /
--    divergence checks and a pass/fail verdict, stores it at
--    mmm_models.model_config->'governance', and nothing ever read it. A model that
--    failed every convergence check could be approved exactly as easily as one that
--    passed. Same for out-of-sample skill once MMM_HOLDOUT_PERIODS is enabled.
--
-- The gate now refuses approval when the evidence says no. Missing evidence counts as
-- failure, not as a pass: 129 of 142 existing models carry no governance record at all
-- (legacy Orbit rows and pre-governance PyMC5 runs) and must not be waved through.
-- Deliberate exceptions go through p_override_reason, which still approves but records
-- the override and the evidence that was overridden.

-- ---------------------------------------------------------------------------
-- audit trail for what the gate saw
-- ---------------------------------------------------------------------------

alter table public.model_approvals
  add column if not exists evidence jsonb;

comment on column public.model_approvals.evidence is
  'Snapshot of the governance and holdout evidence at approval time, including '
  'whether the gate was overridden. Written by approve_mmm_model.';

-- ---------------------------------------------------------------------------
-- read-only helper: what does the gate think of this model?
-- ---------------------------------------------------------------------------

create or replace function public.mmm_model_gate_status(model_uuid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  v_config      jsonb;
  v_gov         jsonb;
  v_holdout     jsonb;
  v_blockers    text[] := array[]::text[];
  v_skill       numeric;
begin
  select model_config into v_config from public.mmm_models where id = model_uuid;

  if not found then
    return jsonb_build_object('exists', false);
  end if;

  v_gov := v_config -> 'governance';

  -- Most recent holdout evidence for this model, if out-of-sample validation ran.
  select output_data into v_holdout
    from public.mmm_model_outputs
   where model_id = model_uuid
     and output_type = 'holdout_metrics'
   order by generated_at desc
   limit 1;

  -- Convergence evidence is mandatory. Absent evidence is not passing evidence.
  if v_gov is null or v_gov = 'null'::jsonb or v_gov = '{}'::jsonb then
    v_blockers := array_append(v_blockers, 'no convergence evidence (model_config.governance is absent)');
  elsif coalesce(v_gov ->> 'passed', 'false') <> 'true' then
    v_blockers := array_append(v_blockers, format(
      'governance gate failed (max_rhat=%s, min_ess=%s, divergences=%s)',
      coalesce(v_gov ->> 'max_rhat', '?'),
      coalesce(v_gov ->> 'min_ess', '?'),
      coalesce(v_gov ->> 'n_divergences', '?')
    ));
  end if;

  -- Out-of-sample evidence is optional (MMM_HOLDOUT_PERIODS defaults to 0), but when
  -- it exists it is binding.
  if v_holdout is not null then
    if coalesce(v_holdout ->> 'trustworthy', 'false') <> 'true' then
      v_blockers := array_append(v_blockers, 'holdout scores are not trustworthy (the NumPy forward model no longer mirrors pymc_mmm.py)');
    end if;

    begin
      v_skill := (v_holdout ->> 'skill_vs_naive')::numeric;
    exception when others then
      v_skill := null;
    end;

    if v_skill is null then
      v_blockers := array_append(v_blockers, 'holdout evidence present but skill_vs_naive is missing');
    elsif v_skill <= 0 then
      v_blockers := array_append(v_blockers, format(
        'model does not beat predicting the training mean out-of-sample (skill_vs_naive=%s)',
        v_skill
      ));
    end if;
  end if;

  return jsonb_build_object(
    'exists',          true,
    'can_approve',     cardinality(v_blockers) = 0,
    'blockers',        to_jsonb(v_blockers),
    'governance',      v_gov,
    'holdout',         v_holdout,
    'holdout_present', v_holdout is not null
  );
end;
$function$;

comment on function public.mmm_model_gate_status(uuid) is
  'Read-only: would approve_mmm_model accept this model, and if not, why. '
  'Changes nothing.';

-- ---------------------------------------------------------------------------
-- the gate itself
-- ---------------------------------------------------------------------------

-- The old signature is (uuid, text). Adding a third parameter with CREATE OR REPLACE
-- would create an *overload* rather than replace it, leaving the broken two-argument
-- version in place to capture every existing two-argument RPC call. Drop it first.
drop function if exists public.approve_mmm_model(uuid, text);

create or replace function public.approve_mmm_model(
  model_uuid        uuid,
  approval_notes    text default null,
  p_override_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_status    jsonb;
  v_blockers  text;
  v_overridden boolean := p_override_reason is not null
                          and length(btrim(p_override_reason)) > 0;
begin
  -- Authorisation. project_id is a brands.id, so the company is reached through
  -- brands.company_id -- joining company_members directly on project_id can never
  -- match, which is what made this function reject everyone.
  if not exists (
    select 1
      from public.mmm_models mm
      join public.brands b           on b.id = mm.project_id
      join public.company_members cm on cm.company_id = b.company_id
     where mm.id = model_uuid
       and cm.user_id = auth.uid()
       and cm.role = 'admin'
       and coalesce(cm.status, 'active') = 'active'
  ) then
    raise exception 'Only an active admin of this model''s company can approve it';
  end if;

  v_status := public.mmm_model_gate_status(model_uuid);

  if not (v_status ->> 'exists')::boolean then
    raise exception 'Model % does not exist', model_uuid;
  end if;

  if not (v_status ->> 'can_approve')::boolean and not v_overridden then
    select string_agg(value, '; ') into v_blockers
      from jsonb_array_elements_text(v_status -> 'blockers');

    raise exception
      'Model % cannot be approved: %. Pass p_override_reason to approve anyway; the override is recorded.',
      model_uuid, v_blockers;
  end if;

  update public.mmm_models
     set is_approved = true,
         approved_by = auth.uid(),
         approved_at = now(),
         updated_at  = now()
   where id = model_uuid;

  insert into public.model_approvals
    (model_id, approver_id, approval_status, approval_notes, evidence)
  values (
    model_uuid,
    auth.uid(),
    case when v_overridden and not (v_status ->> 'can_approve')::boolean
         then 'approved_with_override'
         else 'approved' end,
    approval_notes,
    v_status
      || jsonb_build_object(
           'overridden',      v_overridden and not (v_status ->> 'can_approve')::boolean,
           'override_reason', case when v_overridden then p_override_reason end
         )
  );

  return true;
end;
$function$;

comment on function public.approve_mmm_model(uuid, text, text) is
  'Approve a model for use in scenarios. Refuses when convergence evidence is absent '
  'or failing, or when out-of-sample evidence shows the model does not beat a naive '
  'baseline. p_override_reason approves anyway and records the override.';
